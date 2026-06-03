import { prisma } from "../../lib/prisma";

import { env } from "../../config/env";

import {
  listGoogleCalendarBusyIntervals,
} from "../google/listCalendarBusyIntervals";

const TIMEZONE =
  "America/Sao_Paulo";

const BLOCKED_STATUSES = [
  "cancelled",
  "no_show",
];

type BusyInterval = {
  start: Date;
  end: Date;
};

type AvailableSlot = {
  iso: string;
  label: string;
};

type ListSlotsInput = {
  fromDate?: string;
  days?: number;
  durationMin?: number;
};

function parseFromDate(
  input?: string
): Date {

  if (!input) {
    return new Date();
  }

  const trimmed =
    input.trim();

  const isoDateOnly =
    trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (isoDateOnly) {
    const year = Number(
      isoDateOnly[1]
    );

    const month = Number(
      isoDateOnly[2]
    );

    const day = Number(
      isoDateOnly[3]
    );

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        3,
        0,
        0,
        0
      )
    );
  }

  const brDate =
    trimmed.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (brDate) {
    const day = Number(brDate[1]);
    const month = Number(brDate[2]);
    const year = Number(brDate[3]);

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        3,
        0,
        0,
        0
      )
    );
  }

  const parsed = new Date(trimmed);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return new Date();
  }

  return parsed;
}

function groupSlotsByDayLabel(
  slots: AvailableSlot[]
) {

  const grouped: Record<
    string,
    string[]
  > = {};

  for (const slot of slots) {
    const dayLabel =
      slot.label
        .split(",")
        .slice(0, 2)
        .join(",")
        .trim();

    if (!grouped[dayLabel]) {
      grouped[dayLabel] = [];
    }

    grouped[dayLabel].push(
      slot.label
    );
  }

  return grouped;
}

function getClinicHours() {

  return {
    openHour:
      env.clinicOpenHour,

    closeHour:
      env.clinicCloseHour,

    slotIntervalMin:
      env.clinicSlotIntervalMin,
  };
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  busy: BusyInterval
) {

  return (
    slotStart < busy.end &&
    slotEnd > busy.start
  );
}

function isSlotFree(
  slotStart: Date,
  slotEnd: Date,
  busyIntervals: BusyInterval[]
) {

  return !busyIntervals.some(
    (busy) =>
      overlaps(
        slotStart,
        slotEnd,
        busy
      )
  );
}

function startOfDayInTimezone(
  date: Date
) {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(date);

  const year = Number(
    parts.find(
      (part) =>
        part.type === "year"
    )?.value
  );

  const month = Number(
    parts.find(
      (part) =>
        part.type === "month"
    )?.value
  );

  const day = Number(
    parts.find(
      (part) =>
        part.type === "day"
    )?.value
  );

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      3,
      0,
      0,
      0
    )
  );
}

function addDays(
  date: Date,
  days: number
) {

  const result = new Date(date);

  result.setUTCDate(
    result.getUTCDate() + days
  );

  return result;
}

function makeSlotDate(
  dayStart: Date,
  hour: number,
  minute: number
) {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(dayStart);

  const year = Number(
    parts.find(
      (part) =>
        part.type === "year"
    )?.value
  );

  const month = Number(
    parts.find(
      (part) =>
        part.type === "month"
    )?.value
  );

  const day = Number(
    parts.find(
      (part) =>
        part.type === "day"
    )?.value
  );

  const utcGuess = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour + 3,
      minute,
      0,
      0
    )
  );

  return utcGuess;
}

function formatSlotLabel(
  date: Date
) {

  return date.toLocaleString(
    "pt-BR",
    {
      timeZone: TIMEZONE,
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

async function getBusyIntervals(
  from: Date,
  to: Date
): Promise<BusyInterval[]> {

  const bufferStart = new Date(
    from.getTime() -
      8 * 60 * 60 * 1000
  );

  const appointments =
    await prisma.appointment.findMany({
      where: {
        status: {
          notIn: BLOCKED_STATUSES,
        },

        date: {
          gte: bufferStart,
          lte: to,
        },
      },

      select: {
        date: true,
        durationMin: true,
      },
    });

  const dbBusy =
    appointments.map(
      (appointment) => ({
        start: appointment.date,

        end: new Date(
          appointment.date.getTime() +
            appointment.durationMin *
              60 *
              1000
        ),
      })
    );

  const googleBusy =
    await listGoogleCalendarBusyIntervals(
      from,
      to
    );

  return [
    ...dbBusy,
    ...googleBusy,
  ];
}

export async function listAvailableSlots(
  input: ListSlotsInput = {}
): Promise<AvailableSlot[]> {

  const {
    openHour,
    closeHour,
    slotIntervalMin,
  } = getClinicHours();

  const days =
    input.days ?? 7;

  const durationMin =
    input.durationMin ?? 60;

  const fromDate = parseFromDate(
    input.fromDate
  );

  const rangeStart =
    startOfDayInTimezone(fromDate);

  const rangeEnd = addDays(
    rangeStart,
    days
  );

  const busyIntervals =
    await getBusyIntervals(
      rangeStart,
      rangeEnd
    );

  const slots: AvailableSlot[] =
    [];

  const now = new Date();

  for (
    let dayIndex = 0;
    dayIndex < days;
    dayIndex++
  ) {

    const dayStart = addDays(
      rangeStart,
      dayIndex
    );

    for (
      let hour = openHour;
      hour < closeHour;
      hour++
    ) {

      for (
        let minute = 0;
        minute < 60;
        minute += slotIntervalMin
      ) {

        const slotStart =
          makeSlotDate(
            dayStart,
            hour,
            minute
          );

        const slotEnd = new Date(
          slotStart.getTime() +
            durationMin *
              60 *
              1000
        );

        const closingTime =
          makeSlotDate(
            dayStart,
            closeHour,
            0
          );

        if (
          slotEnd > closingTime ||
          slotStart < now
        ) {
          continue;
        }

        if (
          isSlotFree(
            slotStart,
            slotEnd,
            busyIntervals
          )
        ) {
          slots.push({
            iso: slotStart.toISOString(),
            label: formatSlotLabel(
              slotStart
            ),
          });
        }
      }
    }
  }

  return slots.slice(0, 40);
}

export function formatSlotsForAi(
  slots: AvailableSlot[]
) {

  if (!slots.length) {
    return {
      total: 0,
      slots: [],
      byDay: {},
      message:
        "Nenhum horário livre no período consultado.",
    };
  }

  const byDay =
    groupSlotsByDayLabel(slots);

  return {
    total: slots.length,

    slots: slots.map((slot) => ({
      iso: slot.iso,
      label: slot.label,
    })),

    byDay,

    message:
      "Horários livres confirmados na agenda.",
  };
}

export async function listAvailableSlotsDetailed(
  input: ListSlotsInput = {}
) {

  const slots =
    await listAvailableSlots(input);

  return formatSlotsForAi(slots);
}

export function getCurrentDateInClinicTimezone() {

  return new Date().toLocaleString(
    "pt-BR",
    {
      timeZone: TIMEZONE,
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export async function getAvailabilitySummary(
  days = 7
) {

  const slots =
    await listAvailableSlots({
      days,
      durationMin: 60,
    });

  if (!slots.length) {
    return "Nenhum horário livre nos próximos dias.";
  }

  return slots
    .map(
      (slot) =>
        `- ${slot.label}`
    )
    .join("\n");
}
