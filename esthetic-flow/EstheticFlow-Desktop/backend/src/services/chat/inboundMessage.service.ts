import { prisma } from "../../lib/prisma";

import * as socketModule from "../../sockets/socket";

import {
  extractRemoteJid,
  extractRemoteJidAlt,
  isLidJid,
  jidToPhone,
  resolveSendableJid,
} from "../whatsapp/jid";

import {
  resolvePhoneJidFromEvolution,
} from "../whatsapp/resolveLidContact";

import {
  extractWhatsappMsgIdFromWebhook,
} from "../whatsapp/resolveMessageWhatsappId";

import {
  parseWhatsappMessage,
  type ParsedWhatsappMessage,
} from "../whatsapp/parseWhatsappMessage";

import {
  unwrapInboundMessage,
} from "../whatsapp/unwrapInboundMessage";

import {
  fetchWhatsappMedia,
} from "../whatsapp/fetchWhatsappMedia";

import {
  saveMessageMedia,
} from "./mediaStorage";

import { env } from "../../config/env";

import {
  replyWithAi,
} from "./replyWithAi";

async function upsertClientAndConversation(input: {
  remoteJid: string;
  remoteJidAlt?: string;
  pushName: string;
  cleanPhone: string;
}) {

  let client =
    await prisma.client.findFirst({
      where: {
        phone: input.cleanPhone,
      },
    });

  if (!client) {
    client =
      await prisma.client.create({
        data: {
          name: input.pushName,
          phone: input.cleanPhone,
        },
      });
  }

  let conversation =
    await prisma.conversation.findUnique({
      where: {
        whatsappJid: input.remoteJid,
      },
    });

  if (!conversation) {
    conversation =
      await prisma.conversation.create({
        data: {
          clientId: client.id,
          whatsappJid: input.remoteJid,
          whatsappJidAlt:
            input.remoteJidAlt,
        },
      });

    if (
      input.remoteJidAlt?.endsWith(
        "@s.whatsapp.net"
      )
    ) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          phone: jidToPhone(
            input.remoteJidAlt
          ),
        },
      });
    }
  } else if (
    input.remoteJidAlt &&
    !conversation.whatsappJidAlt
  ) {
    conversation =
      await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          whatsappJidAlt:
            input.remoteJidAlt,
        },
      });

    if (
      input.remoteJidAlt.endsWith(
        "@s.whatsapp.net"
      )
    ) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          phone: jidToPhone(
            input.remoteJidAlt
          ),
        },
      });
    }
  }

  return conversation;
}

async function attachInboundMedia(
  messageId: string,
  messageKey: Record<string, unknown>,
  mimeType?: string,
  fileName?: string
) {

  const fetched =
    await fetchWhatsappMedia(
      messageKey as {
        remoteJid?: string;
        fromMe?: boolean;
        id?: string;
      },
      {
        convertToMp4: mimeType?.startsWith(
          "video/"
        ),
      }
    );

  if (!fetched) {
    return null;
  }

  const mediaPath =
    await saveMessageMedia(
      messageId,
      fetched.base64,
      fetched.mimeType || mimeType,
      fetched.fileName || fileName
    );

  return prisma.message.update({
    where: { id: messageId },
    data: {
      mediaPath,
      mimeType:
        fetched.mimeType || mimeType,
      fileName:
        fetched.fileName || fileName,
    },
  });
}

