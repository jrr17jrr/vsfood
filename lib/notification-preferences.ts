"use client";

const SOUND_KEY = "vsfood-painel-order-sound";

/** Preferência é só de conveniência de UI (por navegador/dispositivo) — por isso localStorage, sem precisar de coluna/tabela nova. Default ligado (mesmo comportamento de antes de existir o toggle). */
export function getOrderSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(SOUND_KEY);
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

export function setOrderSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
  } catch {
    // localStorage indisponível (modo privado restrito etc.) — ignora, só afeta a preferência de som
  }
}
