import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  createProcedure,
  deleteProcedure,
  getProcedure,
  listProcedures,
  updateProcedure,
} from "../services/procedure/procedure.service";

import {
  createProcedureSchema,
  listProceduresQuerySchema,
  procedureIdParamSchema,
  updateProcedureSchema,
} from "../services/procedure/procedure.schema";

function handleServiceError(
  error: unknown
) {

  if (
    error instanceof Error &&
    error.message ===
      "PROCEDURE_NOT_FOUND"
  ) {
    return {
      statusCode: 404,
      body: {
        error:
          "Procedimento não encontrado",
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
            "Já existe um procedimento com este nome",
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

export async function procedureRoutes(
  app: FastifyInstance
) {

  app.get("/procedures", async (
    request,
    reply
  ) => {

    try {

      const query =
        listProceduresQuerySchema.parse(
          request.query
        );

      const procedures =
        await listProcedures(query);

      return reply.send(procedures);

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

  app.get("/procedures/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        procedureIdParamSchema.parse(
          request.params
        );

      const procedure =
        await getProcedure(id);

      return reply.send(procedure);

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

  app.post("/procedures", async (
    request,
    reply
  ) => {

    try {

      const body =
        createProcedureSchema.parse(
          request.body
        );

      const procedure =
        await createProcedure(body);

      return reply
        .status(201)
        .send(procedure);

    } catch (error) {

      const handled =
        handleServiceError(error);

      if (handled) {
        return reply
          .status(handled.statusCode)
          .send(handled.body);
      }

      if (
        error instanceof Error &&
        error.message.includes("Unique")
      ) {
        return reply.status(409).send({
          error:
            "Já existe um procedimento com este nome",
        });
      }

      throw error;
    }
  });

  app.put("/procedures/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        procedureIdParamSchema.parse(
          request.params
        );

      const body =
        updateProcedureSchema.parse(
          request.body
        );

      const procedure =
        await updateProcedure(
          id,
          body
        );

      return reply.send(procedure);

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

  app.delete("/procedures/:id", async (
    request,
    reply
  ) => {

    try {

      const { id } =
        procedureIdParamSchema.parse(
          request.params
        );

      const result =
        await deleteProcedure(id);

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
