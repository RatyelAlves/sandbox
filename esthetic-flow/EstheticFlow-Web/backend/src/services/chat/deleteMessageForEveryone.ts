import { prisma } from "../../lib/prisma";

import * as socketModule from "../../sockets/socket";

import {
  resolveSendableJid,
} from "../whatsapp/jid";

import {
  deleteWhatsappMessageForEveryone,
} from "../whatsapp/deleteWhatsappMessage";

import {
  deleteMessageMedia,
} from "./mediaStorage";

const MEDIA_TYPES = new Set([
  "image",
  "video",
  "audio",
  "document",
  "sticker",
]);

export async function deleteMessageForEveryone(
  messageId: string
) {

  const message =
    await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    });

  if (!message) {
    throw new Error(
      "MESSAGE_NOT_FOUND"
    );
  }

  if (
    !MEDIA_TYPES.has(
      message.messageType
    )
  ) {
    throw new Error(
      "NOT_MEDIA_MESSAGE"
    );
  }

  if (!message.whatsappMsgId) {
    throw new Error(
      "NO_WHATSAPP_MSG_ID"
    );
  }

  if (!message.fromMe) {
    throw new Error(
      "CANNOT_DELETE_INBOUND_FOR_EVERYONE"
    );
  }

  const remoteJid =
    resolveSendableJid(
      message.conversation
        .whatsappJid,
      message.conversation
        .whatsappJidAlt
    );

  await deleteWhatsappMessageForEveryone(
    {
      remoteJid,
      fromMe: message.fromMe,
      id: message.whatsappMsgId,
    }
  );

  await deleteMessageMedia(
    message.mediaPath
  );

  await prisma.message.delete({
    where: { id: messageId },
  });

  socketModule.io.emit(
    "new-message",
    {
      conversationId:
        message.conversationId,
    }
  );

  return {
    success: true,
    conversationId:
      message.conversationId,
  };
}
