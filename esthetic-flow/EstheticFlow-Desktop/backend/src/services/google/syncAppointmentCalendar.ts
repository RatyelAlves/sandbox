import type { calendar_v3 } from "googleapis";

import { env } from "../../config/env";

import {
  getGoogleCalendarClient,
  isGoogleCalendarConnected,
} from "./googleClient";

type AppointmentForSync = {
  id: string;
  procedure: string;
  date: Date;
  durationMin: number;
  status: string;
  notes: string | null;
  googleEventId: string | null;
  client: {
    name: string;
    phone: string;
    email: string | null;
  };
};

const TIMEZONE =
  "America/Sao_Paulo";

function buildDescription(
  appointment: AppointmentForSync
) {

  const lines = [
    `Cliente: ${appointment.client.name}`,
    `Telefone: ${appointment.client.phone}`,
  ];

  if (appointment.client.email) {
    lines.push(
      `E-mail: ${appointment.client.email}`
    );
  }

  lines.push(
    `Status: ${appointment.status}`
  );

  if (appointment.notes) {
    lines.push(
      `Observações: ${appointment.notes}`
    );
  }

  lines.push(
    `EstheticFlow ID: ${appointment.id}`
  );

  return lines.join("\n");
}

function buildSummary(
  appointment: AppointmentForSync
) {

  const prefix =
    appointment.status === "cancelled"
      ? "[Cancelado] "
      : "";

  return `${prefix}${appointment.procedure} — ${appointment.client.name}`;
}

function buildEventTimes(
  appointment: AppointmentForSync
) {

  const start = new Date(
    appointment.date
  );

  const end = new Date(
    start.getTime() +
      appointment.durationMin *
        60 *
        1000
  );

  return {
    start,
    end,
  };
}

function buildEventBody(
  appointment: AppointmentForSync
): calendar_v3.Schema$Event {

  const { start, end } =
    buildEventTimes(appointment);

  return {
    summary: buildSummary(
      appointment
    ),

    description: buildDescription(
      appointment
    ),

    start: {
      dateTime:
        start.toISOString(),
      timeZone: TIMEZONE,
    },

    end: {
      dateTime:
        end.toISOString(),
      timeZone: TIMEZONE,
    },
  };
}

export async function createGoogleCalendarEvent(
  appointment: AppointmentForSync
) {

  if (
    !isGoogleCalendarConnected() ||
    appointment.status ===
      "cancelled"
  ) {
    return null;
  }

  const calendar =
    await getGoogleCalendarClient();

  const response =
    await calendar.events.insert({
      calendarId:
        env.googleCalendarId,

      requestBody:
        buildEventBody(
          appointment
        ),
    });

  return (
    response.data.id ?? null
  );
}

export async function updateGoogleCalendarEvent(
  appointment: AppointmentForSync
) {

  if (
    !isGoogleCalendarConnected() ||
    !appointment.googleEventId
  ) {
    return null;
  }

  const calendar =
    await getGoogleCalendarClient();

  if (
    appointment.status ===
    "cancelled"
  ) {

    await calendar.events.delete({
      calendarId:
        env.googleCalendarId,
      eventId:
        appointment.googleEventId,
    });

    return null;
  }

  const response =
    await calendar.events.update({
      calendarId:
        env.googleCalendarId,

      eventId:
        appointment.googleEventId,

      requestBody:
        buildEventBody(
          appointment
        ),
    });

  return (
    response.data.id ?? null
  );
}

export async function deleteGoogleCalendarEvent(
  googleEventId: string | null
) {

  if (
    !isGoogleCalendarConnected() ||
    !googleEventId
  ) {
    return;
  }

  const calendar =
    await getGoogleCalendarClient();

  await calendar.events.delete({
    calendarId:
      env.googleCalendarId,
    eventId: googleEventId,
  });
}
