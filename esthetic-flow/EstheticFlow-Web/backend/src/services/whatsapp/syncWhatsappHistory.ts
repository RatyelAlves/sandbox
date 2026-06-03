import { prisma } from "../../lib/prisma";

import * as socketModule
from "../../sockets/socket";

import {
  evolutionRequest,
  getEvolutionInstance,
} from "./evolutionApi";

import {
  isLidJid,
  jidToPhone,
  resolveSendableJid,
} from "./jid";

import {
  parseWhatsappMessage,
} from "./parseWhatsappMessage";

import {
  resolvePhoneJidFromEvolution,
} from "./resolveLidContact";

const PAGE_SIZE = 30;

const INITIAL_PAGES_PER_CHAT = 1;

const MAX_PAGES_PER_CHAT_HARD = 50;

const MAX_CHATS = 200;

const DELAY_BETWEEN_PAGES_MS = 200;

const DELAY_BETWEEN_CHATS_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

type EvolutionChat = {
  id?: string;
  remoteJid?: string;
  name?: string | null;
  pushName?: string | null;
  unreadCount?: number;
};

type EvolutionMessageRecord = {
  key?: {
    id?: string;
    remoteJid?: string;
    remoteJidAlt?: string;
    senderPn?: string;
    fromMe?: boolean;
    participant?: string;
  };
  message?: Record<string, unknown>;
  messageType?: string;
  messageTimestamp?: number | string;
  pushName?: string | null;
  contextInfo?: Record<string, unknown>;
};

type SyncProgress = {
  chatsProcessed: number;
  conversationsCreated: number;
  conversationsUpdated: number;
  conversationsArchived: number;
  messagesSaved: number;
  messagesSkipped: number;
  errors: string[];
};

let runningPromise:
  | Promise<SyncProgress>
  | null = null;

async function fetchChats(): Promise<
  EvolutionChat[]
> {

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
    return [];
  }

  return data;
}

async function fetchMessagesPage(
  remoteJid: string,
  page: number
) {

  const instance =
    getEvolutionInstance();

  const data =
    await evolutionRequest<{
      messages?: {
        total?: number;
        pages?: number;
        currentPage?: number;
        records?: EvolutionMessageRecord[];
      };
    }>({
      path: `/chat/findMessages/${instance}`,
      body: {
        where: {
          key: {
            remoteJid,
          },
        },
        page,
        offset: PAGE_SIZE,
      },
    });

  return {
    records:
      data?.messages?.records ?? [],
    pages:
      data?.messages?.pages ?? 1,
  };
}

function pickRecordTimestamp(
  record: EvolutionMessageRecord
): Date {

  const raw = record.messageTimestamp;

  if (typeof raw === "number") {
    const ms =
      raw < 1e12 ? raw * 1000 : raw;

    return new Date(ms);
  }

  if (typeof raw === "string") {
    const numeric = Number(raw);

    if (Number.isFinite(numeric)) {
      const ms =
        numeric < 1e12
          ? numeric * 1000
          : numeric;

      return new Date(ms);
    }
  }

  return new Date();
}

async function ensureClientAndConversation(input: {
  remoteJid: string;
  remoteJidAlt?: string;
  displayName: string;
}) {

  const sendableJid =
    resolveSendableJid(
      input.remoteJid,
      input.remoteJidAlt
    );

  const cleanPhone =
    jidToPhone(sendableJid);

  let client =
    await prisma.client.findFirst({
      where: { phone: cleanPhone },
    });

  if (!client) {
    client =
      await prisma.client.create({
        data: {
          name:
            input.displayName ||
            "Cliente",
          phone: cleanPhone,
        },
      });
  } else if (
    (client.name === "Cliente" ||
      !client.name) &&
    input.displayName &&
    input.displayName !== "Cliente"
  ) {
    client =
      await prisma.client.update({
        where: { id: client.id },
        data: {
          name: input.displayName,
        },
      });
  }

  const candidateJids = [
    input.remoteJid,
    input.remoteJidAlt,
  ].filter(
    (jid): jid is string => Boolean(jid)
  );

  let conversation =
    await prisma.conversation.findFirst({
      where: {
        OR: [
          { clientId: client.id },
          {
            whatsappJid: {
              in: candidateJids,
            },
          },
          {
            whatsappJidAlt: {
              in: candidateJids,
            },
          },
        ],
      },
    });

  let created = false;

  if (!conversation) {
    conversation =
      await prisma.conversation.create({
        data: {
          clientId: client.id,
          whatsappJid:
            input.remoteJid,
          whatsappJidAlt:
            input.remoteJidAlt,
        },
      });
    created = true;
  } else {
    const updates: {
      whatsappJidAlt?: string | null;
      archived?: boolean;
      clientId?: string;
    } = {};

    if (
      conversation.whatsappJid !==
        input.remoteJid &&
      !conversation.whatsappJidAlt
    ) {
      updates.whatsappJidAlt =
        input.remoteJid;
    } else if (
      input.remoteJidAlt &&
      conversation.whatsappJid !==
        input.remoteJidAlt &&
      conversation.whatsappJidAlt !==
        input.remoteJidAlt
    ) {
      updates.whatsappJidAlt =
        input.remoteJidAlt;
    }

    if (conversation.archived) {
      updates.archived = false;
    }

    if (
      conversation.clientId !==
      client.id
    ) {
      updates.clientId = client.id;
    }

    if (
      Object.keys(updates).length > 0
    ) {
      conversation =
        await prisma.conversation.update({
          where: {
            id: conversation.id,
          },
          data: updates,
        });
    }
  }

  return { conversation, created };
}

