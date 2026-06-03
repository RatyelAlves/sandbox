import { FastifyInstance } from "fastify";

import { listClients } from "../services/appointment/appointment.service";

export async function clientRoutes(
  app: FastifyInstance
) {

  app.get("/clients", async () => {
    return listClients();
  });
}
