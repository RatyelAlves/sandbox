function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

function normalizePhoneDigits(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length >= 12) return digits;

  return undefined;
}

export function buildTelUrl(phone: string): string | undefined {
  const normalized = normalizePhoneDigits(phone);
  if (!normalized) return undefined;
  return `tel:+${normalized}`;
}

export function buildWhatsAppUrl(phone: string): string | undefined {
  const normalized = normalizePhoneDigits(phone);
  if (!normalized || normalized.length < 12) return undefined;
  return `https://wa.me/${normalized}`;
}

export function buildEmailUrl(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return undefined;
  return `mailto:${trimmed}`;
}

export function buildSiteUrl(site: string): string | undefined {
  const trimmed = site.trim();
  if (!trimmed) return undefined;

  try {
    const url = ensureHttps(trimmed);
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

export function buildInstagramUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("instagram.com")) {
    try {
      return ensureHttps(trimmed);
    } catch {
      return undefined;
    }
  }

  const handle = trimmed.replace(/^@/, "").replace(/\s/g, "");
  if (!handle) return undefined;

  return `https://instagram.com/${handle}`;
}

export function buildFacebookUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("facebook.com")) {
    try {
      return ensureHttps(trimmed);
    } catch {
      return undefined;
    }
  }

  const handle = trimmed.replace(/^@/, "").replace(/\s/g, "");
  if (!handle) return undefined;

  return `https://facebook.com/${handle}`;
}

export function isExternalContactLink(href: string): boolean {
  return href.startsWith("http");
}
