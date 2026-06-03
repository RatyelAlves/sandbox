import { FastifyInstance } from "fastify";

import { z } from "zod";

import { prisma } from "../lib/prisma";

import {
  deliverOutboundMessage,
} from "../services/chat/deliverOutboundMessage";

import {
  deliverOutboundMedia,
} from "../services/chat/deliverOutboundMedia";

const MAX_MEDIA_BYTES = 16 * 1024 * 1024;

export async function sendRoutes(
  app: FastifyInstance
) {

  app.post(
    "/send-message",

    async (
      request,
      reply
    ) => {

      const bodySchema =
        z.object({
          conversationId:
            z.string(),
          text: z.string(),
          replyToMessageId:
            z.string().optional(),
        });

      const {
        conversationId,
        text,
        replyToMessageId,
      } = bodySchema.parse(
        request.body
      );

      const conversation =
        await prisma.conversation.findUnique({
          where: {
            id: conversationId,
          },
        });

      if (!conversation) {
        return reply
          .status(404)
          .send({
            message:
              "Conversation not found",
          });
      }

      try {
        const result =
          await deliverOutboundMessage(
            conversationId,
            text,
            "text",
            { replyToMessageId }
          );

        return reply.send({
          success: true,
          response:
            result.response,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Falha ao enviar mensagem no WhatsApp";

        return reply.status(502).send({
          success: false,
          message,
        });
      }
    }
  );

  app.post(
    "/send-media",

    async (
      request,
      reply
    ) => {

      const bodySchema =
        z.object({
          conversationId:
            z.string(),
          mimeType:
            z.string(),
          fileName:
            z.string().optional(),
          caption:
            z.string().optional(),
          media:
            z.string().min(1),
          replyToMessageId:
            z.string().optional(),
          deleteLocalMediaAfterSend:
            z.boolean().optional(),
        });

      const body =
        bodySchema.parse(
          request.body
        );

      const conversation =
        await prisma.conversation.findUnique({
          where: {
            id: body.conversationId,
          },
        });

      if (!conversation) {
        return reply
          .status(404)
          .send({
            message:
              "Conversation not found",
          });
      }

      const base64 = body.media.includes(
        ","
      )
        ? body.media.split(",")[1]
        : body.media;

      const sizeBytes =
        Buffer.byteLength(
          base64,
          "base64"
        );

      if (sizeBytes > MAX_MEDIA_BYTES) {
        return reply.status(400).send({
          success: false,
          message:
            "Arquivo muito grande. Limite de 16 MB.",
        });
      }

      try {
        const result =
          await deliverOutboundMedia({
            conversationId:
              body.conversationId,
            base64,
            mimeType:
              body.mimeType,
            fileName:
              body.fileName,
            caption:
              body.caption,
            replyToMessageId:
              body.replyToMessageId,
            deleteLocalMediaAfterSend:
              body.deleteLocalMediaAfterSend,
          });

        return reply.send({
          success: true,
          message: result.message,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Falha ao enviar mídia no WhatsApp";

        return reply.status(502).send({
          success: false,
          message,
        });
      }
    }
  );
}
