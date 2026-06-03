import { FastifyInstance } from "fastify";

import {
  deleteConversationByJid,
  deleteMessageFromWebhook,
  extractJidsFromDeleteEvent,
} from "../services/chat/conversation.service";

import {
  handleInboundWhatsappMessage,
} from "../services/chat/inboundMessage.service";

import {
  handleWhatsappAccountConnected,
} from "../services/whatsapp/whatsappConnection.service";

import {
  invalidateWhatsappProfileCache,
  noteWhatsappProfileFromWebhook,
  scheduleWhatsappProfileRefresh,
} from "../services/whatsapp/whatsappProfile.service";

import * as socketModule
from "../sockets/socket";

export async function webhookRoutes(
  app: FastifyInstance
) {

  app.post(
    "/webhook/whatsapp",

    async (
      request,
      reply
    ) => {

      const body: any =
        request.body;

      console.log(
        "Webhook WhatsApp:",
        JSON.stringify(
          body,
          null,
          2
        )
      );

      const event = String(
        body.event || ""
      ).toLowerCase();

      if (
        event === "connection.update"
      ) {

        noteWhatsappProfileFromWebhook(
          body.data as
            | Record<string, unknown>
            | undefined
        );

        invalidateWhatsappProfileCache();

        const state = String(
          body.data?.state ||
            body.data?.connection ||
            ""
        ).toLowerCase();

        const connected =
          state === "open";

        if (connected) {
          scheduleWhatsappProfileRefresh();

          await handleWhatsappAccountConnected(
            body.data as
              | Record<string, unknown>
              | undefined
          );
        } else if (
          state === "close" ||
          state === "closed" ||
          state === "logout" ||
          state === "disconnected"
        ) {
          const {
            markWhatsappExpectAccountReset,
            clearStoredWhatsappOwnerJid,
          } =
            await import(
              "../services/whatsapp/whatsappConnection.service"
            );

          await markWhatsappExpectAccountReset();
          await clearStoredWhatsappOwnerJid();
          invalidateWhatsappProfileCache();
        }

        socketModule.io?.emit(
          "whatsapp-status",
          {
            connected,
            state,
          }
        );

        return reply
          .status(200)
          .send({
            success: true,
            connected,
          });
      }

      if (
        event === "chats.delete"
      ) {

        const jids =
          extractJidsFromDeleteEvent(
            body
          );

        for (const jid of jids) {
          await deleteConversationByJid(
            jid
          );
        }

        return reply
          .status(200)
          .send({
            success: true,
            deleted: jids.length,
          });
      }

      if (
        event === "messages.delete" ||
        (
          event ===
            "messages.update" &&
          body.data?.status ===
            "DELETED"
        )
      ) {

        await deleteMessageFromWebhook(
          body
        );

        return reply
          .status(200)
          .send({
            success: true,
          });
      }

      if (
        event !== "messages.upsert"
      ) {

        return reply
          .status(200)
          .send({
            ignored: true,
          });
      }

      try {
        const result =
          await handleInboundWhatsappMessage(
            body
          );

        return reply
          .status(200)
          .send(result);
      } catch (error) {
        console.error(
          "Webhook messages.upsert:",
          error
        );

        return reply
          .status(200)
          .send({
            success: false,
          });
      }
    }
  );
}
