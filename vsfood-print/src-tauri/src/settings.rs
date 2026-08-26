//! Preferências locais (não-secretas) do app — impressora escolhida,
//! impressão automática, iniciar com o Windows, e o histórico local de
//! impressões. Guardado como um JSON simples na pasta de dados do app
//! (nada sensível aqui: o token do dispositivo fica só no secure_store).

use crate::models::HistoryEntry;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

const HISTORY_LIMIT: usize = 50;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Settings {
    pub selected_printer: Option<String>,
    #[serde(default)]
    pub auto_print: bool,
    #[serde(default)]
    pub auto_start: bool,
    #[serde(default)]
    pub history: Vec<HistoryEntry>,
}

fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Não foi possível localizar a pasta de configuração: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Não foi possível criar a pasta de configuração: {e}"))?;
    Ok(dir.join("settings.json"))
}

pub fn load(app: &AppHandle) -> Settings {
    let Ok(path) = settings_path(app) else { return Settings::default() };
    let Ok(raw) = fs::read_to_string(path) else { return Settings::default() };
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app)?;
    let raw = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| format!("Não foi possível salvar as preferências: {e}"))
}

pub fn push_history(app: &AppHandle, entry: HistoryEntry) {
    let mut settings = load(app);
    settings.history.insert(0, entry);
    settings.history.truncate(HISTORY_LIMIT);
    let _ = save(app, &settings);
}
