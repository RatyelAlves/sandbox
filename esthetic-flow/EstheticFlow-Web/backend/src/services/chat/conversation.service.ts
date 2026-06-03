import { prisma } from "../../lib/prisma";

import * as socketModule
from "../../sockets/socket";

import {
  deleteMessageMedia,
} from "./mediaStorage";

function emitConversationDeleted(
  conversationId: string
) {

  socketModule.io?.emit(
    "conversation-deleted",
    { conversationId }
  );
}

export async function deleteConversation(
  conversationId: string
) {

  const conversation =
    await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

  if (!conversation) {
    throw new Error(
      "CONVERSATION_NOT_FOUND"
    );
  }

  const messages =
    await prisma.message.findMany({
      where: { conversationId },
      select: { mediaPath: true },
    });

  for (const message of messages) {
    await deleteMessageMedia(
      message.mediaPath
    );
  }

  await prisma.$transaction([
    prisma.message.deleteMany({
      where: {
        conversationId,
      },
    }),

    prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    }),
  ]);

  emitConversationDeleted(
    conversationId
  );

  return conversation;
}

export async function deleteAllConversations() {

  const messages =
    await prisma.message.findMany({
      where: {
        mediaPath: { not: null },
      },
      select: { mediaPath: true },
    });

  for (const message of messages) {
    await deleteMessageMedia(
      message.mediaPath
    );
  }

  const result = await prisma.$transaction([
    prisma.message.deleteMany({}),
    prisma.conversation.deleteMany({}),

    prisma.client.deleteMany({
      where: {
        appointments: { none: {} },
        conversations: { none: {} },
      },
    }),
  ]);

  socketModule.io?.emit(
    "conversations-cleared",
    {}
  );

  return {
    messagesDeleted: result[0].count,
    conversationsDeleted: result[1].count,
    clientsDeleted: result[2].count,
  };
}

export async function deleteConversationByJid(
  jid: string
) {

  if (!jid) {
    return null;
  }

  const conversation =
    await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            whatsappJid: jid,
          },
          {
            whatsappJidAlt: jid,
          },
        ],
      },
    });

  if (!conversation) {
    return null;
  }

  await deleteConversation(
    conversation.id
  );

  return conversation;
}

export function extractJidsFromDeleteEvent(
  body: Record<string, unknown>
) {

  const jids = new Set<string>();

  function addJid(
    value: unknown
  ) {

    if (
      typeof value === "string" &&
      value.includes("@")
    ) {
      jids.add(value);
    }
  }

  const data = body.data as
    | Record<string, unknown>
    | unknown[]
    | string
    | undefined;

  if (typeof data === "string") {
    addJid(data);
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    addJid(data.remoteJid);
    addJid(data.id);
    addJid(data.chatId);

    const key = data.key as
      | Record<string, unknown>
      | undefined;

    addJid(key?.remoteJid);
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      if (
        typeof item === "string"
      ) {
        addJid(item);
        continue;
      }

      if (
        item &&
        typeof item === "object"
      ) {
        const record =
          item as Record<
            string,
            unknown
          >;

        addJid(record.remoteJid);
        addJid(record.id);
        addJid(record.chatId);
      }
    }
  }

  const nestedData = body.data as
    | { key?: { remoteJid?: string } }
    | undefined;

  addJid(
    nestedData?.key?.remoteJid
  );

  return [...jids];
}

export async function deleteMessageFromWebhook(
  body: Record<string, unknown>
) {

  const data = body.data as
    | Record<string, unknown>
    | undefined;

  const whatsappMsgId =
    (typeof data?.keyId === "string"
      ? data.keyId
      : undefined) ||
    (typeof data?.messageId ===
    "string"
      ? data.messageId
      : undefined) ||
    (
      data?.key as
        | { id?: string }
        | undefined
    )?.id;

  if (!whatsappMsgId) {
    return null;
  }

  const message =
    await prisma.message.findUnique({
      where: {
        whatsappMsgId,
      },
    });

  if (!message) {
    return null;
  }

  await deleteMessageMedia(
    message.mediaPath
  );

  await prisma.message.delete({
    where: {
      id: message.id,
    },
  });

  socketModule.io?.emit(
    "new-message",
    {
      conversationId:
        message.conversationId,
    }
  );

  return message;
}