async function saveRecord(
  conversationId: string,
  record: EvolutionMessageRecord
): Promise<"saved" | "skipped"> {

  const whatsappMsgId =
    record.key?.id;

  if (!whatsappMsgId) {
    return "skipped";
  }

  const existing =
    await prisma.message.findUnique({
      where: { whatsappMsgId },
    });

  if (existing) {
    return "skipped";
  }

  const parsed =
    parseWhatsappMessage(
      record.message ?? null,
      record.contextInfo
    );

  if (!parsed) {
    return "skipped";
  }

  const fromMe = Boolean(
    record.key?.fromMe
  );

  const createdAt =
    pickRecordTimestamp(record);

  await prisma.message.create({
    data: {
      conversationId,
      content: parsed.content,
      fromMe,
      messageType: parsed.messageType,
      mimeType: parsed.mimeType,
      fileName: parsed.fileName,
      whatsappMsgId,
      quotedWhatsappMsgId:
        parsed.quotedWhatsappMsgId,
      quotedContent:
        parsed.quotedContent,
      quotedFromMe:
        parsed.quotedFromMe,
      quotedMessageType:
        parsed.quotedMessageType,
      createdAt,
    },
  });

  return "saved";
}

async function syncChat(
  chat: EvolutionChat,
  progress: SyncProgress,
  options: {
    maxPages: number;
  }
) {

  const remoteJid =
    chat.remoteJid || chat.id;

  if (!remoteJid) {
    return;
  }

  if (
    remoteJid.endsWith("@g.us") ||
    remoteJid === "status@broadcast"
  ) {
    return;
  }

  let remoteJidAlt:
    | string
    | undefined;

  if (isLidJid(remoteJid)) {
    remoteJidAlt =
      (await resolvePhoneJidFromEvolution(
        remoteJid,
        chat.name || chat.pushName
      )) || undefined;
  }

  const { conversation, created } =
    await ensureClientAndConversation({
      remoteJid,
      remoteJidAlt,
      displayName:
        chat.name ||
        chat.pushName ||
        "Cliente",
    });

  if (created) {
    progress.conversationsCreated += 1;
  } else {
    progress.conversationsUpdated += 1;
  }

  let savedInChat = 0;

  for (
    let page = 1;
    page <= options.maxPages;
    page += 1
  ) {

    if (page > 1) {
      await sleep(
        DELAY_BETWEEN_PAGES_MS
      );
    }

    const { records, pages } =
      await fetchMessagesPage(
        remoteJid,
        page
      );

    if (records.length === 0) {
      break;
    }

    for (const record of records) {
      try {
        const result = await saveRecord(
          conversation.id,
          record
        );

        if (result === "saved") {
          progress.messagesSaved += 1;
          savedInChat += 1;
        } else {
          progress.messagesSkipped += 1;
        }
      } catch (error) {
        console.error(
          "Erro ao salvar mensagem do histórico:",
          error
        );

        progress.errors.push(
          `${remoteJid}: ${
            (error as Error).message
          }`
        );
      }
    }

    if (page >= pages) {
      break;
    }
  }

  if (savedInChat > 0) {
    const lastMessage =
      await prisma.message.findFirst({
        where: {
          conversationId:
            conversation.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt:
          lastMessage?.createdAt ||
          new Date(),
      },
    });

    socketModule.io?.emit(
      "new-message",
      {
        conversationId:
          conversation.id,
      }
    );
  }
}

