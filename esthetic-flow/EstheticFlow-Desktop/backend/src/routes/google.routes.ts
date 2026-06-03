import { FastifyInstance } from "fastify";

import { env } from "../config/env";

import {
  getGoogleAuthUrl,
  getGoogleCalendarStatus,
  isGoogleCalendarConfigured,
  saveGoogleTokensFromCode,
} from "../services/google/googleClient";

export async function googleRoutes(
  app: FastifyInstance
) {

  app.get("/google/status", async () => {
    return getGoogleCalendarStatus();
  });

  app.get("/google/auth", async (
    _request,
    reply
  ) => {

    if (!isGoogleCalendarConfigured()) {
      return reply
        .status(503)
        .send({
          error:
            "Google Calendar não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env",
        });
    }

    const url = getGoogleAuthUrl();

    return reply.redirect(url);
  });

  app.get("/google/callback", async (
    request,
    reply
  ) => {

    const code =
      typeof request.query ===
        "object" &&
      request.query !== null &&
      "code" in request.query
        ? String(
            (
              request.query as {
                code?: string;
              }
            ).code ?? ""
          )
        : "";

    if (!code) {
      return reply
        .status(400)
        .send({
          error:
            "Código OAuth ausente",
        });
    }

    try {

      await saveGoogleTokensFromCode(
        code
      );

      return reply.redirect(
        `${env.frontendUrl}/appointments?google=connected`
      );

    } catch (error) {

      console.error(
        "Erro OAuth Google:",
        error
      );

      return reply.redirect(
        `${env.frontendUrl}/appointments?google=error`
      );
    }
  });
}
