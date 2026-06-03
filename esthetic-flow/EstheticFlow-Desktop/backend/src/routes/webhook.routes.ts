import { FastifyInstance } from "fastify";

import {
  deleteConversationByJid,
  deleteMessageFromWebhook,
  extractJidsFromDeleteEvent,
} from "../services/chat/conversation.service";

import {
  handleInboundWhatsappMessage,
} from "../services/chat/inboundMessage.service";

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
