use crate::models::{DeviceInfoResponse, HistoryEntry, PrinterInfo};
use crate::state::{AppState, DeviceSession};
use crate::{api_client, printing, secure_store, settings};
use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;

const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
const PLATFORM: &str = "windows";

#[derive(Serialize)]
pub struct SessionInfo {
    pub connected: bool,
    pub restaurant_name: String,
    pub device_name: String,
}

/// Chamado ao abrir o app: se já houver um token salvo no cofre de
/// credenciais, valida com o servidor e restaura a sessão em memória.
#[tauri::command]
pub async fn get_session(app: AppHandle) -> SessionInfo {
    let Some(token) = secure_store::load_token() else {
        return SessionInfo { connected: false, restaurant_name: String::new(), device_name: String::new() };
    };

    match api_client::device_info(&token).await {
        Ok(info) => {
            let state = app.state::<AppState>();
            state.lock().unwrap().session = Some(DeviceSession {
                token,
                device_id: info.device_id.clone(),
                restaurant_name: info.restaurant_name.clone(),
            });
            SessionInfo { connected: true, restaurant_name: info.restaurant_name, device_name: info.device_name }
        }
        Err(_) => {
            // Token inválido/revogado — limpa localmente pra voltar ao onboarding.
            let _ = secure_store::clear_token();
            SessionInfo { connected: false, restaurant_name: String::new(), device_name: String::new() }
        }
    }
}

#[tauri::command]
pub async fn pair_device(app: AppHandle, code: String) -> Result<SessionInfo, String> {
    let response = api_client::pair(&code, "Computador", PLATFORM, APP_VERSION).await?;
    secure_store::save_token(&response.token)?;

    let state = app.state::<AppState>();
    state.lock().unwrap().session = Some(DeviceSession {
        token: response.token,
        device_id: response.device_id,
        restaurant_name: response.restaurant_name.clone(),
    });

    Ok(SessionInfo { connected: true, restaurant_name: response.restaurant_name, device_name: "Computador".into() })
}

/// Desconecta LOCALMENTE (limpa o token deste computador). Revogar de
/// verdade (impedir o dispositivo de voltar a autenticar) é feito no painel
/// web, em Impressão > Dispositivos > Revogar acesso.
#[tauri::command]
pub fn disconnect_device(app: AppHandle) -> Result<(), String> {
    secure_store::clear_token()?;
    app.state::<AppState>().lock().unwrap().session = None;
    Ok(())
}

#[tauri::command]
pub fn list_printers() -> Vec<PrinterInfo> {
    printing::list_printers()
}

#[derive(Serialize)]
pub struct AppSettings {
    pub selected_printer: Option<String>,
    pub auto_print: bool,
    pub auto_start: bool,
    pub printer_available: bool,
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> AppSettings {
    let saved = settings::load(&app);
    let printer_available = app.state::<AppState>().lock().unwrap().printer_available;
    AppSettings {
        selected_printer: saved.selected_printer,
        auto_print: saved.auto_print,
        auto_start: saved.auto_start,
        printer_available,
    }
}

#[tauri::command]
pub fn select_printer(app: AppHandle, name: String) -> Result<(), String> {
    let mut saved = settings::load(&app);
    saved.selected_printer = Some(name.clone());
    settings::save(&app, &saved)?;
    app.state::<AppState>().lock().unwrap().selected_printer = Some(name);
    Ok(())
}

#[tauri::command]
pub fn set_auto_print(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut saved = settings::load(&app);
    saved.auto_print = enabled;
    settings::save(&app, &saved)?;
    app.state::<AppState>().lock().unwrap().auto_print = enabled;
    Ok(())
}

#[tauri::command]
pub fn set_auto_start(app: AppHandle, enabled: bool) -> Result<(), String> {
    let autostart = app.autolaunch();
    let result = if enabled { autostart.enable() } else { autostart.disable() };
    result.map_err(|e| format!("Não foi possível configurar a inicialização com o Windows: {e}"))?;

    let mut saved = settings::load(&app);
    saved.auto_start = enabled;
    settings::save(&app, &saved)?;
    Ok(())
}

#[tauri::command]
pub fn get_history(app: AppHandle) -> Vec<HistoryEntry> {
    settings::load(&app).history
}

#[tauri::command]
pub async fn print_test_page(app: AppHandle) -> Result<(), String> {
    let (printer_name, restaurant_name) = {
        let state = app.state::<AppState>();
        let guard = state.lock().unwrap();
        let printer = guard.selected_printer.clone().ok_or("Nenhuma impressora selecionada.")?;
        let restaurant = guard.session.as_ref().map(|s| s.restaurant_name.clone()).unwrap_or_default();
        (printer, restaurant)
    };
    printing::print_test_page(&printer_name, &restaurant_name)
}

/// Reflete o `restaurants.auto_print_enabled` do painel (o dono pode ligar o
/// toggle "Imprimir pedidos automaticamente" tanto no app quanto no painel).
#[tauri::command]
pub async fn refresh_device_info(app: AppHandle) -> Result<DeviceInfoResponse, String> {
    let token = {
        let state = app.state::<AppState>();
        let guard = state.lock().unwrap();
        guard.session.as_ref().map(|s| s.token.clone()).ok_or("Dispositivo não conectado.")?
    };
    api_client::device_info(&token).await
}
