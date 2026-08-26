pub mod render_a4;
pub mod ticket;
pub mod windows_spool;

use crate::models::{PrintJobPayload, PrinterInfo};
use ticket::{build_test_page_lines, build_ticket_lines};

pub fn list_printers() -> Vec<PrinterInfo> {
    windows_spool::list_printers()
}

/// Ponto único de despacho por formato — hoje só "a4" tem implementação real.
/// 58mm/80mm retornam erro claro em vez de silenciosamente fazer a coisa
/// errada; quando o ESC/POS for implementado, o `match` ganha os outros
/// braços aqui, sem tocar em `ticket.rs` nem no restante do app.
pub fn print_job(printer_name: &str, job: &PrintJobPayload) -> Result<(), String> {
    let lines = build_ticket_lines(job);
    match job.print_settings.format.as_str() {
        "a4" => render_a4::print_a4(printer_name, &format!("Pedido {}", job.number), &lines, job.print_settings.copies.max(1) as u32)
            .map_err(|e| e.to_string()),
        other => Err(format!("Formato de impressão \"{other}\" ainda não suportado nesta versão (V1 é A4).")),
    }
}

pub fn print_test_page(printer_name: &str, restaurant_name: &str) -> Result<(), String> {
    let now = chrono::Local::now().format("%d/%m/%Y %H:%M").to_string();
    let lines = build_test_page_lines(restaurant_name, &now);
    render_a4::print_a4(printer_name, "VSFood Print — Teste", &lines, 1).map_err(|e| e.to_string())
}
