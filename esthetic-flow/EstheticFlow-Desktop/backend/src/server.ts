import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";

import { env } from "./config/env";

import { webhookRoutes }
from "./routes/webhook.routes";

import { sendRoutes }
from "./routes/send.routes";

import { chatRoutes }
from "./routes/chat.routes";

import { aiRoutes }
from "./routes/ai.routes";

import { appointmentRoutes }
from "./routes/appointment.routes";

import { clientRoutes }
from "./routes/client.routes";

import { googleRoutes }
from "./routes/google.routes";

import { procedureRoutes }
from "./routes/procedure.routes";

import { quickReplyRoutes }
from "./routes/quickReply.routes";

import { dashboardRoutes }
from "./routes/dashboard.routes";

import { whatsappRoutes }
from "./routes/whatsapp.routes";

import { authRoutes }
from "./routes/auth.routes";

import { userRoutes }
from "./routes/user.routes";

import { authMiddleware }
from "./middleware/auth.middleware";

import { ensureDefaultAdmin }
from "./services/auth/auth.service";

import { ensureWhatsappInstance }
from "./services/whatsapp/whatsappSetup.service";

import { initializeSocket }
from "./sockets/socket";

/** 16 MB de arquivo + overhead base64 (~33%) em JSON */
const BODY_LIMIT_BYTES =
  Math.ceil(
    (16 * 1024 * 1024 * 4) / 3
  ) + 512 * 1024;

const app = Fastify({
  logger: true,
  bodyLimit: BODY_LIMIT_BYTES,
});

app.register(cors, {
  origin: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
});

app.addHook(
  "onRequest",
  authMiddleware
);

app.register(authRoutes);

app.register(userRoutes);

app.register(webhookRoutes);

app.register(sendRoutes);

app.register(chatRoutes);

app.register(aiRoutes);

app.register(appointmentRoutes);

app.register(clientRoutes);

app.register(googleRoutes);

app.register(procedureRoutes);

app.register(quickReplyRoutes);

app.register(dashboardRoutes);

app.register(whatsappRoutes);

app.get("/", async () => {
  return {
    status: "ok",
    message: "EstheticFlow API Running",
  };
});

const start = async () => {

  try {

    await ensureDefaultAdmin();

    await app.ready();

    initializeSocket(
      app.server
    );

    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    console.log(
      `HTTP Server Running on port ${env.port}`
    );

    ensureWhatsappInstance().catch(
      (error) => {
        console.warn(
          "Não foi possível sincronizar webhook da Evolution:",
          error
        );
      }
    );

  } catch (error) {

    console.error(error);

    app.log.error(error);

    process.exit(1);
  }
};

start();
