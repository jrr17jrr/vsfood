//! Impressão A4 via GDI, direto no driver da impressora escolhida — nunca
//! passa pelo diálogo "Imprimir" do Windows (CreateDC/StartDoc/StartPage são
//! chamadas de baixo nível; o diálogo é uma peça de UI totalmente separada
//! que simplesmente não entra em cena aqui). Isso garante que QUALQUER
//! impressora com driver instalado no Windows funciona — a laser, a jato de
//! tinta, HP, Epson, Canon etc. — porque quem desenha a página é o próprio
//! driver, não um dialeto tipo PCL/ESC-POS que nem toda impressora entende.
//!
//! 58mm/80mm no futuro NÃO usam este arquivo: usam windows_spool::print_raw
//! com bytes ESC/POS (ver printing::ticket pra a lista de linhas comum aos
//! dois formatos).

use super::ticket::TicketLine;
use windows::core::PCWSTR;
use windows::Win32::Foundation::HWND;
use windows::Win32::Graphics::Gdi::{
    CreateFontW, CreateDCW, DeleteDC, DeleteObject, LineTo, MoveToEx, SelectObject,
    TextOutW, FW_BOLD, FW_NORMAL, GetDeviceCaps, DEFAULT_CHARSET,
    DEFAULT_PITCH, FF_SWISS, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY,
    HORZRES, VERTRES, LOGPIXELSY,
};
// StartDoc/EndDoc/StartPage/EndPage/DOCINFOW vivem em Storage::Xps na crate
// `windows` (não em Graphics::Gdi, apesar de operarem em cima de um HDC).
use windows::Win32::Storage::Xps::{EndDoc, EndPage, StartDocW, StartPage, DOCINFOW};

fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

#[derive(Debug, thiserror::Error)]
pub enum RenderError {
    #[error("Não foi possível acessar a impressora \"{0}\".")]
    CreateDcFailed(String),
    #[error("Não foi possível iniciar o documento de impressão.")]
    StartDocFailed,
    #[error("Não foi possível iniciar a página de impressão.")]
    StartPageFailed,
}

/// Desenha `lines` (repetido `copies` vezes, cada via em uma página) na
/// impressora `printer_name`. Tamanho de fonte generoso — pensado pra ser
/// lido rápido na cozinha, não pra caber o máximo de texto possível.
pub fn print_a4(printer_name: &str, document_name: &str, lines: &[TicketLine], copies: u32) -> Result<(), RenderError> {
    unsafe {
        let printer_name_w = to_wide(printer_name);
        let hdc = CreateDCW(PCWSTR::null(), PCWSTR(printer_name_w.as_ptr()), PCWSTR::null(), None);
        if hdc.is_invalid() {
            return Err(RenderError::CreateDcFailed(printer_name.to_string()));
        }

        let doc_name_w = to_wide(document_name);
        let doc_info = DOCINFOW {
            cbSize: std::mem::size_of::<DOCINFOW>() as i32,
            lpszDocName: PCWSTR(doc_name_w.as_ptr()),
            lpszOutput: PCWSTR::null(),
            lpszDatatype: PCWSTR::null(),
            fwType: 0,
        };

        if StartDocW(hdc, &doc_info) <= 0 {
            let _ = DeleteDC(hdc);
            return Err(RenderError::StartDocFailed);
        }

        let dpi_y = GetDeviceCaps(Some(hdc), LOGPIXELSY);
        let page_width = GetDeviceCaps(Some(hdc), HORZRES);
        let page_height = GetDeviceCaps(Some(hdc), VERTRES);
        let margin = dpi_y / 2; // ~0,5"

        // Tipografia grande o suficiente pra cozinha: ~12pt normal, ~16pt título/negrito.
        let font_normal = create_font(dpi_y, 12, FW_NORMAL.0 as i32);
        let font_bold = create_font(dpi_y, 14, FW_BOLD.0 as i32);
        let font_title = create_font(dpi_y, 18, FW_BOLD.0 as i32);
        let font_small = create_font(dpi_y, 10, FW_NORMAL.0 as i32);

        for _ in 0..copies.max(1) {
            if StartPage(hdc) <= 0 {
                let _ = EndDoc(hdc);
                let _ = DeleteDC(hdc);
                cleanup_fonts(&[font_normal, font_bold, font_title, font_small]);
                return Err(RenderError::StartPageFailed);
            }

            let mut y = margin;
            let line_gap = dpi_y / 6;

            for line in lines {
                let (font, text, is_divider) = match line {
                    TicketLine::Title(t) => (font_title, t.clone(), false),
                    TicketLine::Bold(t) => (font_bold, t.clone(), false),
                    TicketLine::Normal(t) => (font_normal, t.clone(), false),
                    TicketLine::Small(t) => (font_small, t.clone(), false),
                    TicketLine::KeyValue(k, v) => (font_normal, format!("{k}   {v}"), false),
                    TicketLine::Divider => (font_normal, String::new(), true),
                    TicketLine::Spacer => {
                        y += line_gap;
                        continue;
                    }
                };

                if is_divider {
                    let _ = MoveToEx(hdc, margin, y, None);
                    let _ = LineTo(hdc, page_width - margin, y);
                    y += line_gap;
                    continue;
                }

                let _ = SelectObject(hdc, font.into());
                let text_w = to_wide(&text);
                let _ = TextOutW(hdc, margin, y, &text_w[..text_w.len().saturating_sub(1)]);
                y += line_gap * 2;

                if y > page_height - margin {
                    break; // conteúdo maior que a página: corta em vez de estourar (V1 — sem paginação múltipla ainda)
                }
            }

            let _ = EndPage(hdc);
        }

        let _ = EndDoc(hdc);
        let _ = DeleteDC(hdc);
        cleanup_fonts(&[font_normal, font_bold, font_title, font_small]);

        Ok(())
    }
}

unsafe fn create_font(dpi_y: i32, point_size: i32, weight: i32) -> windows::Win32::Graphics::Gdi::HFONT {
    let height = -(point_size * dpi_y / 72);
    let face = to_wide("Consolas");
    CreateFontW(
        height,
        0,
        0,
        0,
        weight,
        0,
        0,
        0,
        DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS,
        CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY,
        (DEFAULT_PITCH.0 as u32) | (FF_SWISS.0 as u32),
        PCWSTR(face.as_ptr()),
    )
}

unsafe fn cleanup_fonts(fonts: &[windows::Win32::Graphics::Gdi::HFONT]) {
    for f in fonts {
        let _ = DeleteObject((*f).into());
    }
}

/// Enumeração de impressoras não depende de HWND — mantido aqui só como nota:
/// print_a4 nunca cria janelas nem diálogos (HWND::default() jamais é usado).
#[allow(dead_code)]
const _NO_DIALOG_MARKER: Option<HWND> = None;
