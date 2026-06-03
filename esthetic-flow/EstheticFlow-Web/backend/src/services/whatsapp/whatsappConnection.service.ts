import { prisma } from "../../lib/prisma";

import * as socketModule
from "../../sockets/socket";

import {
  deleteAllConversations,
} from "../chat/conversation.service";

import {
  env,
} from "../../config/env";

import {
  getEvolutionApiKey,
  getEvolutionInstance,
  evolutionRequest,
} from "./evolutionApi";

import {
  invalidateWhatsappProfileCache,
} from "./whatsappProfile.service";

import {
  syncWhatsappHistory,
} from "./syncWhatsappHistory";

const OWNER_JID_KEY =
  "whatsapp_owner_jid";

const EXPECT_ACCOUNT_RESET_KEY =
  "whatsapp_expect_account_reset";

const BLOCK_HISTORY_IMPORT_KEY =
  "whatsapp_block_history_import";

function normalizeOwnerJid(
  value?: string | null
) {

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const jid = value.trim();

  if (jid.includes("@")) {
    return jid;
  }

  return `${jid}@s.whatsapp.net`;
}

function extractOwnerJidFromWebhook(
  data: Record<string, unknown> | undefined
) {

  const candidates = [
    data?.wuid,
    data?.ownerJid,
  ];

  for (const candidate of candidates) {
    const jid =
      normalizeOwnerJid(
        typeof candidate === "string"
          ? candidate
          : null
      );

    if (jid) {
      return jid;
    }
  }

  return null;
}

async function fetchOwnerJidFromEvolution() {

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
    return null;
  }

  const instances =
    (await response.json()) as Array<{
      name?: string;
      ownerJid?: string | null;
    }>;

  const instanceName =
    getEvolutionInstance();

  const instance =
    instances.find(
      (item) =>
        item.name === instanceName
    ) ?? instances[0];

  return normalizeOwnerJid(
    instance?.ownerJid
  );
}

type EvolutionChat = {
  id?: string;
  remoteJid?: string;
};

async function fetchLiveChatJids() {

  const instance =
    getEvolutionInstance();

  const data =
    await evolutionRequest<
      EvolutionChat[]
    >({
      path: `/chat/findChats/${instance}`,
      body: {},
    });

  if (!Array.isArray(data)) {
    return new Set<string>();
  }

  const liveJids = new Set<string>();

  for (const chat of data) {
    const remoteJid =
      chat.remoteJid || chat.id;

    if (
      remoteJid &&
      !remoteJid.endsWith("@g.us") &&
      remoteJid !== "status@broadcast"
    ) {
      liveJids.add(remoteJid);
    }
  }

  return liveJids;
}

async function detectUntrackedAccountSwitch() {

  const activeCount =
    await prisma.conversation.count({
      where: {
        archived: false,
      },
    });

  if (activeCount === 0) {
    return false;
  }

  const liveJids =
    await fetchLiveChatJids();

  if (liveJids.size === 0) {
    return false;
  }

  const local =
    await prisma.conversation.findMany({
      where: {
        archived: false,
      },
      select: {
        whatsappJid: true,
        whatsappJidAlt: true,
      },
    });

  let matched = 0;

  for (const conversation of local) {
    const inLive =
      liveJids.has(
        conversation.whatsappJid
      ) ||
      Boolean(
        conversation.whatsappJidAlt &&
        liveJids.has(
          conversation.whatsappJidAlt
        )
      );

    if (inLive) {
      matched += 1;
    }
  }

  const overlapRatio =
    matched / local.length;

  const localToRemoteRatio =
    local.length / liveJids.size;

  const lowOverlap =
    overlapRatio < 0.4;

  const manyStaleConversations =
    local.length > 5 &&
    localToRemoteRatio > 3 &&
    overlapRatio < 0.7;

  return (
    lowOverlap ||
    manyStaleConversations
  );
}

export async function getStoredWhatsappOwnerJid() {

  const row =
    await prisma.appSetting.findUnique({
      where: {
        key: OWNER_JID_KEY,
      },
    });

  return normalizeOwnerJid(
    row?.value
  );
}

export async function setStoredWhatsappOwnerJid(
  ownerJid: string
) {

  await prisma.appSetting.upsert({
    where: {
      key: OWNER_JID_KEY,
    },
    create: {
      key: OWNER_JID_KEY,
      value: ownerJid,
    },
    update: {
      value: ownerJid,
    },
  });
}

