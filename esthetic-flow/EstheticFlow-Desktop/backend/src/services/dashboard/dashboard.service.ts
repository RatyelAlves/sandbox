import { prisma } from "../../lib/prisma";

import {
  findProcedureByName,
} from "../procedure/procedure.service";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function startOfNextMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1
  );
}

function formatPriceBrl(
  value: number
) {
  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export async function getDashboardStats() {

  const now = new Date();
  const todayStart =
    startOfDay(now);
  const tomorrowStart =
    new Date(todayStart);

  tomorrowStart.setDate(
    tomorrowStart.getDate() + 1
  );

  const monthStart =
    startOfMonth(now);
  const nextMonthStart =
    startOfNextMonth(now);

  const activeStatuses = [
    "scheduled",
    "confirmed",
    "completed",
  ];

  const [
    appointmentsToday,
    clientsCount,
    proceduresCount,
    upcomingAppointments,
    monthCompleted,
    monthCancelled,
    completedThisMonth,
    procedureGroups,
    catalogProcedures,
    pendingApprovals,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
        status: {
          in: [
            "scheduled",
            "confirmed",
          ],
        },
      },
    }),

    prisma.client.count(),

    prisma.procedure.count({
      where: {
        active: true,
      },
    }),

    prisma.appointment.findMany({
      where: {
        date: {
          gte: now,
        },
        status: {
          in: [
            "scheduled",
            "confirmed",
          ],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 8,
    }),

    prisma.appointment.count({
      where: {
        date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        status: "completed",
      },
    }),

    prisma.appointment.count({
      where: {
        date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        status: "cancelled",
      },
    }),

    prisma.appointment.findMany({
      where: {
        date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        status: "completed",
      },
      select: {
        procedure: true,
      },
    }),

    prisma.appointment.groupBy({
      by: ["procedure"],
      _count: {
        procedure: true,
      },
      where: {
        status: {
          in: activeStatuses,
        },
      },
      orderBy: {
        _count: {
          procedure: "desc",
        },
      },
      take: 8,
    }),

    prisma.procedure.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      take: 8,
    }),

    prisma.user.count({
      where: {
        approved: false,
      },
    }),
  ]);

  let monthlyRevenue = 0;

  for (const appointment of
    completedThisMonth) {

    const procedure =
      await findProcedureByName(
        appointment.procedure
      );

    monthlyRevenue +=
      procedure?.price ?? 0;
  }

  const countByProcedure =
    new Map(
      procedureGroups.map(
        (item) => [
          item.procedure,
          item._count.procedure,
        ]
      )
    );

  const popularNames =
    new Set<string>();

  const popularProcedures =
    procedureGroups
      .slice(0, 4)
      .map((item) => {
        popularNames.add(
          item.procedure
        );

        return {
          name: item.procedure,
          count:
            item._count.procedure,
        };
      });

  for (const procedure of
    catalogProcedures) {

    if (
      popularProcedures.length >= 4
    ) {
      break;
    }

    if (
      popularNames.has(
        procedure.name
      )
    ) {
      continue;
    }

    popularProcedures.push({
      name: procedure.name,
      count:
        countByProcedure.get(
          procedure.name
        ) ?? 0,
    });
  }

  return {
    appointmentsToday,
    clientsCount,
    proceduresCount,
    monthlyRevenue,
    monthlyRevenueFormatted:
      formatPriceBrl(
        monthlyRevenue
      ),
    upcomingAppointments:
      upcomingAppointments.map(
        (item) => ({
          id: item.id,
          procedure:
            item.procedure,
          date: item.date.toISOString(),
          durationMin:
            item.durationMin,
          status: item.status,
          client: item.client,
        })
      ),
    monthSummary: {
      completed: monthCompleted,
      cancelled: monthCancelled,
    },
    popularProcedures,
    pendingApprovals,
  };
}
