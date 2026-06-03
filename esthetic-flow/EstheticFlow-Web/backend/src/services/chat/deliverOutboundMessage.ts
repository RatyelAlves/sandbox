import { prisma }
from "../../lib/prisma";

import * as socketModule
from "../../sockets/socket";

import {
  sendWhatsappMessage,
} from "../whatsapp/sendWhatsappMessage";

import {
  isLidJid,
  jidToPhone,
  resolveSendableJid,
} from "../whatsapp/jid";

import {
  resolvePhoneJidFromEvolution,
} from "../whatsapp/resolveLidContact";

import {
  loadReplyContext,
  ReplyDbFields,
} from "./replyContext";

type DeliverOptions = {
  allowWhatsAppFailure?: boolean;
  replyToMessageId?: string;
};

async function persistOutboundMessage(
  conversationId: string,
  text: string,
  messageType: string,
  whatsappMsgId?: string | null,
  replyFields?: ReplyDbFields | null
) {

  const message =
    await prisma.message.create({
      data: {
        conversationId,

        content: text,

        fromMe: true,

        messageType,

        whatsappMsgId:
          whatsappMsgId || undefined,

        replyToMessageId:
          replyFields?.replyToMessageId,
        quotedWhatsappMsgId:
          replyFields?.quotedWhatsappMsgId,
        quotedContent:
          replyFields?.quotedContent,
        quotedFromMe:
          replyFields?.quotedFromMe,
        quotedMessageType:
          replyFields?.quotedMessageType,
      },
    });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },

    data: {
      updatedAt: new Date(),
    },
  });

  socketModule.io.emit(
    "new-message",
    {
      conversationId,

      message,
    }
  );

  return message;
}

async function prepareConversationForSend(
  conversationId: string
) {

  let conversation =
    await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },

      include: {
        client: true,
      },
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
          where: {
            id: conversationId,
          },

          data: {
            whatsappJidAlt:
              resolvedAlt,
          },

          include: {
            client: true,
          },
        });

      if (
        resolvedAlt.endsWith(
          "@s.whatsapp.net"
        )
      ) {
        await prisma.client.update({
          where: {
            id:
              conversation.clientId,
          },

          data: {
            phone: jidToPhone(
              resolvedAlt
            ),
          },
        });
      }
    }
  }

  return conversation;
}

export async function deliverOutboundMessage(
  conversationId: string,
  text: string,
  messageType = "text",
  options: DeliverOptions = {}
) {

  const conversation =
    await prepareConversationForSend(
      conversationId
    );

  const replyContext =
    await loadReplyContext(
      options.replyToMessageId,
      conversationId
    );

  const sendableJid =
    resolveSendableJid(
      conversation.whatsappJid,
      conversation.whatsappJidAlt
    );

  console.log("[SEND]", {
    conversationId,
    whatsappJid:
      conversation.whatsappJid,
    whatsappJidAlt:
      conversation.whatsappJidAlt,
    clientPhone:
      conversation.client.phone,
    sendableJid,
  });

  let response: unknown = null;
  let whatsappDelivered = true;
  let whatsappWarning: string | undefined;

  try {

    response =
      await sendWhatsappMessage(
        sendableJid,
        text,
        conversation.client.name,
        replyContext?.quoted
      );

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : "Falha ao enviar mensagem no WhatsApp";

    if (!options.allowWhatsAppFailure) {
      throw new Error(message);
    }

    whatsappDelivered = false;

    whatsappWarning =
      isLidJid(conversation.whatsappJid)
        ? "Resposta da IA salva no chat, mas não foi enviada no WhatsApp: contato @lid sem número. Vincule o telefone do cliente no chat."
        : `Resposta da IA salva no chat, mas não foi enviada no WhatsApp: ${message}`;
  }

  if (
    whatsappDelivered &&
    !conversation.whatsappJidAlt &&
    isLidJid(
      conversation.whatsappJid
    )
  ) {

    const evolutionResponse = response as {
      key?: {
        remoteJidAlt?: string;
        remoteJid?: string;
      };
    };

    const resolvedAlt =
      evolutionResponse?.key?.remoteJidAlt ||
      evolutionResponse?.key?.remoteJid;

    if (
      resolvedAlt?.endsWith(
        "@s.whatsapp.net"
      )
    ) {

      await prisma.conversation.update({
        where: {
          id: conversationId,
        },

        data: {
          whatsappJidAlt:
            resolvedAlt,
        },
      });

      await prisma.client.update({
        where: {
          id:
            conversation.clientId,
        },

        data: {
          phone: jidToPhone(
            resolvedAlt
          ),
        },
      });
    }
  }

  const message =
    await persistOutboundMessage(
      conversationId,
      text,
      messageType,
      whatsappDelivered
        ? (
            response as {
              key?: { id?: string };
            }
          )?.key?.id
        : undefined,
      replyContext?.dbFields
    );

  return {
    message,
    response,
    whatsappDelivered,
    whatsappWarning,
  };
}
