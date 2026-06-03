import {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  verifyAccessToken,
} from "../services/auth/auth.service";

import {
  assertUserIsActive,
} from "../services/auth/userAccess.service";

const PUBLIC_ROUTES = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/webhook/whatsapp",
  "/google/auth",
  "/google/callback",
]);

function getPathname(
  url: string
) {
  return url.split("?")[0] ?? url;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const pathname = getPathname(
    request.url
  );

  if (
    PUBLIC_ROUTES.has(pathname)
  ) {
    return;
  }

  const authHeader =
    request.headers.authorization;

  if (
    !authHeader?.startsWith(
      "Bearer "
    )
  ) {
    return reply.status(401).send({
      error: "Não autenticado",
    });
  }

  try {
    const token =
      authHeader.slice(7);

    const payload =
      verifyAccessToken(token);

    request.userId =
      payload.userId;

    request.userRole =
      payload.role;

    await assertUserIsActive(
      payload.userId
    );
  } catch (error) {

    if (
      error instanceof Error &&
      error.message ===
        "USER_INACTIVE"
    ) {
      return reply.status(403).send({
        error:
          "Sua conta está bloqueada. Fale com o administrador.",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "PENDING_APPROVAL"
    ) {
      return reply.status(403).send({
        error:
          "Seu cadastro aguarda aprovação do administrador.",
      });
    }

    return reply.status(401).send({
      error:
        "Token inválido ou expirado",
    });
  }
}
