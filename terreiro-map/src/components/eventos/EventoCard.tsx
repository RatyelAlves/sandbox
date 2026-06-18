"use client";

import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  formatEventoDate,
  formatEventoSubtitle,
  getEventoDisplayStatus,
  isEventoCancelado,
  isEventoEncerrado,
  isEventoPassado,
  isEventoProximo,
} from "@/lib/evento-utils";
import {
  cancelarEvento,
  reativarEvento,
} from "@/lib/eventos-store";
import type { Evento } from "@/lib/mock-data";

interface EventoCardProps {
  evento: Evento;
  manage?: boolean;
}

export function EventoCard({ evento, manage = false }: EventoCardProps) {
  const { openConfirm, dialog } = useConfirmDialog();
  const encerrado = isEventoEncerrado(evento);
  const cancelado = isEventoCancelado(evento);
  const passado = isEventoPassado(evento);
  const proximo = isEventoProximo(evento);
  const detailHref = `/terreiro/eventos/${evento.id}`;

  function handleCancelar() {
    openConfirm({
      title: "Cancelar evento?",
      message: (
        <>
          Cancelar o evento{" "}
          <strong className="text-text-brown">{evento.titulo}</strong>? Ele
          deixará de aparecer para os usuários.
        </>
      ),
      confirmLabel: "Cancelar evento",
      tone: "destructive",
      onConfirm: () => void cancelarEvento(evento.id),
    });
  }

  return (
    <>
    {dialog}
    <article
      className={`rounded-xl bg-input-surface-warm/80 p-3 ring-1 ring-[color:var(--input-border)] sm:p-3.5 ${
        encerrado ? "opacity-85" : ""
      }`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-1.5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
              proximo
                ? "bg-input-orange/15 text-input-orange ring-input-orange/25"
                : "bg-text-brown/10 text-text-brown/60 ring-text-brown/15"
            }`}
          >
            {getEventoDisplayStatus(evento)}
          </span>
          <span className="rounded-full bg-text-brown/8 px-2.5 py-0.5 text-xs font-semibold text-text-brown/70">
            {evento.categoria}
          </span>
        </div>
        <span className="text-xs text-text-brown/50">{evento.horario}</span>
      </div>

      <h2 className="mb-0.5 text-base font-bold leading-snug text-text-brown">
        <a href={detailHref} className="hover:text-input-orange">
          {evento.titulo}
        </a>
      </h2>

      <p className="mb-1 text-sm leading-snug text-text-brown/70">
        {formatEventoDate(evento.data)}
      </p>

      <p className="mb-2 text-sm leading-snug text-text-brown/80">
        {formatEventoSubtitle(evento)}
      </p>

      {manage && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-text-brown/10 pt-2">
          <Button
            type="button"
            href={`/terreiro/eventos/${evento.id}/editar`}
            variant="secondary"
            fullWidth={false}
            className="py-1.5 text-xs"
          >
            Editar evento
          </Button>

          {proximo && !cancelado && (
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={handleCancelar}
              className="py-1.5 text-xs text-text-brown/80"
            >
              Cancelar evento
            </Button>
          )}

          {cancelado && !passado && (
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => void reativarEvento(evento.id)}
              className="py-1.5 text-xs"
            >
              Reativar evento
            </Button>
          )}
        </div>
      )}
    </article>
    </>
  );
}
