use serde::{Deserialize, Serialize};

/// Espelha lib/print-devices/queue.ts (PrintJobPayload) no lado web — o app
/// nunca depende do HTML do painel, só desses campos já calculados.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintJobPayload {
    pub order_id: String,
    pub number: String,
    pub created_at: String,
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub delivery_type: String, // "delivery" | "pickup"
    pub address: Option<Address>,
    pub items: Vec<JobItem>,
    pub notes: Option<String>,
    pub subtotal: f64,
    pub delivery_fee: f64,
    pub discount: f64,
    pub total: f64,
    pub change_for: Option<f64>,
    pub payment_method_label: String,
    pub attempt: i32,
    pub restaurant_name: String,
    pub print_settings: PrintSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Address {
    pub street: String,
    pub number: String,
    pub complement: Option<String>,
    pub neighborhood: String,
    pub city: String,
    pub state: Option<String>,
    pub reference: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobItem {
    pub name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub subtotal: f64,
    pub notes: Option<String>,
    pub options: Vec<JobItemOption>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobItemOption {
    pub group_name: String,
    pub option_name: String,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintSettings {
    pub format: String, // "a4" | "80mm" | "58mm"
    pub copies: i32,
    pub show_prices: bool,
    pub show_address: bool,
    pub show_phone: bool,
    pub show_notes: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NextJobResponse {
    pub job: Option<PrintJobPayload>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairResponse {
    pub token: String,
    pub device_id: String,
    pub restaurant_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfoResponse {
    pub device_id: String,
    pub device_name: String,
    pub restaurant_name: String,
    pub auto_print_enabled: bool,
}

/// Uma entrada do histórico local (Últimas impressões, tela "Histórico").
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub order_number: String,
    pub status: HistoryStatus,
    pub message: Option<String>,
    pub at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HistoryStatus {
    Printed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
}
