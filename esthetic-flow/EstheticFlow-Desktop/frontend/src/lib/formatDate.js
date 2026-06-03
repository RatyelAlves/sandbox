export function formatAppointmentDate(
  dateString
) {

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

export function formatAppointmentDateTime(
  dateString
) {

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export function formatWeekdayShort(
  dateString
) {

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "pt-BR",
    {
      weekday: "short",
    }
  );
}

export function formatDayMonth(
  dateString
) {

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

export function startOfWeek(
  date = new Date()
) {

  const result = new Date(date);

  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + diff
  );

  result.setHours(0, 0, 0, 0);

  return result;
}

export function endOfWeek(
  weekStart
) {

  const result = new Date(weekStart);

  result.setDate(
    result.getDate() + 6
  );

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
}

export function addWeeks(
  date,
  weeks
) {

  const result = new Date(date);

  result.setDate(
    result.getDate() + weeks * 7
  );

  return result;
}

export function getWeekDays(
  weekStart
) {

  return Array.from(
    { length: 7 },

    (_, index) => {

      const day = new Date(weekStart);

      day.setDate(
        day.getDate() + index
      );

      return day;
    }
  );
}

export function isSameDay(
  left,
  right
) {

  const a = new Date(left);
  const b = new Date(right);

  return (
    a.getFullYear() ===
      b.getFullYear() &&
    a.getMonth() ===
      b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDatetimeLocalValue(
  dateString
) {

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value) =>
    String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") +
    "T" +
    [
      pad(date.getHours()),
      pad(date.getMinutes()),
    ].join(":");
}

export function datetimeLocalToIso(
  value
) {

  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

export function toIsoRange(
  weekStart
) {

  return {
    from: weekStart.toISOString(),
    to: endOfWeek(weekStart).toISOString(),
  };
}
