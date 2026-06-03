import { prisma } from "../../lib/prisma";

import {
  deliverOutboundMessage,
} from "./deliverOutboundMessage";

import {
  deliverOutboundMedia,
} from "./deliverOutboundMedia";

import {
  readMessageMedia,
} from "./mediaStorage";

import {
  fetchWhatsappMedia,
} from "../whatsapp/fetchWhatsappMedia";

import {
  resolveSendableJid,
} from "../whatsapp/jid";

const MEDIA_TYPES = new Set([
  "image",
  "video",
  "audio",
  "document",
  "sticker",
]);

export async function forwardMessage(
  messageId: string,
  targetConversationId: string
) {

  const sourceMessage =
    await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    });

  if (!sourceMessage) {
    throw new Error(
      "Mensagem não encontrada"
    );
  }

  const targetConversation =
    await prisma.conversation.findUnique({
      where: {
        id: targetConversationId,
      },
    });

  if (!targetConversation) {
    throw new Error(
      "Conversa de destino não encontrada"
    );
  }

  const isMedia =
    MEDIA_TYPES.has(
      sourceMessage.messageType
    );

  if (!isMedia) {
    const text =
      sourceMessage.content.trim();

    return deliverOutboundMessage(
      targetConversationId,
      `↪ ${text}`,
      "text"
    );
  }

  let base64: string;

  if (sourceMessage.mediaPath) {
    const buffer =
      await readMessageMedia(
        sourceMessage.mediaPath
      );

    base64 = buffer.toString("base64");
  } else if (
    sourceMessage.whatsappMsgId
  ) {
    const sendableJid =
      resolveSendableJid(
        sourceMessage.conversation
          .whatsappJid,
        sourceMessage.conversation
          .whatsappJidAlt
      );

    const fetched =
      await fetchWhatsappMedia({
        remoteJid: sendableJid,
        fromMe:
          sourceMessage.fromMe,
        id: sourceMessage.whatsappMsgId,
      });

    if (!fetched?.base64) {
      throw new Error(
        "Mídia não disponível para encaminhar"
      );
    }

    base64 = fetched.base64;
  } else {
    throw new Error(
      "Mídia não disponível para encaminhar"
    );
  }

  const caption =
    sourceMessage.content &&
    !/^\[(Imagem|Vídeo|Áudio|Documento|Sticker)/.test(
      sourceMessage.content.trim()
    )
      ? sourceMessage.content
      : undefined;

  return deliverOutboundMedia({
    conversationId:
      targetConversationId,
    base64,
    mimeType:
      sourceMessage.mimeType ||
      "application/octet-stream",
    fileName:
      sourceMessage.fileName,
    caption,
    deleteLocalMediaAfterSend: true,
  });
}
