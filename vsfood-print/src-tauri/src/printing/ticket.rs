//! Monta o CONTEÚDO da comanda de forma independente de formato — nem GDI
//! (A4), nem ESC/POS (58mm/80mm, futuro) aparecem aqui. `render_a4.rs`
//! consome essa lista de linhas hoje; um `render_escpos.rs` futuro consome a
//! MESMA lista pra gerar bytes ESC/POS. Isso é o que evita ter que reescrever
//! a comanda inteira quando 58mm/80mm forem implementados.

use crate::models::PrintJobPayload;

#[derive(Debug, Clone)]
pub enum TicketLine {
    Title(String),
    Normal(String),
    Bold(String),
    Small(String),
    /// Linha "rótulo ........ valor" (ex.: "Subtotal" / "R$ 32,00").
    KeyValue(String, String),
    Divider,
    Spacer,
}

fn brl(value: f64) -> String {
    format!("R$ {:.2}", value).replace('.', ",")
}

/// Uma via da comanda (chame N vezes pra `print_settings.copies`).
pub fn build_ticket_lines(job: &PrintJobPayload) -> Vec<TicketLine> {
    let s = &job.print_settings;
    let mut lines = Vec::new();

    lines.push(TicketLine::Title(job.restaurant_name.clone()));
    if s.show_phone {
        if let Some(phone) = &job.customer_phone {
            lines.push(TicketLine::Small(phone.clone()));
        }
    }
    lines.push(TicketLine::Divider);

    lines.push(TicketLine::Bold(format!("PEDIDO {}", job.number)));
    lines.push(TicketLine::Normal(job.created_at.clone()));
    lines.push(TicketLine::Normal(format!("Cliente: {}", job.customer_name)));
    lines.push(TicketLine::Bold(if job.delivery_type == "delivery" { "ENTREGA".into() } else { "RETIRADA".into() }));
    lines.push(TicketLine::Divider);

    for item in &job.items {
        let head = if s.show_prices {
            TicketLine::KeyValue(format!("{}x {}", item.quantity, item.name), brl(item.subtotal))
        } else {
            TicketLine::Normal(format!("{}x {}", item.quantity, item.name))
        };
        lines.push(head);
        for opt in &item.options {
            let suffix = if s.show_prices && opt.price > 0.0 { format!(" (+{})", brl(opt.price)) } else { String::new() };
            lines.push(TicketLine::Small(format!("  • {}{}", opt.option_name, suffix)));
        }
        if let Some(notes) = &item.notes {
            if !notes.is_empty() {
                lines.push(TicketLine::Small(format!("  \"{notes}\"")));
            }
        }
    }

    if s.show_notes {
        if let Some(notes) = &job.notes {
            if !notes.is_empty() {
                lines.push(TicketLine::Divider);
                lines.push(TicketLine::Bold("Observações do pedido".into()));
                lines.push(TicketLine::Normal(notes.clone()));
            }
        }
    }

    if job.delivery_type == "delivery" && s.show_address {
        if let Some(addr) = &job.address {
            lines.push(TicketLine::Divider);
            lines.push(TicketLine::Bold("Endereço".into()));
            let complement = addr.complement.as_deref().map(|c| format!(" - {c}")).unwrap_or_default();
            lines.push(TicketLine::Normal(format!("{}, {}{}", addr.street, addr.number, complement)));
            let state = addr.state.as_deref().map(|s| format!("/{s}")).unwrap_or_default();
            lines.push(TicketLine::Normal(format!("{}, {}{}", addr.neighborhood, addr.city, state)));
            if let Some(reference) = &addr.reference {
                if !reference.is_empty() {
                    lines.push(TicketLine::Small(format!("Ref: {reference}")));
                }
            }
        }
    }

    lines.push(TicketLine::Divider);
    lines.push(TicketLine::Normal(format!("Pagamento: {}", job.payment_method_label)));
    if let Some(change_for) = job.change_for {
        if s.show_prices {
            lines.push(TicketLine::Normal(format!("Troco para {}", brl(change_for))));
        }
    }

    if s.show_prices {
        lines.push(TicketLine::Divider);
        lines.push(TicketLine::KeyValue("Subtotal".into(), brl(job.subtotal)));
        if job.discount > 0.0 {
            lines.push(TicketLine::KeyValue("Desconto".into(), format!("-{}", brl(job.discount))));
        }
        if job.delivery_type == "delivery" {
            lines.push(TicketLine::KeyValue("Entrega".into(), brl(job.delivery_fee)));
        }
        lines.push(TicketLine::Bold(format!("TOTAL {}", brl(job.total))));
    }

    lines
}

/// Página de teste — não depende de nenhum pedido real.
pub fn build_test_page_lines(restaurant_name: &str, now: &str) -> Vec<TicketLine> {
    vec![
        TicketLine::Title("VSFood Print".into()),
        TicketLine::Divider,
        TicketLine::Bold("Teste de impressão".into()),
        TicketLine::Spacer,
        TicketLine::Normal("Se você está lendo isto, sua impressora".into()),
        TicketLine::Normal("está configurada corretamente.".into()),
        TicketLine::Spacer,
        TicketLine::Normal(now.to_string()),
        TicketLine::Normal(restaurant_name.to_string()),
    ]
}
