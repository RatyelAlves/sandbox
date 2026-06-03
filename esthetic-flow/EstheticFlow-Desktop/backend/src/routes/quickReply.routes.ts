import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  createQuickReply,
  deleteQuickReply,
  getQuickReply,
  listQuickReplies,
  updateQuickReply,
} from "../services/quickReply/quickReply.service";

import {
  createQuickReplySchema,
  listQuickRepliesQuerySchema,
  quickReplyIdParamSchema,
  updateQuickReplySchema,
} from "../services/quickReply/quickReply.schema";

function handleServiceError(
  error: unknown
) {

  if (
    error instanceof Error &&
    error.message ===
      "QUICK_REPLY_NOT_FOUND"
  ) {
    return {
      statusCode: 404,
      body: {
        error:
          "Resposta rápida não encontrada",
      },
    };
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      return {
        statusCode: 409,
        body: {
          error:
            "Já existe uma resposta rápida com este título ou atalho",
        },
      };
    }
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        error: "Dados inválidos",
        details: error.flatten(),
      },
    };
  }

  throw error;
}

export async function quickReplyRoutes(
  app: FastifyInstance
) {

  app.get("/quick-replies", async (
    request,
    reply
  ) => {

    try {

      const query =
        listQuickRepliesQuerySchema.parse(
          request.query
        );

      const quickReplies =
        await listQuickReplies(query);

      return reply.send(quickReplies);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.get("/quick-replies/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        quickReplyIdParamSchema.parse(
          request.params
        );

      const quickReply =
        await getQuickReply(id);

      return reply.send(quickReply);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.post("/quick-replies", async (
    request,
    reply
  ) => {

    try {

      const body =
        createQuickReplySchema.parse(
          request.body
        );

      const quickReply =
        await createQuickReply(body);

      return reply
        .status(201)
        .send(quickReply);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.put("/quick-replies/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        quickReplyIdParamSchema.parse(
          request.params
        );

      const body =
        updateQuickReplySchema.parse(
          request.body
        );

      const quickReply =
        await updateQuickReply(
          id,
          body
        );

      return reply.send(quickReply);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });

  app.delete("/quick-replies/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        quickReplyIdParamSchema.parse(
          request.params
        );

      const result =
        await deleteQuickReply(id);

      return reply.send(result);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      throw error;
    }
  });
}
