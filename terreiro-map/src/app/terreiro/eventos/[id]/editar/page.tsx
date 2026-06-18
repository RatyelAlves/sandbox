"use client";

import { useParams } from "next/navigation";
import { EventoForm } from "@/components/eventos/EventoForm";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { useEvento } from "@/hooks/useEventos";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function TerreiroEditarEventoPage() {
  const params = useParams();
  const id = params.id as string;
  const evento = useEvento(id);

  if (!evento) {
    return (
      <AppShell showNav accountType="terreiro">
        <Card title="Evento não encontrado">
          <p className="text-center text-sm text-text-brown/70">
            O evento solicitado não existe.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <EventoForm mode="edit" evento={evento} />
        </div>
      </Card>

      <DesktopPanel
        backHref="/terreiro/eventos"
        title="Editar evento"
        subtitle="Atualize as informações do evento"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <EventoForm embedded mode="edit" evento={evento} />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
