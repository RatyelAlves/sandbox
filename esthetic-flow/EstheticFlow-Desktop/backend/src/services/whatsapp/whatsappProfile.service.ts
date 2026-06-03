import { env } from "../../config/env";

import {
  getEvolutionApiKey,
  getEvolutionInstance,
} from "./evolutionApi";

type EvolutionInstance = {
  name?: string;
  profileName?: string | null;
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

export function invalidateWhatsappProfileCache() {
  cache = null;
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

    const response =
      await fetch(
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

    const instance =
      instances.find(
        (item) =>
          item.name ===
          instanceName
      ) ?? instances[0];

    const profileName =
      instance?.profileName?.trim() ||
      FALLBACK_NAME;

    const connected =
      instance?.connectionStatus ===
      "open";

    cache = {
      profileName,
      connected,
      fetchedAt: Date.now(),
    };

    return {
      profileName,
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