async function archiveMissingConversations(
  liveJids: Set<string>,
  progress: SyncProgress
) {

  const liveArray =
    Array.from(liveJids);

  const result =
    await prisma.conversation.updateMany({
      where: {
        archived: false,
        AND: [
          {
            whatsappJid: {
              notIn: liveArray,
            },
          },
          {
            OR: [
              {
                whatsappJidAlt: null,
              },
              {
                whatsappJidAlt: {
                  notIn: liveArray,
                },
              },
            ],
          },
        ],
      },
      data: {
        archived: true,
      },
    });

  progress.conversationsArchived =
    result.count;

  if (result.count > 0) {
    socketModule.io?.emit(
      "conversations-archived",
      {
        count: result.count,
      }
    );
  }
}

async function runSync(options: {
  pagesPerChat: number;
}): Promise<SyncProgress> {

  const progress: SyncProgress = {
    chatsProcessed: 0,
    conversationsCreated: 0,
    conversationsUpdated: 0,
    conversationsArchived: 0,
    messagesSaved: 0,
    messagesSkipped: 0,
    errors: [],
  };

  const chats =
    await fetchChats();

  const limited = chats.slice(
    0,
    MAX_CHATS
  );

  const liveJids = new Set<string>();

  for (
    let i = 0;
    i < limited.length;
    i += 1
  ) {

    const chat = limited[i];

    progress.chatsProcessed += 1;

    const remoteJid =
      chat.remoteJid || chat.id;

    if (
      remoteJid &&
      !remoteJid.endsWith("@g.us") &&
      remoteJid !== "status@broadcast"
    ) {
      liveJids.add(remoteJid);
    }

    if (i > 0) {
      await sleep(
        DELAY_BETWEEN_CHATS_MS
      );
    }

    try {
      await syncChat(
        chat,
        progress,
        {
          maxPages:
            options.pagesPerChat,
        }
      );
    } catch (error) {
      console.error(
        "Erro ao sincronizar chat:",
        error
      );

      progress.errors.push(
        (error as Error).message
      );
    }
  }

  if (liveJids.size > 0) {
    try {
      await archiveMissingConversations(
        liveJids,
        progress
      );
    } catch (error) {
      console.error(
        "Erro ao arquivar conversas inativas:",
        error
      );
    }
  }

  return progress;
}

export async function syncWhatsappHistory(options?: {
  pagesPerChat?: number;
}): Promise<SyncProgress> {

  if (runningPromise) {
    return runningPromise;
  }

  const pagesPerChat = Math.max(
    1,
    Math.min(
      options?.pagesPerChat ??
        INITIAL_PAGES_PER_CHAT,
      MAX_PAGES_PER_CHAT_HARD
    )
  );

  runningPromise = (async () => {
    try {
      console.log(
        "[SYNC] Iniciando sincronização do histórico do WhatsApp",
        { pagesPerChat }
      );

      const progress = await runSync({
        pagesPerChat,
      });

      console.log(
        "[SYNC] Concluída:",
        progress
      );

      return progress;
    } finally {
      runningPromise = null;
    }
  })();

  return runningPromise;
}

export function isHistorySyncRunning() {
  return runningPromise !== null;
}

export type SyncOlderResult = {
  saved: number;
  hasMore: boolean;
  page: number;
};

export async function syncOlderConversationMessages(
  conversationId: string
): Promise<SyncOlderResult> {

  const conversation =
    await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

  if (!conversation) {
    throw new Error(
      "CONVERSATION_NOT_FOUND"
    );
  }

  const remoteJid =
    conversation.whatsappJid;

  const syncedCount =
    await prisma.message.count({
      where: {
        conversationId,
        whatsappMsgId: { not: null },
      },
    });

  const page =
    Math.floor(
      syncedCount / PAGE_SIZE
    ) + 1;

  await sleep(
    DELAY_BETWEEN_PAGES_MS
  );

  const { records, pages } =
    await fetchMessagesPage(
      remoteJid,
      page
    );

  if (records.length === 0) {
    return {
      saved: 0,
      hasMore: false,
      page,
    };
  }

  let saved = 0;

  for (const record of records) {
    try {
      const result = await saveRecord(
        conversationId,
        record
      );

      if (result === "saved") {
        saved += 1;
      }
    } catch (error) {
      console.error(
        "Erro ao salvar mensagem antiga:",
        error
      );
    }
  }

  if (saved > 0) {
    socketModule.io?.emit(
      "new-message",
      { conversationId }
    );
  }

  const hasMore =
    saved > 0 && page < pages;

  return {
    saved,
    hasMore,
    page,
  };
}
