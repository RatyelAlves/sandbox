import { formatMessageTime }
from "@/lib/formatTime";

import {
  formatDayMonth,
  formatWeekdayShort,
  getWeekDays,
  isSameDay,
} from "@/lib/formatDate";

import {
  STATUS_DOT_STYLES,
} from "@/lib/appointmentStatus";

export function WeekCalendar({
  weekStart,
  appointments,
  onSelect,
}) {

  const days = getWeekDays(weekStart);

  return (
    <div className="
      border-b
      border-zinc-200
      px-4
      py-4
      sm:px-6
    ">

      <div className="
        grid
        grid-cols-1
        gap-3
        md:grid-cols-7
      ">

        {days.map((day) => {

          const dayAppointments =
            appointments.filter(
              (appointment) =>
                isSameDay(
                  appointment.date,
                  day
                )
            );

          const isToday =
            isSameDay(
              day,
              new Date()
            );

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-40
                rounded-2xl
                border
                p-3
                ${
                  isToday
                    ? "border-rose-200 bg-rose-50/40"
                    : "border-zinc-200 bg-zinc-50/50"
                }
              `}
            >

              <div className="
                mb-3
                border-b
                border-zinc-200/80
                pb-2
              ">

                <p className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-zinc-500
                ">
                  {formatWeekdayShort(day)}
                </p>

                <p className="
                  text-sm
                  font-semibold
                  text-zinc-800
                ">
                  {formatDayMonth(day)}
                </p>

              </div>

              <div className="
                space-y-2
              ">

                {dayAppointments.length ===
                  0 && (
                  <p className="
                    text-xs
                    text-zinc-400
                  ">
                    Sem agendamentos
                  </p>
                )}

                {dayAppointments.map(
                  (appointment) => (
                    <button
                      key={
                        appointment.id
                      }
                      type="button"
                      onClick={() =>
                        onSelect?.(
                          appointment
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white
                        bg-white
                        p-2.5
                        text-left
                        shadow-sm
                        transition
                        hover:border-rose-200
                        hover:shadow
                      "
                    >

                      <div className="
                        flex
                        items-center
                        gap-2
                      ">

                        <span
                          className={`
                            h-2
                            w-2
                            rounded-full
                            ${
                              STATUS_DOT_STYLES[
                                appointment.status
                              ] ??
                              STATUS_DOT_STYLES.scheduled
                            }
                          `}
                        />

                        <span className="
                          text-xs
                          font-medium
                          text-zinc-700
                        ">
                          {formatMessageTime(
                            appointment.date
                          )}
                        </span>

                      </div>

                      <p className="
                        mt-1
                        truncate
                        text-xs
                        font-semibold
                        text-zinc-800
                      ">
                        {
                          appointment
                            .client
                            ?.name
                        }
                      </p>

                      <p className="
                        truncate
                        text-xs
                        text-zinc-500
                      ">
                        {
                          appointment.procedure
                        }
                      </p>

                    </button>
                  )
                )}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
