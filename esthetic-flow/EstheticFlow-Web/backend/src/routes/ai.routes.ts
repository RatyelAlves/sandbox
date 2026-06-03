import { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "../config/env";

import {
  replyWithAi,
} from "../services/chat/replyWithAi";

import {
  parseGeminiError,
} from "../services/gemini/generateClinicReply";

export async function aiRoutes(
  app: FastifyInstance
) {

  app.get("/ai/status", async () => {

    return {
      configured:
        Boolean(env.geminiApiKey),

      autoReply:
        env.geminiAutoReply,

      model: env.geminiModel,

      fallbackModels:
        env.geminiFallbackModels,
    };
  });

  app.post(
    "/conversations/:conversationId/ai-reply",

    async (request, reply) => {

      const paramsSchema = z.object({
        conversationId: z.string(),
      });

      const { conversationId } =
        paramsSchema.parse(
          request.params
        );

      if (!env.geminiApiKey) {
        return reply.status(503).send({
          success: false,

          message:
            "Configure GEMINI_API_KEY no backend/.env",
        });
      }

      try {

        const result =
          await replyWithAi(
            conversationId
          );

        return reply.send({
          success: true,

          message: result.message,

          text: result.message.content,

          whatsappDelivered:
            result.whatsappDelivered,

          warning:
            result.whatsappWarning,
        });

      } catch (error) {

        const message =
          parseGeminiError(error);

        return reply.status(502).send({
          success: false,
          message,
        });
      }
    }
  );
}