async function enrichQuotedFields(
  parsed: ReturnType<
    typeof parseWhatsappMessage
  >,
  conversationId: string
) {

  if (
    !parsed?.quotedWhatsappMsgId &&
    !parsed?.quotedContent
  ) {
    return {
      parsed,
      replyToMessageId:
        undefined as
          | string
          | undefined,
    };
  }

  const sourceMessage =
    parsed.quotedWhatsappMsgId
      ? await prisma.message.findFirst({
          where: {
            conversationId,
            whatsappMsgId:
              parsed.quotedWhatsappMsgId,
          },
        })
      : null;

  const quotedContent =
    parsed.quotedContent?.trim() ||
    sourceMessage?.content ||
    undefined;

  if (
    !quotedContent &&
    !parsed.quotedWhatsappMsgId
  ) {
    return {
      parsed,
      replyToMessageId:
        undefined,
    };
  }

  return {
    parsed: {
      ...parsed,
      quotedWhatsappMsgId:
        parsed.quotedWhatsappMsgId ||
        sourceMessage?.whatsappMsgId ||
        undefined,
      quotedContent,
      quotedFromMe:
        parsed.quotedFromMe ??
        sourceMessage?.fromMe,
      quotedMessageType:
        parsed.quotedMessageType ||
        sourceMessage?.messageType,
    },
    replyToMessageId:
      sourceMessage?.id,
  };
}

async function patchMissingQuoteFields(
  existing: {
    id: string;
    quotedContent: string | null;
    quotedWhatsappMsgId: string | null;
    replyToMessageId: string | null;
    conversationId: string;
  },
  enrichedParsed: ParsedWhatsappMessage,
  replyToMessageId?: string
) {

  const hasIncomingQuote =
    Boolean(
      enrichedParsed.quotedContent?.trim()
    ) ||
    Boolean(
      enrichedParsed.quotedWhatsappMsgId
    );

  const missingStoredQuote =
    !existing.quotedContent &&
    !existing.quotedWhatsappMsgId;

  if (
    !hasIncomingQuote ||
    !missingStoredQuote
  ) {
    return null;
  }

  const updated =
    await prisma.message.update({
      where: {
        id: existing.id,
      },
      data: {
        replyToMessageId:
          existing.replyToMessageId ||
          replyToMessageId,
        quotedWhatsappMsgId:
          enrichedParsed.quotedWhatsappMsgId,
        quotedContent:
          enrichedParsed.quotedContent,
        quotedFromMe:
          enrichedParsed.quotedFromMe,
        quotedMessageType:
          enrichedParsed.quotedMessageType,
      },
    });

  socketModule.io?.emit(
    "new-message",
    {
      conversationId:
        existing.conversationId,
      message: updated,
    }
  );

  return updated;
}

