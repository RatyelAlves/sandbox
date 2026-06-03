import { prisma } from "../../lib/prisma";

import * as socketModule from "../../sockets/socket";

import {
  sendWhatsappMedia,
  inferOutboundMediaType,
} from "../whatsapp/sendWhatsappMedia";

import {
  isLidJid,
  jidToPhone,
  resolveSendableJid,
} from "../whatsapp/jid";

import {
  resolvePhoneJidFromEvolution,
} from "../whatsapp/resolveLidContact";

import {
  saveMessageMedia,
  deleteMessageMedia,
} from "./mediaStorage";

import {
  loadReplyContext,
} from "./replyContext";

type OutboundMediaPayload = {
  conversationId: string;
  base64: string;
  mimeType: string;
  fileName?: string;
  caption?: string;
  replyToMessageId?: string;
  deleteLocalMediaAfterSend?: boolean;
};

async function prepareConversationForSend(
  conversationId: string
) {

  let conversation =
    await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: true },
    });

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  if (
    isLidJid(
      conversation.whatsappJid
    ) &&
    !conversation.whatsappJidAlt
  ) {
    const resolvedAlt =
      await resolvePhoneJidFromEvolution(
        conversation.whatsappJid,
        conversation.client.name
      );

    if (resolvedAlt) {
      conversation =
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            whatsappJidAlt: resolvedAlt,
          },
          include: { client: true },
        });

      if (
        resolvedAlt.endsWith(
          "@s.whatsapp.net"
        )
      ) {
        await prisma.client.update({
          where: {
            id: conversation.clientId,
          },
          data: {
            phone: jidToPhone(resolvedAlt),
          },
        });
      }
    }
  }

  return conversation;
}

export async function deliverOutboundMedia(
  input: OutboundMediaPayload
) {

  const conversation =
    await prepareConversationForSend(
      input.conversationId
    );

  const replyContext =
    await loadReplyContext(
      input.replyToMessageId,
      input.conversationId
    );

  const sendableJid =
    resolveSendableJid(
      conversation.whatsappJid,
      conversation.whatsappJidAlt
    );

  const mediatype =
    inferOutboundMediaType(
      input.mimeType
    );

  const response =
    await sendWhatsappMedia(
      sendableJid,
      {
        mediatype,
        mimetype: input.mimeType,
        media: input.base64,
        fileName: input.fileName,
        caption: input.caption,
      },
      conversation.client.name,
      replyContext?.quoted
    );

  const whatsappMsgId = (
    response as {
      key?: { id?: string };
    }
  )?.key?.id;

  const content =
    input.caption?.trim() ||
    (mediatype === "image"
      ? "[Imagem]"
      : mediatype === "video"
        ? "[Vídeo]"
        : mediatype === "audio"
          ? "[Áudio]"
          : `[Documento] ${input.fileName || "arquivo"}`);

  const message =
    await prisma.message.create({
      data: {
        conversationId:
          input.conversationId,
        content,
        fromMe: true,
        messageType: mediatype,
        mimeType: input.mimeType,
        fileName: input.fileName,
        whatsappMsgId,
        replyToMessageId:
          replyContext?.dbFields
            ?.replyToMessageId,
        quotedWhatsappMsgId:
          replyContext?.dbFields
            ?.quotedWhatsappMsgId,
        quotedContent:
          replyContext?.dbFields
            ?.quotedContent,
        quotedFromMe:
          replyContext?.dbFields
            ?.quotedFromMe,
        quotedMessageType:
          replyContext?.dbFields
            ?.quotedMessageType,
      },
    });

  const mediaPath =
    await saveMessageMedia(
      message.id,
      input.base64,
      input.mimeType,
      input.fileName
    );

  let savedMessage =
    await prisma.message.update({
      where: { id: message.id },
      data: { mediaPath },
    });

  const shouldDeleteLocal =
    input.deleteLocalMediaAfterSend ??
    true;

  if (
    shouldDeleteLocal &&
    savedMessage.mediaPath
  ) {
    await deleteMessageMedia(
      savedMessage.mediaPath
    );

    savedMessage =
      await prisma.message.update({
        where: { id: message.id },
        data: {
          mediaPath: null,
        },
      });
  }

  await prisma.conversation.update({
    where: {
      id: input.conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  socketModule.io.emit(
    "new-message",
    {
      conversationId:
        input.conversationId,
      message: savedMessage,
    }
  );

  return {
    message: savedMessage,
    response,
  };
}
