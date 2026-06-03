import { api } from "./api";

export async function getWhatsappProfile() {
  const { data } = await api.get("/whatsapp/profile");
  return data;
}

export async function getWhatsappStatus() {
  const { data } = await api.get("/whatsapp/status");
  return data;
}

export async function setupWhatsapp() {
  const { data } = await api.post("/whatsapp/setup");
  return data;
}

export async function getWhatsappQrCode() {
  const { data } = await api.get("/whatsapp/qrcode");
  return data;
}

export async function disconnectWhatsapp() {
  const { data } = await api.post("/whatsapp/disconnect");
  return data;
}

export async function syncWhatsappHistory({ wait = false, force = false } = {}) {
  const params = new URLSearchParams();

  if (wait) {
    params.set("wait", "true");
  }

  if (force) {
    params.set("force", "true");
  }

  const query = params.toString();
  const url = query
    ? `/whatsapp/sync-history?${query}`
    : "/whatsapp/sync-history";

  const { data } = await api.post(url);

  return data;
}
