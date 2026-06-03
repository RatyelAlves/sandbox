import { prisma }
from "../../lib/prisma";

import {
  isLidJid,
} from "../whatsapp/jid";

import {
  normalizeBrazilPhone,
  phoneToWhatsappJid,
} from "../whatsapp/normalizePhone";

export async function linkConversationPhone(
  conversationId: string,
  rawPhone: string
) {

  const conversation =
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

  const phone =
    normalizeBrazilPhone(rawPhone);

  const whatsappJidAlt =
    phoneToWhatsappJid(phone);

  const existingClient =
    await prisma.client.findFirst({
      where: {
        phone,

        NOT: {
          id:
            conversation.clientId,
        },
      },
    });

  if (existingClient) {
    throw new Error(
      "Este número já está vinculado a outro cliente"
    );
  }

  const updated =
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },

      data: {
        whatsappJidAlt,
      },

      include: {
        client: true,

        messages: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },
      },
    });

  await prisma.client.update({
    where: {
      id: conversation.clientId,
    },

    data: {
      phone,
    },
  });

  return {
    ...updated,

    client: {
      ...updated.client,
      phone,
    },
  };
}

export function conversationNeedsPhoneLink(
  whatsappJid: string,
  whatsappJidAlt?: string | null
): boolean {

  return (
    isLidJid(whatsappJid) &&
    !whatsappJidAlt
  );
}
