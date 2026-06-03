import { FastifyInstance } from "fastify";

import {
  getDashboardStats,
} from "../services/dashboard/dashboard.service";

export async function dashboardRoutes(
  app: FastifyInstance
) {

  app.get("/dashboard", async (
    request,
    reply
  ) => {

    const stats =
      await getDashboardStats();

    if (
      request.userRole !== "admin"
    ) {
      const {
        monthlyRevenue: _revenue,
        monthlyRevenueFormatted: _formatted,
        pendingApprovals: _pending,
        ...staffStats
      } = stats;

      return reply.send(staffStats);
    }

    return reply.send(stats);
  });
}
