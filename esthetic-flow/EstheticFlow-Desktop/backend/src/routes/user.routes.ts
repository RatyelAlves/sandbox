import { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

import {
  approveUserByAdmin,
  countPendingUsers,
  createUserByAdmin,
  deleteUserByAdmin,
  listUsers,
  toggleUserActiveByAdmin,
  updateUserByAdmin,
} from "../services/auth/user.service";

import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../services/auth/user.schema";

function handleUserError(
  error: unknown
) {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        error: "Dados inválidos",
        details: error.flatten(),
      },
    };
  }

  if (
    error instanceof Error
  ) {
    if (
      error.message ===
      "USER_NOT_FOUND"
    ) {
      return {
        statusCode: 404,
        body: {
          error:
            "Usuário não encontrado",
        },
      };
    }

    if (
      error.message ===
      "EMAIL_IN_USE"
    ) {
      return {
        statusCode: 409,
        body: {
          error:
            "Este e-mail já está cadastrado",
        },
      };
    }

    if (
      error.message ===
      "CANNOT_DELETE_SELF"
    ) {
      return {
        statusCode: 400,
        body: {
          error:
            "Você não pode excluir sua própria conta",
        },
      };
    }

    if (
      error.message ===
      "CANNOT_BLOCK_SELF"
    ) {
      return {
        statusCode: 400,
        body: {
          error:
            "Você não pode bloquear sua própria conta",
        },
      };
    }

    if (
      error.message ===
      "LAST_ADMIN"
    ) {
      return {
        statusCode: 400,
        body: {
          error:
            "É necessário manter ao menos um administrador",
        },
      };
    }

    if (
      error.message ===
      "ALREADY_APPROVED"
    ) {
      return {
        statusCode: 400,
        body: {
          error:
            "Este usuário já foi aprovado",
        },
      };
    }
  }

  throw error;
}

export async function userRoutes(
  app: FastifyInstance
) {

  app.get(
    "/users/pending-count",

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

      const count =
        await countPendingUsers();

      return { count };
    }
  );

  app.post(
    "/users",

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

      try {
        const body =
          createUserSchema.parse(
            request.body
          );

        const user =
          await createUserByAdmin(body);

        return reply
          .status(201)
          .send({ user });
      } catch (error) {
        const handled =
          handleUserError(error);

        if (handled) {
          return reply
            .status(
              handled.statusCode
            )
            .send(handled.body);
        }

        throw error;
      }
    }
  );

  app.get(
    "/users",

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

      const users =
        await listUsers();

      return { users };
    }
  );

  app.put(
    "/users/:userId",

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

      try {
        const { userId } =
          userIdParamSchema.parse(
            request.params
          );

        const body =
          updateUserSchema.parse(
            request.body
          );

        const user =
          await updateUserByAdmin({
            actorUserId:
              request.userId!,
            targetUserId: userId,
            ...body,
          });

        return { user };
      } catch (error) {
        const handled =
          handleUserError(error);

        if (handled) {
          return reply
            .status(
              handled.statusCode
            )
            .send(handled.body);
        }

        throw error;
      }
    }
  );

  app.delete(
    "/users/:userId",

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

      try {
        const { userId } =
          userIdParamSchema.parse(
            request.params
          );

        await deleteUserByAdmin({
          actorUserId:
            request.userId!,
          targetUserId: userId,
        });

        return {
          success: true,
        };
      } catch (error) {
        const handled =
          handleUserError(error);

        if (handled) {
          return reply
            .status(
              handled.statusCode
            )
            .send(handled.body);
        }

        throw error;
      }
    }
  );

  app.patch(
    "/users/:userId/approve",

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

      try {
        const { userId } =
          userIdParamSchema.parse(
            request.params
          );

        const user =
          await approveUserByAdmin({
            actorUserId:
              request.userId!,
            targetUserId: userId,
          });

        return { user };
      } catch (error) {
        const handled =
          handleUserError(error);

        if (handled) {
          return reply
            .status(
              handled.statusCode
            )
            .send(handled.body);
        }

        throw error;
      }
    }
  );

  app.patch(
    "/users/:userId/active",

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

      try {
        const { userId } =
          userIdParamSchema.parse(
            request.params
          );

        const bodySchema = z.object({
          active: z.boolean(),
        });

        const { active } =
          bodySchema.parse(
            request.body
          );

        const user =
          await toggleUserActiveByAdmin(
            {
              actorUserId:
                request.userId!,
              targetUserId: userId,
              active,
            }
          );

        return { user };
      } catch (error) {
        const handled =
          handleUserError(error);

        if (handled) {
          return reply
            .status(
              handled.statusCode
            )
            .send(handled.body);
        }

        throw error;
      }
    }
  );
}
