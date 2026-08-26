//! Loop de fundo: heartbeat periódico + busca/imprime a fila quando a
//! impressão automática está ativa. Roda inteiro em background (funciona
//! minimizado na bandeja) via tauri::async_runtime, sem travar a UI.

use crate::models::{HistoryEntry, HistoryStatus};
use crate::state::AppState;
use crate::{api_client, printing, settings};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
const PLATFORM: &str = "windows";
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(30);
const POLL_INTERVAL: Duration = Duration::from_secs(5);
const LOCAL_PRINT_RETRIES: u32 = 3;
const LOCAL_RETRY_DELAY: Duration = Duration::from_secs(2);

pub fn spawn(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut heartbeat_tick = tokio::time::interval(HEARTBEAT_INTERVAL);
        let mut poll_tick = tokio::time::interval(POLL_INTERVAL);
        loop {
            tokio::select! {
                _ = heartbeat_tick.tick() => do_heartbeat(&app).await,
                _ = poll_tick.tick() => do_poll_once(&app).await,
            }
        }
    });
}

fn current_token(app: &AppHandle) -> Option<String> {
    app.state::<AppState>().lock().ok()?.session.as_ref().map(|s| s.token.clone())
}

async fn do_heartbeat(app: &AppHandle) {
    let Some(token) = current_token(app) else { return };
    let result = api_client::heartbeat(&token, APP_VERSION, PLATFORM).await;
    let _ = app.emit("connection-status", result.is_ok());
}

async fn do_poll_once(app: &AppHandle) {
    let Some(token) = current_token(app) else { return };

    let (auto_print, paused, selected_printer) = {
        let state = app.state::<AppState>();
        let guard = state.lock().unwrap();
        (guard.auto_print, guard.paused, guard.selected_printer.clone())
    };
    if !auto_print || paused {
        return;
    }

    let Some(printer_name) = selected_printer else { return };

    // Confere a impressora ANTES de reivindicar qualquer pedido — assim, se
    // ela sumiu, o pedido nem é marcado "processing" e continua disponível
    // pra qualquer tentativa seguinte (própria ou de retry manual).
    let printers = printing::list_printers();
    let printer_ok = printers.iter().any(|p| p.name == printer_name);
    {
        let state = app.state::<AppState>();
        state.lock().unwrap().printer_available = printer_ok;
    }
    let _ = app.emit("printer-status", printer_ok);
    if !printer_ok {
        return;
    }

    let job = match api_client::next_job(&token).await {
        Ok(res) => res.job,
        Err(_) => {
            let _ = app.emit("connection-status", false);
            return;
        }
    };
    let _ = app.emit("connection-status", true);

    let Some(job) = job else { return };

    let mut last_error = String::new();
    let mut printed = false;
    for attempt in 1..=LOCAL_PRINT_RETRIES {
        match printing::print_job(&printer_name, &job) {
            Ok(()) => {
                printed = true;
                break;
            }
            Err(e) => {
                last_error = e;
                if attempt < LOCAL_PRINT_RETRIES {
                    tokio::time::sleep(LOCAL_RETRY_DELAY).await;
                }
            }
        }
    }

    if printed {
        let _ = api_client::report_success(&token, &job.order_id).await;
        settings::push_history(
            app,
            HistoryEntry {
                order_number: job.number.clone(),
                status: HistoryStatus::Printed,
                message: None,
                at: chrono::Local::now().to_rfc3339(),
            },
        );
        let _ = app.emit("job-printed", &job.number);
    } else {
        let _ = api_client::report_failure(&token, &job.order_id, &last_error).await;
        settings::push_history(
            app,
            HistoryEntry {
                order_number: job.number.clone(),
                status: HistoryStatus::Failed,
                message: Some(last_error.clone()),
                at: chrono::Local::now().to_rfc3339(),
            },
        );
        notify_failure(app, &job.number);
        let _ = app.emit("job-failed", serde_json::json!({ "number": job.number, "error": last_error }));
    }
}

fn notify_failure(app: &AppHandle, order_number: &str) {
    use tauri_plugin_notification::NotificationExt;
    let _ = app
        .notification()
        .builder()
        .title("VSFood Print")
        .body(format!("Falha ao imprimir pedido #{order_number}"))
        .show();
}
