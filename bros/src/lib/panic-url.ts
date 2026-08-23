export const PANIC_URL_KEY = "bros_panic_url";

export function parsePanicUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function loadPanicUrl() {
  if (typeof window === "undefined") return null;
  return parsePanicUrl(localStorage.getItem(PANIC_URL_KEY) ?? "");
}

export function savePanicUrl(raw: string) {
  if (typeof window === "undefined") return null;
  const url = parsePanicUrl(raw);
  if (!url) {
    localStorage.removeItem(PANIC_URL_KEY);
    return null;
  }
  localStorage.setItem(PANIC_URL_KEY, url);
  return url;
}
