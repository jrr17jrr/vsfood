mod api_client;
mod commands;
mod models;
mod printing;
mod queue;
mod secure_store;
mod settings;
mod state;

use state::{AppState, AppStateInner};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage::<AppState>(std::sync::Mutex::new(AppStateInner::default()))
        .invoke_handler(tauri::generate_handler![
            commands::get_session,
            commands::pair_device,
            commands::disconnect_device,
            commands::list_printers,
            commands::get_settings,
            commands::select_printer,
            commands::set_auto_print,
            commands::set_auto_start,
            commands::get_history,
            commands::print_test_page,
            commands::refresh_device_info,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Hidrata o estado em memória com as preferências já salvas (o
            // loop de fundo não precisa esperar a UI carregar pra saber qual
            // impressora usar / se auto-print está ligado).
            let saved = settings::load(&handle);
            {
                let state = handle.state::<AppState>();
                let mut guard = state.lock().unwrap();
                guard.selected_printer = saved.selected_printer;
                guard.auto_print = saved.auto_print;
            }

            setup_tray(&handle)?;
            queue::spawn(handle);
            Ok(())
        })
        .on_window_event(|window, event| {
            // Fechar no X minimiza pra bandeja em vez de encerrar — documentado
            // na tela (ver App.tsx) pra não parecer que o app travou/sumiu.
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, "open", "Abrir VSFood Print", true, None::<&str>)?;
    let pause_item = MenuItem::with_id(app, "pause", "Pausar impressão", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&open_item, &pause_item, &separator, &quit_item])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().expect("ícone padrão do app ausente"))
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "pause" => {
                let state = app.state::<AppState>();
                let mut guard = state.lock().unwrap();
                guard.paused = !guard.paused;
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
