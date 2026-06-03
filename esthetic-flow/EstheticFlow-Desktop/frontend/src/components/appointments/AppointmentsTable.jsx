import {
  CalendarSync,
  Pencil,
  Trash2,
} from "lucide-react";

import { AppointmentStatusBadge }
from "@/components/appointments/AppointmentStatusBadge";

import {
  formatAppointmentDateTime,
} from "@/lib/formatDate";

export function AppointmentsTable({
  appointments,
  loading,
  onEdit,
  onDelete,
}) {

  if (loading) {
    return (
      <div className="
        flex
        items-center
        justify-center
        py-16
        text-sm
        text-zinc-500
      ">
        Carregando agendamentos...
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="
        flex
        flex-col
        items-center
        justify-center
        gap-2
        py-16
        text-center
      ">

        <p className="
          text-sm
          font-medium
          text-zinc-700
        ">
          Nenhum agendamento
          encontrado
        </p>

        <p className="
          text-sm
          text-zinc-500
        ">
          Ajuste os filtros ou crie
          um novo agendamento
        </p>

      </div>
    );
  }

  return (
    <div className="
      overflow-x-auto
    ">

      <table className="
        min-w-full
        text-left
        text-sm
      ">

        <thead className="
          border-b
          border-zinc-200
          bg-zinc-50
          text-xs
          uppercase
          tracking-wide
          text-zinc-500
        ">

          <tr>

            <th className="
              px-4
              py-3
              font-medium
              sm:px-6
            ">
              Cliente
            </th>

            <th className="
              px-4
              py-3
              font-medium
              sm:px-6
            ">
              Procedimento
            </th>

            <th className="
              px-4
              py-3
              font-medium
              sm:px-6
            ">
              Data
            </th>

            <th className="
              px-4
              py-3
              font-medium
              sm:px-6
            ">
              Duração
            </th>

            <th className="
              px-4
              py-3
              font-medium
              sm:px-6
            ">
              Status
            </th>

            <th className="
              px-4
              py-3
              font-medium
              sm:px-6
            ">
              Ações
            </th>

          </tr>

        </thead>

        <tbody>

          {appointments.map(
            (appointment) => (
              <tr
                key={appointment.id}
                className="
                  border-b
                  border-zinc-100
                  transition
                  hover:bg-rose-50/40
                "
              >

                <td className="
                  px-4
                  py-4
                  sm:px-6
                ">

                  <div className="
                    font-medium
                    text-zinc-800
                  ">
                    {
                      appointment
                        .client
                        ?.name
                    }
                  </div>

                  <div className="
                    text-xs
                    text-zinc-500
                  ">
                    {
                      appointment
                        .client
                        ?.phone
                    }
                  </div>

                </td>

                <td className="
                  px-4
                  py-4
                  text-zinc-700
                  sm:px-6
                ">
                  {
                    appointment.procedure
                  }
                </td>

                <td className="
                  px-4
                  py-4
                  text-zinc-700
                  sm:px-6
                ">
                  {formatAppointmentDateTime(
                    appointment.date
                  )}

                  {appointment.googleEventId && (
                    <span
                      className="
                        ml-2
                        inline-flex
                        items-center
                        gap-1
                        text-xs
                        text-emerald-600
                      "
                      title="Sincronizado com Google Calendar"
                    >

                      <CalendarSync
                        size={12}
                      />

                      Google

                    </span>
                  )}

                </td>

                <td className="
                  px-4
                  py-4
                  text-zinc-700
                  sm:px-6
                ">
                  {
                    appointment.durationMin
                  }{" "}
                  min
                </td>

                <td className="
                  px-4
                  py-4
                  sm:px-6
                ">
                  <AppointmentStatusBadge
                    status={
                      appointment.status
                    }
                  />
                </td>

                <td className="
                  px-4
                  py-4
                  sm:px-6
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          appointment
                        )
                      }
                      className="
                        rounded-lg
                        border
                        border-zinc-200
                        p-2
                        text-zinc-600
                        transition
                        hover:border-rose-200
                        hover:bg-rose-50
                        hover:text-rose-600
                      "
                      aria-label="Editar agendamento"
                    >
                      <Pencil
                        size={16}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          appointment
                        )
                      }
                      className="
                        rounded-lg
                        border
                        border-zinc-200
                        p-2
                        text-zinc-600
                        transition
                        hover:border-red-200
                        hover:bg-red-50
                        hover:text-red-600
                      "
                      aria-label="Excluir agendamento"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>

                  </div>

                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}
