import { prisma }
from "../../lib/prisma";

import {
  generateClinicReplyWithTools,
} from "../gemini/generateClinicReplyWithTools";

import {
  deliverOutboundMessage,
} from "./deliverOutboundMessage";

export async function replyWithAi(
  conversationId: string
) {

  const conversation =
    await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },

      include: {
        client: true,

        messages: {
          orderBy: {
            createdAt: "desc",
          },

          take: 12,
        },
      },
    });

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  const history =
    [...conversation.messages]
      .reverse()
      .map((message) => ({
        content: message.content,

        fromMe: message.fromMe,
      }));

  const aiText =
    await generateClinicReplyWithTools(
      conversation.client.id,
      conversation.client.name,
      history
    );

  return deliverOutboundMessage(
    conversationId,
    aiText,
    "ai",
    {
      allowWhatsAppFailure: true,
    }
  );
}
