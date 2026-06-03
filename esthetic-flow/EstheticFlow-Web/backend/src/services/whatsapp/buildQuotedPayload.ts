import {
  Conversation,
  Message,
} from "@prisma/client";

import {
  resolveSendableJid,
} from "./jid";

export type EvolutionQuoted = {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: Record<string, unknown>;
};

function buildQuotedMessageBody(
  message: Message
) {

  if (
    message.messageType === "text" ||
    message.messageType === "ai"
  ) {
    return {
      conversation: message.content,
    };
  }

  if (message.messageType === "image") {
    return {
      imageMessage: {
        caption: message.content,
      },
    };
  }

  if (message.messageType === "video") {
    return {
      videoMessage: {
        caption: message.content,
      },
    };
  }

  if (message.messageType === "audio") {
    return {
      audioMessage: {},
    };
  }

  if (message.messageType === "document") {
    return {
      documentMessage: {
        fileName:
          message.fileName ||
          "documento",
        caption: message.content,
      },
    };
  }

  return {
    conversation:
      message.content ||
      "[Mensagem]",
  };
}

export function buildQuotedPayload(
  sourceMessage: Message,
  conversation: Conversation
): EvolutionQuoted | undefined {

  if (!sourceMessage.whatsappMsgId) {
    return undefined;
  }

  const remoteJid =
    resolveSendableJid(
      conversation.whatsappJid,
      conversation.whatsappJidAlt
    );

  return {
    key: {
      remoteJid,
      fromMe: sourceMessage.fromMe,
      id: sourceMessage.whatsappMsgId,
    },
    message: buildQuotedMessageBody(
      sourceMessage
    ),
  };
}
