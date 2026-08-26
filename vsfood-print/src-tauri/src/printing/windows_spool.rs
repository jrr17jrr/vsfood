//! Fala direto com o Print Spooler do Windows (winspool) — EnumPrinters pra
//! listar, GetDefaultPrinter pra saber a padrão, e
//! OpenPrinter/StartDocPrinter(datatype "RAW")/WritePrinter/EndDocPrinter
//! pra imprimir. Esse é o mecanismo que garante impressão SILENCIOSA: em
//! nenhum momento pedimos pro shell "abrir e imprimir um arquivo" (que
//! dispara o diálogo do Windows) — os bytes vão direto pra fila de
//! impressão da impressora escolhida. Ver README.md, seção "Impressão
//! silenciosa", para a justificativa completa da abordagem.

use crate::models::PrinterInfo;
use windows::core::{PCWSTR, PWSTR};
use windows::Win32::Foundation::GetLastError;
use windows::Win32::Graphics::Printing::{
    ClosePrinter, EndDocPrinter, EndPagePrinter, EnumPrintersW, GetDefaultPrinterW, OpenPrinterW,
    StartDocPrinterW, StartPagePrinter, WritePrinter, DOC_INFO_1W, PRINTER_ENUM_LOCAL,
    PRINTER_ENUM_CONNECTIONS, PRINTER_INFO_4W,
};

// print_raw/PrintError (e a to_wide que só eles usam) ainda não têm nenhum
// chamador — printing::print_job só roteia pra "a4" (render_a4) hoje. Ficam
// prontos aqui pra quando 58mm/80mm (ESC/POS) forem implementados: é
// exatamente esse RAW job que impressoras térmicas esperam.
#[allow(dead_code)]
fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

fn from_wide_ptr(ptr: *const u16) -> String {
    if ptr.is_null() {
        return String::new();
    }
    unsafe {
        let len = (0..).take_while(|&i| *ptr.add(i) != 0).count();
        String::from_utf16_lossy(std::slice::from_raw_parts(ptr, len))
    }
}

/// Nome da impressora padrão configurada no Windows (usado só como sugestão
/// inicial — o dono escolhe e essa escolha é salva localmente, ver settings.rs).
pub fn default_printer_name() -> Option<String> {
    unsafe {
        let mut needed: u32 = 0;
        // Primeira chamada só pra descobrir o tamanho necessário do buffer.
        let _ = GetDefaultPrinterW(Some(PWSTR::null()), &mut needed);
        if needed == 0 {
            return None;
        }
        let mut buf = vec![0u16; needed as usize];
        let ok = GetDefaultPrinterW(Some(PWSTR(buf.as_mut_ptr())), &mut needed);
        if ok.ok().is_err() {
            return None;
        }
        let name = String::from_utf16_lossy(&buf);
        let name = name.trim_end_matches('\0');
        if name.is_empty() {
            None
        } else {
            Some(name.to_string())
        }
    }
}

/// Lista as impressoras instaladas no Windows (locais + conexões de rede já
/// configuradas). Nunca deve dar panic se não houver nenhuma — retorna lista
/// vazia nesse caso (a UI mostra "Nenhuma impressora encontrada").
pub fn list_printers() -> Vec<PrinterInfo> {
    let default_name = default_printer_name();

    unsafe {
        let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
        let mut needed: u32 = 0;
        let mut returned: u32 = 0;

        // Primeira chamada com buffer vazio só pra descobrir `needed`.
        let _ = EnumPrintersW(flags, PCWSTR::null(), 4, None, &mut needed, &mut returned);
        if needed == 0 {
            return Vec::new();
        }

        let mut buffer = vec![0u8; needed as usize];
        let ok = EnumPrintersW(
            flags,
            PCWSTR::null(),
            4,
            Some(&mut buffer),
            &mut needed,
            &mut returned,
        );
        if ok.is_err() {
            return Vec::new();
        }

        let infos = std::slice::from_raw_parts(buffer.as_ptr() as *const PRINTER_INFO_4W, returned as usize);
        infos
            .iter()
            .map(|info| {
                let name = from_wide_ptr(info.pPrinterName.as_ptr());
                let is_default = default_name.as_deref() == Some(name.as_str());
                PrinterInfo { name, is_default }
            })
            .filter(|p| !p.name.is_empty())
            .collect()
    }
}

#[derive(Debug, thiserror::Error)]
#[allow(dead_code)] // reservado pro ESC/POS (58mm/80mm) — ver comentário de print_raw abaixo
pub enum PrintError {
    #[error("Não foi possível abrir a impressora \"{0}\". Ela pode estar desconectada ou indisponível.")]
    OpenFailed(String),
    #[error("Não foi possível iniciar o trabalho de impressão (erro do Windows: {0}).")]
    StartDocFailed(u32),
    #[error("Não foi possível enviar os dados para a impressora (erro do Windows: {0}).")]
    WriteFailed(u32),
}

/// Envia `data` como um job RAW (pass-through) pra `printer_name`, sem nenhum
/// diálogo do Windows aparecer — é uma chamada direta ao spooler. A4 (V1) usa
/// render_a4 (GDI, via driver da impressora) — esta função ainda não tem
/// chamador; é o mecanismo que 58mm/80mm vão usar quando o ESC/POS for
/// implementado (`data` já viria pronto em bytes ESC/POS).
#[allow(dead_code)]
pub fn print_raw(printer_name: &str, document_name: &str, data: &[u8]) -> Result<(), PrintError> {
    unsafe {
        let printer_name_w = to_wide(printer_name);
        let mut handle = Default::default();
        OpenPrinterW(PCWSTR(printer_name_w.as_ptr()), &mut handle, None)
            .map_err(|_| PrintError::OpenFailed(printer_name.to_string()))?;

        let mut doc_name_w = to_wide(document_name);
        let mut datatype_w = to_wide("RAW");

        let doc_info = DOC_INFO_1W {
            pDocName: PWSTR(doc_name_w.as_mut_ptr()),
            pOutputFile: PWSTR::null(),
            pDatatype: PWSTR(datatype_w.as_mut_ptr()),
        };

        let job_id = StartDocPrinterW(handle, 1, &doc_info);
        if job_id == 0 {
            let err = GetLastError().0;
            let _ = ClosePrinter(handle);
            return Err(PrintError::StartDocFailed(err));
        }

        if StartPagePrinter(handle).ok().is_err() {
            let err = GetLastError().0;
            let _ = EndDocPrinter(handle);
            let _ = ClosePrinter(handle);
            return Err(PrintError::StartDocFailed(err));
        }

        let mut written: u32 = 0;
        let write_ok = WritePrinter(handle, data.as_ptr() as _, data.len() as u32, &mut written);

        let _ = EndPagePrinter(handle);
        let _ = EndDocPrinter(handle);
        let _ = ClosePrinter(handle);

        if write_ok.ok().is_err() || (written as usize) != data.len() {
            return Err(PrintError::WriteFailed(GetLastError().0));
        }

        Ok(())
    }
}
