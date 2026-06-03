import {
  Conversation,
  Message,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

import {
  evolutionRequest,
  getEvolutionInstance,
} from "./evolutionApi";

import {
  resolveSendableJid,
} from "./jid";

import {
  parseWhatsappMessage,
} from "./parseWhatsappMessage";

type EvolutionMessageRecord = {
  key?: {
    id?: string;
    fromMe?: boolean;
    remoteJid?: string;
  };
  message?: Record<string, unknown>;
  messageTimestamp?:
    | number
    | string;
};

export function extractWhatsappMsgIdFromWebhook(
  body: Record<string, unknown>
) {

  const data = body.data as
    | Record<string, unknown>
    | undefined;

  const key = data?.key as
    | { id?: string }
    | undefined;

  if (
    typeof key?.id === "string" &&
    key.id.length > 0
  ) {
    return key.id;
  }

  if (
    typeof data?.keyId ===
    "string"
  ) {
    return data.keyId;
  }

  if (
    typeof data?.messageId ===
    "string"
  ) {
    return data.messageId;
  }

  if (
    typeof data?.id === "string" &&
    !data.id.includes("@")
  ) {
    return data.id;
  }

  return undefined;
}

function recordTimestampMs(
  value?: number | string
) {

  if (value === undefined) {
    return null;
  }

  const numeric =
    typeof value === "string"
      ? Number.parseInt(
          value,
          10
        )
      : value;

  if (
    !Number.isFinite(numeric)
  ) {
    return null;
  }

  return numeric < 1_000_000_000_000
    ? numeric * 1000
    : numeric;
}

function recordsMatchMessage(
  record: EvolutionMessageRecord,
  message: Message
) {

  if (
    record.key?.fromMe !==
    message.fromMe
  ) {
    return false;
  }

  if (!record.key?.id) {
    return false;
  }

  const parsed =
    parseWhatsappMessage(
      record.message
    );

  const recordContent =
    parsed?.content?.trim() ||
    "";

  const messageContent =
    message.content.trim();

  const recordTime =
    recordTimestampMs(
      record.messageTimestamp
    );

  const messageTime =
    message.createdAt.getTime();

  const timeMatches =
    recordTime === null ||
    Math.abs(
      recordTime - messageTime
    ) <= 120_000;

  if (!timeMatches) {
    return false;
  }

  if (
    recordContent === messageContent
  ) {
    return true;
  }

  if (
    parsed?.messageType ===
      message.messageType &&
    message.messageType !==
      "text"
  ) {
    return true;
  }

  return false;
}

async function findWhatsappMsgIdInJid(
  jid: string,
  message: Message
) {

  const data =
    await evolutionRequest<{
      messages?: {
        records?: EvolutionMessageRecord[];
      };
    }>({
      path: `/chat/findMessages/${getEvolutionInstance()}`,

      body: {
        where: {
          key: {
            remoteJid: jid,
          },
        },
        page: 1,
        offset: 40,
      },
    });

  const records =
    data?.messages?.records ??
    [];

  for (const record of records) {
    if (
      recordsMatchMessage(
        record,
        message
      )
    ) {
      return record.key?.id ?? null;
    }
  }

  return null;
}

export async function ensureMessageWhatsappId(
  message: Message,
  conversation: Conversation
): Promise<string | null> {

  if (message.whatsappMsgId) {
    return message.whatsappMsgId;
  }

  const remoteJid =
    resolveSendableJid(
      conversation.whatsappJid,
      conversation.whatsappJidAlt
    );

  const jids = new Set<string>([
    remoteJid,
    conversation.whatsappJid,
  ]);

  if (conversation.whatsappJidAlt) {
    jids.add(
      conversation.whatsappJidAlt
    );
  }

  for (const jid of jids) {
    const whatsappMsgId =
      await findWhatsappMsgIdInJid(
        jid,
        message
      );

    if (whatsappMsgId) {
      await prisma.message.update({
        where: {
          id: message.id,
        },
        data: {
          whatsappMsgId,
        },
      });

      return whatsappMsgId;
    }
  }

  return null;
}
