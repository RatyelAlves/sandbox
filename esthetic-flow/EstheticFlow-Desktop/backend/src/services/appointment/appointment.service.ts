import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "../google/syncAppointmentCalendar";

import {
  isGoogleCalendarConnected,
} from "../google/googleClient";

import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from "./appointment.schema";

import type { z } from "zod";

const clientSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
} satisfies Prisma.ClientSelect;

const appointmentInclude = {
  client: {
    select: clientSelect,
  },
} satisfies Prisma.AppointmentInclude;

type CreateInput =
  z.infer<typeof createAppointmentSchema>;

type UpdateInput =
  z.infer<typeof updateAppointmentSchema>;

type ListQuery =
  z.infer<typeof listAppointmentsQuerySchema>;

type AppointmentWithClient =
  Prisma.AppointmentGetPayload<{
    include: typeof appointmentInclude;
  }>;

async function ensureClientExists(
  clientId: string
) {

  const client =
    await prisma.client.findUnique({
      where: {
        id: clientId,
      },

      select: {
        id: true,
      },
    });

  if (!client) {
    throw new Error(
      "CLIENT_NOT_FOUND"
    );
  }
}

function logGoogleSyncError(
  action: string,
  error: unknown
) {

  console.error(
    `[Google Calendar] Falha ao ${action}:`,
    error
  );
}

async function syncCreatedAppointment(
  appointment: AppointmentWithClient
) {

  try {

    const googleEventId =
      await createGoogleCalendarEvent(
        appointment
      );

    if (!googleEventId) {
      console.warn(
        "[Google Calendar] Evento não criado para appointment",
        appointment.id,
        "— Google conectado?",
        isGoogleCalendarConnected()
      );
      return appointment;
    }

    console.log(
      "[Google Calendar] Evento criado:",
      googleEventId,
      "appointment:",
      appointment.id
    );

    return prisma.appointment.update({
      where: {
        id: appointment.id,
      },

      data: {
        googleEventId,
      },

      include: appointmentInclude,
    });

  } catch (error) {

    logGoogleSyncError(
      "criar evento",
      error
    );

    return appointment;
  }
}

async function syncUpdatedAppointment(
  appointment: AppointmentWithClient
) {

  try {

    const googleEventId =
      await updateGoogleCalendarEvent(
        appointment
      );

    if (
      googleEventId ===
      appointment.googleEventId
    ) {
      return appointment;
    }

    return prisma.appointment.update({
      where: {
        id: appointment.id,
      },

      data: {
        googleEventId,
      },

      include: appointmentInclude,
    });

  } catch (error) {

    logGoogleSyncError(
      "atualizar evento",
      error
    );

    return appointment;
  }
}

async function syncDeletedAppointment(
  googleEventId: string | null
) {

  try {

    await deleteGoogleCalendarEvent(
      googleEventId
    );

  } catch (error) {

    logGoogleSyncError(
      "excluir evento",
      error
    );
  }
}

export async function listAppointments(
  query: ListQuery
) {

  const where: Prisma.AppointmentWhereInput =
    {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.clientId) {
    where.clientId = query.clientId;
  }

  if (query.from || query.to) {
    where.date = {};

    if (query.from) {
      where.date.gte = new Date(
        query.from
      );
    }

    if (query.to) {
      where.date.lte = new Date(
        query.to
      );
    }
  }

  if (query.search) {
    where.client = {
      OR: [
        {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },

        {
          phone: {
            contains: query.search,
          },
        },
      ],
    };
  }

  return prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: {
      date: "asc",
    },
  });
}

export async function getAppointment(
  id: string
) {

  const appointment =
    await prisma.appointment.findUnique({
      where: {
        id,
      },

      include: appointmentInclude,
    });

  if (!appointment) {
    throw new Error(
      "APPOINTMENT_NOT_FOUND"
    );
  }

  return appointment;
}

export async function createAppointment(
  input: CreateInput
) {

  await ensureClientExists(
    input.clientId
  );

  const appointment =
    await prisma.appointment.create({
      data: {
        clientId: input.clientId,
        procedure: input.procedure,
        date: new Date(input.date),
        durationMin: input.durationMin,
        status: input.status,
        notes: input.notes,
      },

      include: appointmentInclude,
    });

  return syncCreatedAppointment(
    appointment
  );
}

export async function updateAppointment(
  id: string,
  input: UpdateInput
) {

  await getAppointment(id);

  if (input.clientId) {
    await ensureClientExists(
      input.clientId
    );
  }

  const appointment =
    await prisma.appointment.update({
      where: {
        id,
      },

      data: {
        clientId: input.clientId,
        procedure: input.procedure,
        date: input.date
          ? new Date(input.date)
          : undefined,
        durationMin: input.durationMin,
        status: input.status,
        notes: input.notes,
      },

      include: appointmentInclude,
    });

  return syncUpdatedAppointment(
    appointment
  );
}

export async function deleteAppointment(
  id: string
) {

  const appointment =
    await getAppointment(id);

  const googleEventId =
    appointment.googleEventId;

  await prisma.appointment.delete({
    where: {
      id,
    },
  });

  syncDeletedAppointment(
    googleEventId
  ).catch((error) => {
    logGoogleSyncError(
      "excluir evento após delete",
      error
    );
  });

  return {
    success: true,
  };
}

export async function listClients() {

  return prisma.client.findMany({
    select: clientSelect,
    orderBy: {
      name: "asc",
    },
  });
}
