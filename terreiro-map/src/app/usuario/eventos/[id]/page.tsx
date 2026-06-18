"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { EventoDetailView } from "@/components/eventos/EventoDetailView";
import { useTerreiroById } from "@/hooks/useTerreiros";
import { useEvento } from "@/hooks/useEventos";

export default function UsuarioEventoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const evento = useEvento(id);
  const terreiro = useTerreiroById(evento?.terreiroId ?? "");

  if (!evento) {
    return (
      <AppShell showNav accountType="usuario">
        <Card title="Evento não encontrado">
          <p className="text-center text-text-brown">
            O evento solicitado não existe.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell showNav accountType="usuario">
      <div className="w-full lg:max-w-[calc(100%-1rem)] lg:mx-auto xl:max-w-4xl">
        <EventoDetailView
          evento={evento}
          terreiro={terreiro}
          accountType="usuario"
        />
      </div>
    </AppShell>
  );
}
