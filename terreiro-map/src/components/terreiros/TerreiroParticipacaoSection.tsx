"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { CampanhaCard } from "@/components/doacoes/CampanhaCard";
import { ListItem } from "@/components/ui/ListItem";
import {
  EMPTY_CAMPANHAS,
  getCampanhasPublicasByTerreiro,
  subscribeToCampanhas,
} from "@/lib/campanhas-store";
import {
  formatEventoSubtitle,
  isEventoProximo,
} from "@/lib/evento-utils";
import {
  EMPTY_EVENTOS,
  getEventosPublicosByTerreiro,
  subscribeToEventos,
} from "@/lib/eventos-store";

interface TerreiroParticipacaoSectionProps {
  terreiroId: string;
}

export function TerreiroParticipacaoSection({
  terreiroId,
}: TerreiroParticipacaoSectionProps) {
  const eventosPublicos = useSyncExternalStore(
    subscribeToEventos,
    () => getEventosPublicosByTerreiro(terreiroId),
    () => EMPTY_EVENTOS,
  );

  const campanhas = useSyncExternalStore(
    subscribeToCampanhas,
    () => getCampanhasPublicasByTerreiro(terreiroId),
    () => EMPTY_CAMPANHAS,
  );

  const eventos = eventosPublicos.filter((evento) => isEventoProximo(evento));

  if (eventos.length === 0 && campanhas.length === 0) return null;

  return (
    <section className="border-t border-text-brown/10 pt-4">
      <h2 className="mb-1 font-bold text-text-brown">Participe</h2>
      <p className="mb-3 text-sm leading-snug text-text-brown/70">
        Eventos abertos e campanhas de arrecadação deste terreiro em que você
        pode participar.
      </p>

      {eventos.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-text-brown/45">
            Eventos próximos
          </h3>
          {eventos.map((evento) => (
            <ListItem
              key={evento.id}
              title={evento.titulo}
              subtitle={formatEventoSubtitle(evento)}
              href={`/usuario/eventos/${evento.id}`}
            />
          ))}
        </div>
      )}

      {campanhas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-text-brown/45">
            Campanhas ativas
          </h3>
          {campanhas.map((campanha) => (
            <CampanhaCard key={campanha.id} campanha={campanha} manage={false} />
          ))}
          <p className="text-xs text-text-brown/55">
            Entre em contato com o terreiro para contribuir com doações ou
            itens.{" "}
            <Link
              href="#contato-terreiro"
              className="font-semibold text-input-orange hover:underline"
            >
              Ver contatos
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
