import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../lib/prisma";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

import {
  linkConversationPhone,
} from "../services/chat/linkConversationPhone";

import {
  deleteConversation,
  deleteAllConversations,
} from "../services/chat/conversation.service";

import {
  blockHistoryImport,
} from "../services/whatsapp/whatsappConnection.service";

import {
  deleteMessageForEveryone,
} from "../services/chat/deleteMessageForEveryone";

import {
  forwardMessage,
} from "../services/chat/forwardMessage";

import {
  ensureMessageMedia,
} from "../services/chat/inboundMessage.service";

import {
  syncOlderConversationMessages,
} from "../services/whatsapp/syncWhatsappHistory";

import {
  readMessageMedia,
} from "../services/chat/mediaStorage";

export async function chatRoutes(
  app: FastifyInstance
) {

  app.get("/conversations", async (
    request
  ) => {

    const querySchema = z.object({
      includeArchived: z
        .union([
          z.literal("true"),
          z.literal("false"),
        ])
        .optional(),
    });

    const { includeArchived } =
      querySchema.parse(
        request.query ?? {}
      );

    const showArchived =
      includeArchived === "true";

    const conversations =
      await prisma.conversation.findMany({
        where: showArchived
          ? undefined
          : { archived: false },

        include: {
          client: true,

          messages: {
            orderBy: {
              createdAt: "desc",
            },

            take: 1,
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      });

    return conversations;
  });

  app.get("/messages/:conversationId", async (
    request
  ) => {

    const paramsSchema = z.object({
      conversationId: z.string(),
    });

    const { conversationId } =
      paramsSchema.parse(request.params);

    const messages =
      await prisma.message.findMany({
        where: {
          conversationId,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    return messages;
  });

  app.post(
    "/conversations/:conversationId/sync-older",
    async (request, reply) => {

      const paramsSchema = z.object({
        conversationId: z.string(),
      });

      const { conversationId } =
        paramsSchema.parse(
          request.params
        );

      try {
        const result =
          await syncOlderConversationMessages(
            conversationId
          );

        return reply.send(result);
      } catch (error) {

        if (
          (error as Error).message ===
          "CONVERSATION_NOT_FOUND"
        ) {
          return reply
            .status(404)
            .send({
              error:
                "Conversa não encontrada",
            });
        }

        request.log.error(error);

        return reply
          .status(500)
          .send({
            error:
              "Falha ao sincronizar mensagens antigas",
          });
      }
    }
  );

  app.get(
    "/messages/:messageId/media",

    async (
      request,
      reply
    ) => {

      const paramsSchema = z.object({
        messageId: z.string(),
      });

      const { messageId } =
        paramsSchema.parse(
          request.params
        );

      try {
        const message =
          await ensureMessageMedia(
            messageId
          );

        if (!message.mediaPath) {
          return reply
            .status(404)
            .send({
              error:
                "Mídia não disponível",
            });
        }

        const buffer =
          await readMessageMedia(
            message.mediaPath
          );

        return reply
          .header(
            "Content-Type",
            message.mimeType ||
              "application/octet-stream"
          )
          .header(
            "Content-Disposition",
            message.fileName
              ? `inline; filename="${message.fileName}"`
              : "inline"
          )
          .send(buffer);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            "MESSAGE_NOT_FOUND"
        ) {
          return reply
            .status(404)
            .send({
              error:
                "Mensagem não encontrada",
            });
        }

        if (
          error instanceof Error &&
          error.message ===
            "MEDIA_NOT_AVAILABLE"
        ) {
          return reply
            .status(404)
            .send({
              error:
                "Não foi possível baixar a mídia",
            });
        }

        throw error;
      }
    }
  );

  app.post(
    "/conversations/:conversationId/read",

    async (request) => {

      const paramsSchema = z.object({
        conversationId: z.string(),
      });

      const { conversationId } =
        paramsSchema.parse(request.params);

      const conversation =
        await prisma.conversation.update({
          where: {
            id: conversationId,
          },

          data: {
            unreadCount: 0,
            lastReadAt: new Date(),
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

      return conversation;
    }
  );

  app.post(
    "/conversations/:conversationId/link-phone",

    async (request, reply) => {

      const paramsSchema = z.object({
        conversationId: z.string(),
      });

      const bodySchema = z.object({
        phone: z.string().min(8),
      });

      const { conversationId } =
        paramsSchema.parse(
          request.params
        );

      const { phone } =
        bodySchema.parse(
          request.body
        );

      try {

        const conversation =
          await linkConversationPhone(
            conversationId,
            phone
          );

        return reply.send({
          success: true,
          conversation,
        });

      } catch (error) {

        const message =
          error instanceof Error
            ? error.message
            : "Falha ao vincular número";

        return reply.status(400).send({
          success: false,
          message,
        });
      }
    }
  );

  app.delete(
    "/conversations/all",

    async (
      request,
      reply
    ) => {

      if (
        !requireAdmin(
          request,
          reply
        )
      ) {
        return;
      }

      const result =
        await deleteAllConversations();

      await blockHistoryImport();

      return reply.send({
        success: true,
        ...result,
      });
    }
  );

  app.delete(
    "/conversations/:conversationId",

    async (
      request,
      reply
    ) => {

      const paramsSchema = z.object({
        conversationId: z.string(),
      });

      const { conversationId } =
        paramsSchema.parse(
          request.params
        );

      try {

        await deleteConversation(
          conversationId
        );

        return reply.send({
          success: true,
        });

      } catch (error) {

        if (
          error instanceof Error &&
          error.message ===
            "CONVERSATION_NOT_FOUND"
        ) {
          return reply
            .status(404)
            .send({
              error:
                "Conversa não encontrada",
            });
        }

        throw error;
      }
    }
  );

  app.delete(
    "/messages/:messageId/for-everyone",

    async (
      request,
      reply
    ) => {

      const paramsSchema = z.object({
        messageId: z.string(),
      });

      const { messageId } =
        paramsSchema.parse(
          request.params
        );

      try {
        const result =
          await deleteMessageForEveryone(
            messageId
          );

        return reply.send(result);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            "MESSAGE_NOT_FOUND"
        ) {
          return reply
            .status(404)
            .send({
              message:
                "Mensagem não encontrada",
            });
        }

        if (
          error instanceof Error &&
          error.message ===
            "NOT_MEDIA_MESSAGE"
        ) {
          return reply
            .status(400)
            .send({
              message:
                "Só é possível apagar mensagens de mídia",
            });
        }

        if (
          error instanceof Error &&
          error.message ===
            "NO_WHATSAPP_MSG_ID"
        ) {
          return reply
            .status(400)
            .send({
              message:
                "Mensagem sem ID do WhatsApp",
            });
        }

        if (
          error instanceof Error &&
          error.message ===
            "CANNOT_DELETE_INBOUND_FOR_EVERYONE"
        ) {
          return reply
            .status(400)
            .send({
              message:
                "Só mensagens enviadas pela clínica podem ser apagadas para todos",
            });
        }

        const message =
          error instanceof Error
            ? error.message
            : "Falha ao apagar mensagem no WhatsApp";

        return reply.status(502).send({
          success: false,
          message,
        });
      }
    }
  );

  app.post(
    "/forward-message",

    async (
      request,
      reply
    ) => {

      const bodySchema = z.object({
        messageId: z.string(),
        targetConversationId:
          z.string(),
      });

      const body =
        bodySchema.parse(
          request.body
        );

      try {
        const result =
          await forwardMessage(
            body.messageId,
            body.targetConversationId
          );

        return reply.send({
          success: true,
          message: result.message,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Falha ao encaminhar mensagem";

        return reply.status(502).send({
          success: false,
          message,
        });
      }
    }
  );
}
