import { env } from "../../config/env";

import {
  evolutionRequest,
  getEvolutionApiKey,
  getEvolutionInstance,
} from "./evolutionApi";

type EvolutionInstance = {
  name?: string;
  profileName?: string | null;
  ownerJid?: string | null;
  connectionStatus?: string;
};

type CachedProfile = {
  profileName: string;
  connected: boolean;
  fetchedAt: number;
};

const CACHE_TTL_MS =
  6 * 60 * 60 * 1000;

const FALLBACK_NAME =
  "Estética Clínica";

let cache: CachedProfile | null =
  null;

let webhookProfileName: string | null =
  null;

let profileRefreshTimer: ReturnType<
  typeof setTimeout
> | null = null;

export function invalidateWhatsappProfileCache() {
  cache = null;
}

export function noteWhatsappProfileFromWebhook(
  data: Record<string, unknown> | undefined
) {

  const candidates = [
    data?.profileName,
    data?.profile_name,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      webhookProfileName =
        candidate.trim();

      invalidateWhatsappProfileCache();
      return;
    }
  }
}

export function scheduleWhatsappProfileRefresh() {

  if (profileRefreshTimer) {
    return;
  }

  profileRefreshTimer = setTimeout(() => {
    profileRefreshTimer = null;
    invalidateWhatsappProfileCache();
    getWhatsappProfile().catch(() => {});
  }, 3000);
}

function getCachedProfile() {
  if (!cache) {
    return null;
  }

  const isFresh =
    Date.now() - cache.fetchedAt <
    CACHE_TTL_MS;

  if (!isFresh) {
    cache = null;
    return null;
  }

  return cache;
}

async function fetchEvolutionInstance() {

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
    throw new Error(
      `Evolution API retornou ${response.status}`
    );
  }

  const instances =
    (await response.json()) as EvolutionInstance[];

  const instanceName =
    getEvolutionInstance();

  return (
    instances.find(
      (item) =>
        item.name === instanceName
    ) ?? instances[0]
  );
}

async function resolveProfileName(
  instance: EvolutionInstance | undefined,
  connected: boolean
) {

  const fromInstance =
    instance?.profileName?.trim();

  if (fromInstance) {
    return fromInstance;
  }

  if (webhookProfileName) {
    return webhookProfileName;
  }

  if (
    connected &&
    instance?.ownerJid?.endsWith(
      "@s.whatsapp.net"
    )
  ) {
    const phone =
      instance.ownerJid.replace(
        "@s.whatsapp.net",
        ""
      );

    const business =
      await evolutionRequest<{
        isBusiness?: boolean;
        description?: string;
        business?: {
          description?: string;
          profileOptions?: {
            businessName?: string;
          };
        };
      }>({
        path: `/chat/fetchBusinessProfile/${getEvolutionInstance()}`,
        body: { number: phone },
      });

    if (business?.isBusiness) {
      const businessName =
        business.business?.profileOptions?.businessName?.trim() ||
        business.business?.description?.trim() ||
        business.description?.trim();

      if (businessName) {
        return businessName;
      }
    }
  }

  if (connected) {
    return "";
  }

  return FALLBACK_NAME;
}

function storeCache(
  profileName: string,
  connected: boolean
) {

  if (
    !profileName &&
    connected
  ) {
    return;
  }

  cache = {
    profileName:
      profileName || FALLBACK_NAME,
    connected,
    fetchedAt: Date.now(),
  };
}

export async function getWhatsappProfile() {

  const cached =
    getCachedProfile();

  if (cached) {
    return {
      profileName:
        cached.profileName,
      connected:
        cached.connected,
      source: "cache" as const,
    };
  }

  try {

    const instance =
      await fetchEvolutionInstance();

    const connected =
      instance?.connectionStatus ===
      "open";

    const profileName =
      await resolveProfileName(
        instance,
        connected
      );

    storeCache(
      profileName,
      connected
    );

    return {
      profileName:
        profileName || FALLBACK_NAME,
      connected,
      source: "live" as const,
    };

  } catch (error) {

    console.error(
      "Erro ao buscar perfil WhatsApp:",
      error
    );

    return {
      profileName: FALLBACK_NAME,
      connected: false,
      source: "fallback" as const,
    };
  }
}
