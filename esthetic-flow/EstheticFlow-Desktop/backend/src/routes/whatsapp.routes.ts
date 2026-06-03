import { FastifyInstance } from "fastify";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

import {
  getWhatsappProfile,
} from "../services/whatsapp/whatsappProfile.service";

import {
  disconnectWhatsapp,
  ensureWhatsappInstance,
  getWhatsappQrCode,
  getWhatsappSetupStatus,
} from "../services/whatsapp/whatsappSetup.service";

export async function whatsappRoutes(
  app: FastifyInstance
) {

  app.get("/whatsapp/profile", async (
    _request,
    reply
  ) => {

    const profile =
      await getWhatsappProfile();

    return reply.send(profile);
  });

  app.get("/whatsapp/status", async (
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

    const status =
      await getWhatsappSetupStatus();

    return reply.send(status);
  });

  app.post("/whatsapp/setup", async (
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

    const profile =
      await ensureWhatsappInstance();

    return reply.send(profile);
  });

  app.get("/whatsapp/qrcode", async (
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

    const qr =
      await getWhatsappQrCode();

    return reply.send(qr);
  });

  app.post("/whatsapp/disconnect", async (
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
      await disconnectWhatsapp();

    return reply.send(result);
  });
}
