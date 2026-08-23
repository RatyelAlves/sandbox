const STORAGE_KEY = "bros_print_block_until";
export const PRINT_BLOCK_HOURS = 24;

export function isLocalHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function isScreenshotGesture(event: KeyboardEvent) {
  const key = event.key;
  if (key === "PrintScreen" || key === "Print") return true;
  const combo =
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey &&
    ["s", "S", "3", "4", "5"].includes(key);
  return combo;
}

export function readLocalPrintBlock() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  if (new Date(raw).getTime() <= Date.now()) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return raw;
}

export function writeLocalPrintBlock(iso: string) {
  window.localStorage.setItem(STORAGE_KEY, iso);
}

export function clearLocalPrintBlock() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function laterIso(hours = PRINT_BLOCK_HOURS) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function laterOf(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

export function formatBlockRemaining(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min`;
  return "menos de 1min";
}
