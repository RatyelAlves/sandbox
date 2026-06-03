import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";

import {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
} from "@/lib/appointmentStatus";

import {
  formatDayMonth,
} from "@/lib/formatDate";

export function AppointmentsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  weekStart,
  onWeekChange,
  onCreate,
}) {

  const weekEnd = new Date(weekStart);

  weekEnd.setDate(
    weekStart.getDate() + 6
  );

  return (
    <div className="
      flex
      flex-col
      gap-4
      border-b
      border-zinc-200
      px-4
      py-4
      sm:px-6
    ">

      <div className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <div>

          <h1 className="
            text-xl
            font-semibold
            text-zinc-800
          ">
            Agendamentos
          </h1>

          <p className="
            text-sm
            text-zinc-500
          ">
            Gerencie consultas e
            procedimentos da clínica
          </p>

        </div>

        <button
          type="button"
          onClick={onCreate}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-rose-500
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-rose-600
          "
        >

          <Plus size={16} />

          Novo agendamento

        </button>

      </div>

      <div className="
        flex
        flex-col
        gap-3
        lg:flex-row
        lg:items-center
        lg:justify-between
      ">

        <div className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
        ">

          <div className="
            relative
            min-w-[220px]
          ">

            <Search
              size={16}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-zinc-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                onSearchChange(
                  event.target.value
                )
              }
              placeholder="Buscar cliente ou telefone"
              className="
                w-full
                rounded-xl
                border
                border-zinc-200
                py-2.5
                pl-9
                pr-3
                text-sm
                outline-none
                focus:border-rose-300
                focus:ring-2
                focus:ring-rose-100
              "
            />

          </div>

          <select
            value={status}
            onChange={(event) =>
              onStatusChange(
                event.target.value
              )
            }
            className="
              rounded-xl
              border
              border-zinc-200
              px-3
              py-2.5
              text-sm
              outline-none
              focus:border-rose-300
              focus:ring-2
              focus:ring-rose-100
            "
          >

            <option value="">
              Todos os status
            </option>

            {APPOINTMENT_STATUSES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {
                    STATUS_LABELS[
                      item
                    ]
                  }
                </option>
              )
            )}

          </select>

        </div>

        <div className="
          flex
          items-center
          justify-between
          gap-2
          rounded-xl
          border
          border-zinc-200
          px-2
          py-1.5
        ">

          <button
            type="button"
            onClick={() =>
              onWeekChange(-1)
            }
            className="
              rounded-lg
              p-2
              text-zinc-600
              transition
              hover:bg-zinc-100
            "
            aria-label="Semana anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="
            px-2
            text-sm
            font-medium
            text-zinc-700
          ">
            {formatDayMonth(
              weekStart
            )}{" "}
            —{" "}
            {formatDayMonth(weekEnd)}
          </span>

          <button
            type="button"
            onClick={() =>
              onWeekChange(1)
            }
            className="
              rounded-lg
              p-2
              text-zinc-600
              transition
              hover:bg-zinc-100
            "
            aria-label="Próxima semana"
          >
            <ChevronRight size={18} />
          </button>

        </div>

      </div>

    </div>
  );
}
