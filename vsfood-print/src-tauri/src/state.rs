use std::sync::Mutex;

#[derive(Debug, Clone)]
pub struct DeviceSession {
    pub token: String,
    /// Guardado pra uso futuro (ex.: telas de diagnóstico) — hoje nada lê este campo.
    #[allow(dead_code)]
    pub device_id: String,
    pub restaurant_name: String,
}

#[derive(Debug, Default)]
pub struct AppStateInner {
    pub session: Option<DeviceSession>,
    pub selected_printer: Option<String>,
    pub auto_print: bool,
    /// Tray "Pausar impressão" — para o polling automático sem desconectar o dispositivo.
    pub paused: bool,
    pub printer_available: bool,
}

pub type AppState = Mutex<AppStateInner>;
