"use client";

import { useMemo, useState } from "react";
import { EventoCard } from "@/components/eventos/EventoCard";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { useTerreiroEventos } from "@/hooks/useEventos";
import { isEventoEncerrado, isEventoProximo } from "@/lib/evento-utils";
import { mobileListCardClass } from "@/lib/terreiro-layout";

type FiltroEvento = "proximos" | "encerrados";

function EventoFiltroTabs({
  filtro,
  onChange,
  totalProximos,
  totalEncerrados,
}: {
  filtro: FiltroEvento;
  onChange: (filtro: FiltroEvento) => void;
  totalProximos: number;
  totalEncerrados: number;
}) {
  const tabs: { id: FiltroEvento; label: string; count: number }[] = [
    { id: "proximos", label: "Próximos", count: totalProximos },
    { id: "encerrados", label: "Encerrados", count: totalEncerrados },
  ];

  return (
    <div
      className="mb-3 flex shrink-0 rounded-xl bg-input-surface-warm/60 p-1 ring-1 ring-[color:var(--input-border)]"
      role="tablist"
      aria-label="Filtrar eventos"
    >
      {tabs.map((tab) => {
        const selected = filtro === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              selected
                ? "bg-white text-text-brown shadow-sm"
                : "text-text-brown/55 hover:text-text-brown/80"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                selected
                  ? "bg-input-orange/15 text-input-orange"
                  : "bg-text-brown/8 text-text-brown/45"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EventosListContent({
  myEvents,
  filtro,
  onFiltroChange,
}: {
  myEvents: ReturnType<typeof useTerreiroEventos>;
  filtro: FiltroEvento;
  onFiltroChange: (filtro: FiltroEvento) => void;
}) {
  const proximos = useMemo(
    () => myEvents.filter((evento) => isEventoProximo(evento)),
    [myEvents],
  );
  const encerrados = useMemo(
    () => myEvents.filter((evento) => isEventoEncerrado(evento)),
    [myEvents],
  );

  const eventosVisiveis = filtro === "proximos" ? proximos : encerrados;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Button type="button" href="/terreiro/eventos/novo" className="mb-4 shrink-0 md:max-w-xs">
        Criar Novo Evento
      </Button>

      {myEvents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-text-brown/50">
            Nenhum evento cadastrado ainda.
          </p>
        </div>
      ) : (
        <>
          <EventoFiltroTabs
            filtro={filtro}
            onChange={onFiltroChange}
            totalProximos={proximos.length}
            totalEncerrados={encerrados.length}
          />

          {eventosVisiveis.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-sm text-text-brown/50">
                {filtro === "proximos"
                  ? "Nenhum evento próximo."
                  : "Nenhum evento encerrado."}
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
              {eventosVisiveis.map((evento) => (
                <EventoCard key={evento.id} evento={evento} manage />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TerreiroEventosPage() {
  const myEvents = useTerreiroEventos();
  const [filtro, setFiltro] = useState<FiltroEvento>("proximos");

  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card title="Eventos" className={mobileListCardClass}>
        <EventosListContent
          myEvents={myEvents}
          filtro={filtro}
          onFiltroChange={setFiltro}
        />
      </Card>

      <DesktopPanel
        title="Eventos"
        subtitle="Gerencie as programações do seu terreiro"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <EventosListContent
          myEvents={myEvents}
          filtro={filtro}
          onFiltroChange={setFiltro}
        />
      </DesktopPanel>
    </AppShell>
  );
}
