import { Message } from "@prisma/client";

import { prisma } from "../../lib/prisma";

import {
  evolutionRequest,
  getEvolutionInstance,
} from "./evolutionApi";

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
};

function idsMatch(
  storedId: string,
  referenceId: string
) {

  const stored =
    storedId.toUpperCase();
  const reference =
    referenceId.toUpperCase();

  return (
    stored === reference ||
    stored.endsWith(reference) ||
    reference.endsWith(stored)
  );
}

async function findMessageInDatabase(
  conversationId: string,
  whatsappMsgId: string
) {

  const exact =
    await prisma.message.findFirst({
      where: {
        conversationId,
        whatsappMsgId,
      },
    });

  if (exact) {
    return exact;
  }

  const candidates =
    await prisma.message.findMany({
      where: {
        conversationId,
        whatsappMsgId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 300,
    });

  return (
    candidates.find(
      (message) =>
        message.whatsappMsgId &&
        idsMatch(
          message.whatsappMsgId,
          whatsappMsgId
        )
    ) ?? null
  );
}

async function findMessageInEvolution(
  remoteJid: string,
  whatsappMsgId: string
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
            remoteJid,
            id: whatsappMsgId,
          },
        },
        page: 1,
        offset: 5,
      },
    });

  const record =
    data?.messages?.records?.find(
      (item) =>
        item.key?.id &&
        idsMatch(
          item.key.id,
          whatsappMsgId
        )
    ) ??
    data?.messages?.records?.[0];

  if (!record?.message) {
    return null;
  }

  const parsed =
    parseWhatsappMessage(
      record.message
    );

  if (!parsed?.content) {
    return null;
  }

  return {
    content: parsed.content,
    fromMe:
      record.key?.fromMe ?? false,
    messageType:
      parsed.messageType,
    whatsappMsgId:
      record.key?.id ?? whatsappMsgId,
  };
}

export async function resolveQuotedSourceMessage(input: {
  conversationId: string;
  remoteJid: string;
  quotedWhatsappMsgId?: string;
}): Promise<
  | Pick<
      Message,
      | "id"
      | "content"
      | "fromMe"
      | "messageType"
      | "whatsappMsgId"
    >
  | null
> {

  if (!input.quotedWhatsappMsgId) {
    return null;
  }

  const fromDatabase =
    await findMessageInDatabase(
      input.conversationId,
      input.quotedWhatsappMsgId
    );

  if (fromDatabase) {
    return fromDatabase;
  }

  const fromEvolution =
    await findMessageInEvolution(
      input.remoteJid,
      input.quotedWhatsappMsgId
    );

  if (!fromEvolution) {
    return null;
  }

  return {
    id: "",
    content: fromEvolution.content,
    fromMe: fromEvolution.fromMe,
    messageType:
      fromEvolution.messageType,
    whatsappMsgId:
      fromEvolution.whatsappMsgId,
  };
}
