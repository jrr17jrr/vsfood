/**
 * Validação de arquivo de imagem reutilizada por todo upload do VSFood
 * (logo, banner, foto de produto) — checa MIME real do arquivo (nunca só a
 * extensão) e tamanho antes de qualquer envio ao Storage. Usado tanto pelos
 * inputs (`accept`) quanto por lib/storage.ts (última linha de defesa —
 * `accept` só filtra o seletor do SO, não impede um arquivo renomeado).
 */
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Valor pronto pro atributo `accept` dos <input type="file">. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

export const IMAGE_WRONG_FORMAT_MESSAGE = "Formato não permitido. Envie uma imagem JPG, PNG ou WEBP.";

export function isAllowedImageMimeType(type: string): type is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

/** Retorna a mensagem de erro (pt-BR, pronta pra exibir) ou `null` se o arquivo passar nas duas checagens. */
export function validateImageFile(file: File, maxSizeMB: number): string | null {
  if (!isAllowedImageMimeType(file.type)) return IMAGE_WRONG_FORMAT_MESSAGE;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Arquivo muito grande. O limite é ${maxSizeMB} MB.`;
  }
  return null;
}