export async function handleInboundWhatsappMessage(
  body: Record<string, any>
) {

  const message =
    unwrapInboundMessage(
      body.data?.message
    );

  if (!message) {
    return { ignored: true };
  }

  const remoteJid =
    extractRemoteJid(body);

  let remoteJidAlt =
    extractRemoteJidAlt(body);

  if (
    remoteJid &&
    isLidJid(remoteJid) &&
    !remoteJidAlt
  ) {
    remoteJidAlt =
      (await resolvePhoneJidFromEvolution(
        remoteJid,
        body.data?.pushName || "Cliente",
        body.data?.key
      )) || undefined;
  }

  if (
    !remoteJid ||
    remoteJid.endsWith("@g.us")
  ) {
    return { ignored: true };
  }

  const incomingFromMe =
    Boolean(body.data?.key?.fromMe);

  const parsed =
    parseWhatsappMessage(
      message,
      body.data?.contextInfo as
        | Record<string, unknown>
        | undefined
    );

  if (!parsed) {
    return { ignored: true };
  }

  const sendableJid =
    resolveSendableJid(
      remoteJid,
      remoteJidAlt
    );

  const cleanPhone =
    jidToPhone(sendableJid);

  const pushName =
    body.data?.pushName || "Cliente";

  const conversation =
    await upsertClientAndConversation({
      remoteJid,
      remoteJidAlt,
      pushName,
      cleanPhone,
    });

  const {
    parsed: enrichedParsed,
    replyToMessageId,
  } = await enrichQuotedFields(
    parsed,
    conversation.id
  );

  const whatsappMsgId =
    extractWhatsappMsgIdFromWebhook(
      body
    );

  if (whatsappMsgId) {
    const existing =
      await prisma.message.findUnique({
        where: { whatsappMsgId },
      });

    if (existing) {
      const patched =
        await patchMissingQuoteFields(
          existing,
          enrichedParsed,
          replyToMessageId
        );

      return {
        success: true,
        duplicate: true,
        patched: Boolean(patched),
      };
    }
  } else if (!enrichedParsed.isMedia) {
    const recentDuplicate =
      await prisma.message.findFirst({
        where: {
          conversationId:
            conversation.id,
          content:
            enrichedParsed.content,
          fromMe: incomingFromMe,
          createdAt: {
            gte: new Date(
              Date.now() - 5000
            ),
          },
        },
      });

    if (recentDuplicate) {
      const patched =
        await patchMissingQuoteFields(
          recentDuplicate,
          enrichedParsed,
          replyToMessageId
        );

      return {
        success: true,
        duplicate: true,
        patched: Boolean(patched),
      };
    }
  }

  let savedMessage =
    await prisma.message.create({
      data: {
        conversationId:
          conversation.id,
        content:
          enrichedParsed.content,
        fromMe: incomingFromMe,
        messageType:
          enrichedParsed.messageType,
        mimeType:
          enrichedParsed.mimeType,
        fileName:
          enrichedParsed.fileName,
        whatsappMsgId,
        replyToMessageId,
        quotedWhatsappMsgId:
          enrichedParsed.quotedWhatsappMsgId,
        quotedContent:
          enrichedParsed.quotedContent,
        quotedFromMe:
          enrichedParsed.quotedFromMe,
        quotedMessageType:
          enrichedParsed.quotedMessageType,
      },
    });

  if (
    enrichedParsed.isMedia &&
    whatsappMsgId
  ) {
    try {
      const withMedia =
        await attachInboundMedia(
          savedMessage.id,
          body.data.key,
          enrichedParsed.mimeType,
          enrichedParsed.fileName
        );

      if (withMedia) {
        savedMessage = withMedia;
      }
    } catch (error) {
      console.error(
        "Erro ao baixar mídia inbound:",
        error
      );
    }
  }

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      updatedAt: new Date(),
      ...(incomingFromMe
        ? {}
        : {
            unreadCount: {
              increment: 1,
            },
          }),
    },
  });

  socketModule.io.emit(
    "new-message",
    {
      conversationId:
        conversation.id,
      message: savedMessage,
    }
  );

  if (
    !incomingFromMe &&
    env.geminiApiKey &&
    env.geminiAutoReply &&
    enrichedParsed.messageType === "text"
  ) {
    replyWithAi(conversation.id).catch(
      (error) => {
        console.error(
          "GEMINI AUTO REPLY:",
          error
        );
      }
    );
  }

  return { success: true };
}

export async function ensureMessageMedia(
  messageId: string
) {

  const message =
    await prisma.message.findUnique({
      where: { id: messageId },
    });

  if (!message) {
    throw new Error("MESSAGE_NOT_FOUND");
  }

  if (message.mediaPath) {
    return message;
  }

  if (
    !message.whatsappMsgId ||
    message.messageType === "text"
  ) {
    return message;
  }

  const conversation =
    await prisma.conversation.findUnique({
      where: {
        id: message.conversationId,
      },
    });

  if (!conversation) {
    return message;
  }

  const fetched =
    await fetchWhatsappMedia({
      remoteJid:
        conversation.whatsappJid,
      remoteJidAlt:
        conversation.whatsappJidAlt ||
        undefined,
      fromMe: message.fromMe,
      id: message.whatsappMsgId,
    });

  if (!fetched) {
    throw new Error(
      "MEDIA_NOT_AVAILABLE"
    );
  }

  const mediaPath =
    await saveMessageMedia(
      message.id,
      fetched.base64,
      fetched.mimeType ||
        message.mimeType,
      fetched.fileName ||
        message.fileName
    );

  return prisma.message.update({
    where: { id: message.id },
    data: {
      mediaPath,
      mimeType:
        fetched.mimeType ||
        message.mimeType,
      fileName:
        fetched.fileName ||
        message.fileName,
    },
  });
}
