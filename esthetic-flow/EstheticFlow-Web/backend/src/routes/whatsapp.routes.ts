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

import {
  isHistorySyncRunning,
  syncWhatsappHistory,
} from "../services/whatsapp/syncWhatsappHistory";

import {
  resetWhatsappConversationsForCurrentAccount,
  isHistoryImportBlocked,
  unblockHistoryImport,
} from "../services/whatsapp/whatsappConnection.service";

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

  app.post("/whatsapp/sync-history", async (
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

    const query =
      request.query as
        | {
            wait?: string;
            force?: string;
          }
        | undefined;

    const wait = query?.wait === "true";
    const force = query?.force === "true";

    if (
      !force &&
      (await isHistoryImportBlocked())
    ) {
      return reply.send({
        running: false,
        skipped: true,
        reason:
          "Importação de histórico bloqueada após troca de conta. Use sincronizar manualmente.",
      });
    }

    if (force) {
      await unblockHistoryImport();
    }

    if (wait) {
      const progress =
        await syncWhatsappHistory();

      return reply.send({
        running: false,
        progress,
      });
    }

    const alreadyRunning =
      isHistorySyncRunning();

    syncWhatsappHistory().catch(
      (error) => {
        console.error(
          "Sync histórico falhou:",
          error
        );
      }
    );

    return reply.send({
      running: true,
      alreadyRunning,
    });
  });

  app.post("/whatsapp/reset-account", async (
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
      await resetWhatsappConversationsForCurrentAccount();

    return reply.send({
      success: true,
      ...result,
    });
  });
}
