import {
  Clock,
  DollarSign,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  formatDurationShort,
  formatPriceBrl,
  getCategoryStyle,
} from "@/lib/procedureFormat";

export function ProceduresGrid({
  procedures,
  onEdit,
  onDelete,
}) {

  if (!procedures.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center">
        <p className="text-base font-medium text-zinc-700">
          Nenhum procedimento cadastrado
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Adicione serviços ao catálogo para a IA informar preços e duração no agendamento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {procedures.map((procedure) => {
        const style =
          getCategoryStyle(
            procedure.category
          );

        return (
          <article
            key={procedure.id}
            className={`group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:shadow-md ${
              procedure.active
                ? ""
                : "opacity-70"
            }`}
          >
            <div
              className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${style.blob}`}
            />

            <div className="relative flex items-start justify-between gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}
              >
                {procedure.category ?? "Facial"}
              </span>

              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() =>
                    onEdit(procedure)
                  }
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDelete(procedure)
                  }
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="relative mt-4">
              <h3 className="text-lg font-semibold text-zinc-800">
                {procedure.name}
              </h3>

              <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-zinc-500">
                {procedure.description ||
                  "Sem descrição cadastrada."}
              </p>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Clock size={15} />
                {formatDurationShort(
                  procedure.durationMin
                )}
              </div>

              <div className="flex items-center gap-1 text-base font-semibold text-rose-700">
                <DollarSign size={16} />
                {formatPriceBrl(
                  procedure.price
                )}
              </div>
            </div>

            {!procedure.active && (
              <span className="absolute bottom-4 left-5 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Inativo
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}
