import { prisma } from "../../lib/prisma";

import {
  buildQuotedPayload,
  EvolutionQuoted,
} from "../whatsapp/buildQuotedPayload";

import {
  ensureMessageWhatsappId,
} from "../whatsapp/resolveMessageWhatsappId";

export type ReplyDbFields = {
  replyToMessageId: string;
  quotedWhatsappMsgId: string;
  quotedContent: string;
  quotedFromMe: boolean;
  quotedMessageType: string;
};

export type ReplyContext = {
  quoted: EvolutionQuoted;
  dbFields: ReplyDbFields;
};

export async function loadReplyContext(
  replyToMessageId: string | undefined,
  conversationId: string
): Promise<ReplyContext | null> {

  if (!replyToMessageId) {
    return null;
  }

  const sourceMessage =
    await prisma.message.findFirst({
      where: {
        id: replyToMessageId,
        conversationId,
      },
    });

  if (!sourceMessage) {
    throw new Error(
      "Mensagem para resposta não encontrada"
    );
  }

  const conversation =
    await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  const whatsappMsgId =
    (await ensureMessageWhatsappId(
      sourceMessage,
      conversation
    )) ||
    sourceMessage.whatsappMsgId;

  if (!whatsappMsgId) {
    throw new Error(
      "Não foi possível localizar a mensagem no WhatsApp para responder. Tente responder a uma mensagem mais recente."
    );
  }

  const messageForQuote = {
    ...sourceMessage,
    whatsappMsgId,
  };

  const quoted =
    buildQuotedPayload(
      messageForQuote,
      conversation
    );

  if (!quoted) {
    throw new Error(
      "Não foi possível montar a resposta citada"
    );
  }

  return {
    quoted,
    dbFields: {
      replyToMessageId,
      quotedWhatsappMsgId:
        whatsappMsgId,
      quotedContent:
        sourceMessage.content,
      quotedFromMe:
        sourceMessage.fromMe,
      quotedMessageType:
        sourceMessage.messageType,
    },
  };
}
