/**
 * Config única do VSFood Print no site — evita espalhar
 * `process.env.NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL` (e a versão) por vários
 * arquivos. Usado por /painel/impressao e /vsfood-print.
 */

// Mantenha em sincronia com `version` em vsfood-print/src-tauri/tauri.conf.json
// (e vsfood-print/package.json) a cada release.
export const VSFOOD_PRINT_VERSION = "0.1.0";

/** URL do instalador (asset de uma GitHub Release, ver vsfood-print/README.md). `null` enquanto não houver release. */
export function getVsfoodPrintDownloadUrl(): string | null {
  return process.env.NEXT_PUBLIC_VSFOOD_PRINT_DOWNLOAD_URL || null;
}
