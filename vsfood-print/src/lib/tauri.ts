import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type SessionInfo = { connected: boolean; restaurantName: string; deviceName: string };
export type PrinterInfo = { name: string; isDefault: boolean };
export type AppSettings = { selectedPrinter: string | null; autoPrint: boolean; autoStart: boolean; printerAvailable: boolean };
export type HistoryEntry = { orderNumber: string; status: "printed" | "failed"; message: string | null; at: string };

// invoke() já converte as chaves de snake_case (Rust/serde) pra camelCase
// automaticamente no lado do Tauri? Não — o Rust usa #[serde(rename_all)]
// só nos modelos em models.rs; os tipos retornados por commands.rs usam o
// nome literal do campo Rust. Mantemos os DTOs do frontend em camelCase e
// convertê-los explicitamente evita depender de um detalhe de serialização.

export async function getSession(): Promise<SessionInfo> {
  const raw = await invoke<{ connected: boolean; restaurant_name: string; device_name: string }>("get_session");
  return { connected: raw.connected, restaurantName: raw.restaurant_name, deviceName: raw.device_name };
}

export async function pairDevice(code: string): Promise<SessionInfo> {
  const raw = await invoke<{ connected: boolean; restaurant_name: string; device_name: string }>("pair_device", { code });
  return { connected: raw.connected, restaurantName: raw.restaurant_name, deviceName: raw.device_name };
}

export async function disconnectDevice(): Promise<void> {
  await invoke("disconnect_device");
}

export async function listPrinters(): Promise<PrinterInfo[]> {
  const raw = await invoke<{ name: string; is_default: boolean }[]>("list_printers");
  return raw.map((p) => ({ name: p.name, isDefault: p.is_default }));
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await invoke<{ selected_printer: string | null; auto_print: boolean; auto_start: boolean; printer_available: boolean }>(
    "get_settings",
  );
  return {
    selectedPrinter: raw.selected_printer,
    autoPrint: raw.auto_print,
    autoStart: raw.auto_start,
    printerAvailable: raw.printer_available,
  };
}

export async function selectPrinter(name: string): Promise<void> {
  await invoke("select_printer", { name });
}

export async function setAutoPrint(enabled: boolean): Promise<void> {
  await invoke("set_auto_print", { enabled });
}

export async function setAutoStart(enabled: boolean): Promise<void> {
  await invoke("set_auto_start", { enabled });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const raw = await invoke<{ order_number: string; status: "printed" | "failed"; message: string | null; at: string }[]>("get_history");
  return raw.map((h) => ({ orderNumber: h.order_number, status: h.status, message: h.message, at: h.at }));
}

export async function printTestPage(): Promise<void> {
  await invoke("print_test_page");
}

export function onJobPrinted(cb: (orderNumber: string) => void) {
  return listen<string>("job-printed", (e) => cb(e.payload));
}

export function onJobFailed(cb: (payload: { number: string; error: string }) => void) {
  return listen<{ number: string; error: string }>("job-failed", (e) => cb(e.payload));
}

export function onConnectionStatus(cb: (online: boolean) => void) {
  return listen<boolean>("connection-status", (e) => cb(e.payload));
}

export function onPrinterStatus(cb: (available: boolean) => void) {
  return listen<boolean>("printer-status", (e) => cb(e.payload));
}
