"use client";

import { EventoForm } from "@/components/eventos/EventoForm";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function TerreiroNovoEventoPage() {
  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <EventoForm mode="create" />
        </div>
      </Card>

      <DesktopPanel
        backHref="/terreiro/eventos"
        title="Cadastrar Novo Evento"
        subtitle="Divulgue giras, festividades e obrigações"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <EventoForm embedded mode="create" />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