export async function clearStoredWhatsappOwnerJid() {

  await prisma.appSetting.deleteMany({
    where: {
      key: OWNER_JID_KEY,
    },
  });
}

export async function markWhatsappExpectAccountReset() {

  await prisma.appSetting.upsert({
    where: {
      key: EXPECT_ACCOUNT_RESET_KEY,
    },
    create: {
      key: EXPECT_ACCOUNT_RESET_KEY,
      value: "true",
    },
    update: {
      value: "true",
    },
  });
}

async function consumeWhatsappExpectAccountReset() {

  const row =
    await prisma.appSetting.findUnique({
      where: {
        key: EXPECT_ACCOUNT_RESET_KEY,
      },
    });

  if (row?.value !== "true") {
    return false;
  }

  await prisma.appSetting.deleteMany({
    where: {
      key: EXPECT_ACCOUNT_RESET_KEY,
    },
  });

  return true;
}

export async function isHistoryImportBlocked() {

  const row =
    await prisma.appSetting.findUnique({
      where: {
        key: BLOCK_HISTORY_IMPORT_KEY,
      },
    });

  return row?.value === "true";
}

export async function blockHistoryImport() {

  await prisma.appSetting.upsert({
    where: {
      key: BLOCK_HISTORY_IMPORT_KEY,
    },
    create: {
      key: BLOCK_HISTORY_IMPORT_KEY,
      value: "true",
    },
    update: {
      value: "true",
    },
  });
}

export async function unblockHistoryImport() {

  await prisma.appSetting.deleteMany({
    where: {
      key: BLOCK_HISTORY_IMPORT_KEY,
    },
  });
}

export async function resetWhatsappConversationsForCurrentAccount() {

  await deleteAllConversations();
  invalidateWhatsappProfileCache();
  await blockHistoryImport();
  await clearStoredWhatsappOwnerJid();

  const ownerJid =
    await fetchOwnerJidFromEvolution();

  if (ownerJid) {
    await setStoredWhatsappOwnerJid(
      ownerJid
    );
  }

  socketModule.io?.emit(
    "whatsapp-account-changed",
    {
      ownerJid,
      switched: true,
      isFirstLink: false,
      legacySwitch: false,
      expectAccountReset: true,
    }
  );

  return {
    switched: true,
    ownerJid,
  };
}

export async function handleWhatsappAccountConnected(
  data: Record<string, unknown> | undefined
) {

  let ownerJid =
    extractOwnerJidFromWebhook(data);

  if (!ownerJid) {
    ownerJid =
      await fetchOwnerJidFromEvolution();
  }

  if (!ownerJid) {
    return {
      switched: false,
      ownerJid: null,
    };
  }

  const previous =
    await getStoredWhatsappOwnerJid();

  const switched = Boolean(
    previous &&
    previous !== ownerJid
  );

  const isFirstLink = !previous;

  const expectAccountReset =
    await consumeWhatsappExpectAccountReset();

  const legacySwitch =
    isFirstLink &&
    !expectAccountReset &&
    (await detectUntrackedAccountSwitch());

  const shouldReset =
    switched ||
    legacySwitch ||
    expectAccountReset;

  if (shouldReset) {
    if (expectAccountReset) {
      console.log(
        "[WhatsApp] Reconexão após desconectar — limpando conversas antigas"
      );
    } else if (legacySwitch) {
      console.log(
        "[WhatsApp] Troca de conta detectada (legado) — limpando conversas antigas"
      );
    } else {
      console.log(
        "[WhatsApp] Conta trocada:",
        previous,
        "→",
        ownerJid,
        "— limpando conversas antigas"
      );
    }

    await deleteAllConversations();
    invalidateWhatsappProfileCache();
    await blockHistoryImport();
  }

  await setStoredWhatsappOwnerJid(
    ownerJid
  );

  if (
    isFirstLink &&
    !shouldReset
  ) {
    syncWhatsappHistory().catch(
      (error) => {
        console.error(
          "Sync após conectar WhatsApp:",
          error
        );
      }
    );
  }

  socketModule.io?.emit(
    "whatsapp-account-changed",
    {
      ownerJid,
      switched: shouldReset,
      isFirstLink,
      legacySwitch,
      expectAccountReset,
    }
  );

  return {
    switched: shouldReset,
    ownerJid,
  };
}
