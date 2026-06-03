import { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/auth/auth.service";

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../services/auth/auth.schema";

import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "../services/auth/passwordReset.service";

function handleAuthError(
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
      "INVALID_CREDENTIALS"
    ) {
      return {
        statusCode: 401,
        body: {
          error:
            "E-mail ou senha incorretos",
        },
      };
    }

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
      "USER_INACTIVE"
    ) {
      return {
        statusCode: 403,
        body: {
          error:
            "Sua conta está bloqueada. Fale com o administrador.",
        },
      };
    }

    if (
      error.message ===
      "PENDING_APPROVAL"
    ) {
      return {
        statusCode: 403,
        body: {
          error:
            "Seu cadastro aguarda aprovação do administrador.",
        },
      };
    }

    if (
      error.message ===
      "REGISTRATION_CLOSED"
    ) {
      return {
        statusCode: 403,
        body: {
          error:
            "Cadastro indisponível. Fale com o administrador da clínica.",
        },
      };
    }

    if (
      error.message ===
      "INVALID_RESET_TOKEN"
    ) {
      return {
        statusCode: 400,
        body: {
          error:
            "Link inválido ou expirado. Solicite uma nova redefinição de senha.",
        },
      };
    }
  }

  throw error;
}

export async function authRoutes(
  app: FastifyInstance
) {
  app.post(
    "/auth/register",

    async (
      request,
      reply
    ) => {
      try {
        const body =
          registerSchema.parse(
            request.body
          );

        const result =
          await registerUser(body);

        return reply
          .status(201)
          .send(result);
      } catch (error) {
        const handled =
          handleAuthError(error);

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

  app.post(
    "/auth/login",

    async (
      request,
      reply
    ) => {
      try {
        const body =
          loginSchema.parse(
            request.body
          );

        const result =
          await loginUser(body);

        return result;
      } catch (error) {
        const handled =
          handleAuthError(error);

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
    "/auth/me",

    async (
      request,
      reply
    ) => {
      try {
        if (!request.userId) {
          return reply
            .status(401)
            .send({
              error:
                "Não autenticado",
            });
        }

        const user =
          await getUserById(
            request.userId
          );

        return { user };
      } catch (error) {
        const handled =
          handleAuthError(error);

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

  app.post(
    "/auth/forgot-password",

    async (
      request,
      reply
    ) => {
      try {
        const body =
          forgotPasswordSchema.parse(
            request.body
          );

        const result =
          await requestPasswordReset(
            body.email
          );

        return reply.send(result);
      } catch (error) {
        const handled =
          handleAuthError(error);

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

  app.post(
    "/auth/reset-password",

    async (
      request,
      reply
    ) => {
      try {
        const body =
          resetPasswordSchema.parse(
            request.body
          );

        await resetPasswordWithToken(
          body
        );

        return reply.send({
          success: true,
          message:
            "Senha redefinida com sucesso. Faça login.",
        });
      } catch (error) {
        const handled =
          handleAuthError(error);

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
