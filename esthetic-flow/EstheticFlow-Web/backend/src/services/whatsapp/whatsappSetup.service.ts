import { env } from "../../config/env";

import {
  evolutionDelete,
  evolutionGet,
  evolutionRequest,
  getEvolutionApiKey,
  getEvolutionInstance,
} from "./evolutionApi";

import {
  getWhatsappProfile,
  invalidateWhatsappProfileCache,
} from "./whatsappProfile.service";

import {
  clearStoredWhatsappOwnerJid,
  markWhatsappExpectAccountReset,
} from "./whatsappConnection.service";

type EvolutionInstance = {
  name?: string;
  connectionStatus?: string;
};

type ConnectResponse = {
  base64?: string;
  pairingCode?: string;
  code?: string;
  count?: number;
};

async function fetchInstances() {

  const response = await fetch(
    `${env.evolutionApiUrl}/instance/fetchInstances`,
    {
      headers: {
        apikey:
          getEvolutionApiKey(),
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as EvolutionInstance[];
}

async function findInstance() {

  const instances =
    await fetchInstances();

  const instanceName =
    getEvolutionInstance();

  return (
    instances.find(
      (item) =>
        item.name ===
        instanceName
    ) ?? null
  );
}

export async function ensureWhatsappInstance() {

  const instanceName =
    getEvolutionInstance();

  const existing =
    await findInstance();

  if (!existing) {
    await evolutionRequest({
      path: "/instance/create",
      body: {
        instanceName,
        integration:
          "WHATSAPP-BAILEYS",
        qrcode: true,
      },
    });
  }

  await evolutionRequest({
    path: `/webhook/set/${instanceName}`,
    body: {
      webhook: {
        enabled: true,
        url: `${env.webhookBaseUrl}/webhook/whatsapp`,
        webhookByEvents: false,
        events: [
          "MESSAGES_UPSERT",
          "CONNECTION_UPDATE",
          "CHATS_DELETE",
          "MESSAGES_DELETE",
        ],
      },
    },
  });

  return getWhatsappProfile();
}

export async function getWhatsappQrCode() {

  invalidateWhatsappProfileCache();

  const profile =
    await getWhatsappProfile();

  if (profile.connected) {
    return {
      connected: true,
      qrCode: null,
    };
  }

  const instanceName =
    getEvolutionInstance();

  const existing =
    await findInstance();

  if (!existing) {
    await ensureWhatsappInstance();
  }

  const connect =
    await evolutionGet<ConnectResponse>(
      `/instance/connect/${instanceName}`
    );

  const base64 =
    connect?.base64 || null;

  return {
    connected: false,
    qrCode: base64,
    pairingCode:
      connect?.pairingCode || null,
  };
}

export async function getWhatsappSetupStatus() {

  const profile =
    await getWhatsappProfile();

  const instance =
    await findInstance();

  return {
    connected: profile.connected,
    profileName:
      profile.profileName,
    instanceExists:
      Boolean(instance),
    instanceStatus:
      instance?.connectionStatus ||
      "disconnected",
  };
}

export async function disconnectWhatsapp() {

  const instanceName =
    getEvolutionInstance();

  await evolutionDelete(
    `/instance/logout/${instanceName}`
  );

  await markWhatsappExpectAccountReset();
  await clearStoredWhatsappOwnerJid();

  invalidateWhatsappProfileCache();

  return {
    connected: false,
  };
}
