import { env } from "../../config/env";

import {
  getGoogleCalendarClient,
  isGoogleCalendarConnected,
} from "./googleClient";

type BusyInterval = {
  start: Date;
  end: Date;
};

export async function listGoogleCalendarBusyIntervals(
  from: Date,
  to: Date
): Promise<BusyInterval[]> {

  if (!isGoogleCalendarConnected()) {
    return [];
  }

  try {

    const calendar =
      await getGoogleCalendarClient();

    const response =
      await calendar.events.list({
        calendarId:
          env.googleCalendarId,

        timeMin:
          from.toISOString(),

        timeMax:
          to.toISOString(),

        singleEvents: true,

        orderBy: "startTime",
      });

    return (
      response.data.items ?? []
    )
      .map((event) => {

        const startRaw =
          event.start?.dateTime ||
          event.start?.date;

        const endRaw =
          event.end?.dateTime ||
          event.end?.date;

        if (!startRaw || !endRaw) {
          return null;
        }

        const start = new Date(
          startRaw
        );

        const end = new Date(
          endRaw
        );

        if (
          event.start?.date &&
          !event.start?.dateTime
        ) {
          end.setHours(
            23,
            59,
            59,
            999
          );
        }

        return {
          start,
          end,
        };
      })
      .filter(
        (
          interval
        ): interval is BusyInterval =>
          interval !== null
      );

  } catch (error) {

    console.error(
      "[Google Calendar] Erro ao listar eventos:",
      error
    );

    return [];
  }
}
