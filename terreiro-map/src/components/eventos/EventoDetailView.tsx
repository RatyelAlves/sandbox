"use client";

import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { EventLocationMap } from "@/components/eventos/EventLocationMap";
import {
  formatEventoDate,
  getEventoDisplayStatus,
  isEventoCancelado,
  isEventoPassado,
  isEventoProximo,
} from "@/lib/evento-utils";
import {
  cancelarEvento,
  canManageEvento,
  reativarEvento,
} from "@/lib/eventos-store";
import type { Evento, Terreiro } from "@/lib/mock-data";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-text-brown">
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

interface EventoDetailViewProps {
  evento: Evento;
  terreiro?: Terreiro;
  accountType: "usuario" | "terreiro";
}

export function EventoDetailView({
  evento,
  terreiro,
  accountType,
}: EventoDetailViewProps) {
  const { openConfirm, dialog } = useConfirmDialog();
  const eventosBase =
    accountType === "usuario" ? "/usuario/eventos" : "/terreiro/eventos";
  const terreiroBase =
    accountType === "usuario" ? "/usuario/terreiros" : "/terreiro/terreiros";
  const manage = accountType === "terreiro" && canManageEvento(evento);
  const proximo = isEventoProximo(evento);
  const cancelado = isEventoCancelado(evento);
  const passado = isEventoPassado(evento);

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
    <Card>
      <header className="mb-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
        <BackButton href={eventosBase} label="Voltar à lista de eventos" />
        <h1 className="text-center text-lg font-bold leading-tight text-text-brown md:text-xl">
          {evento.titulo}
        </h1>
        <span aria-hidden className="h-10 w-10" />
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full bg-input-orange/15 px-3 py-1 text-xs font-semibold text-input-orange ring-1 ring-input-orange/25">
          {evento.categoria}
        </span>
        <span className="inline-flex rounded-full bg-text-brown/8 px-3 py-1 text-xs font-semibold text-text-brown/70">
          {getEventoDisplayStatus(evento)}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1 space-y-4">
          <section>
            <h2 className="mb-2 font-bold text-text-brown">Informações</h2>
            <div className="space-y-1">
              <InfoRow label="Data" value={formatEventoDate(evento.data)} />
              <InfoRow label="Horário" value={evento.horario} />
              <InfoRow label="Local" value={evento.local} />
            </div>
          </section>

          {terreiro && (
            <section className="border-t border-text-brown/10 pt-4 sm:border-0 sm:pt-0">
              <h2 className="mb-2 font-bold text-text-brown">Terreiro</h2>
              <div className="space-y-1">
                <InfoRow label="Nome" value={terreiro.nome} />
                <InfoRow
                  label="Cidade"
                  value={`${terreiro.cidade}, ${terreiro.uf}`}
                />
                <Link
                  href={`${terreiroBase}/${terreiro.id}`}
                  className="mt-2 inline-block text-sm font-semibold text-input-orange underline-offset-2 hover:underline"
                >
                  Ver perfil do terreiro
                </Link>
              </div>
            </section>
          )}

          <section className="border-t border-text-brown/10 pt-4">
            <h2 className="mb-2 font-bold text-text-brown">Descrição</h2>
            <p className="text-sm leading-relaxed text-text-brown/85">
              {evento.descricao}
            </p>
          </section>

          {evento.linkIngresso && accountType === "usuario" && (
            <Button href={evento.linkIngresso} fullWidth={false}>
              Comprar ingresso
            </Button>
          )}

          {manage && (
            <div className="flex flex-wrap gap-2 border-t border-text-brown/10 pt-4">
              <Button
                href={`/terreiro/eventos/${evento.id}/editar`}
                variant="secondary"
                fullWidth={false}
              >
                Editar evento
              </Button>
              {proximo && !cancelado && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  onClick={handleCancelar}
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
                >
                  Reativar evento
                </Button>
              )}
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 sm:w-52 md:w-60 lg:w-64 xl:w-72">
          <EventLocationMap
            local={evento.local}
            title={evento.titulo}
            fallbackLat={terreiro?.lat}
            fallbackLng={terreiro?.lng}
            showUserLocation={accountType === "usuario"}
          />
        </aside>
      </div>
    </Card>
    </>
  );
}
