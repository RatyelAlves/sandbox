import {
  FastifyReply,
  FastifyRequest,
} from "fastify";

export function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {

  if (request.userRole !== "admin") {
    reply.status(403).send({
      error:
        "Acesso restrito a administradores",
    });

    return false;
  }

  return true;
}
