"use client";

import { AppShell } from "@/components/layout/AppShell";
import {
  DesktopActionCard,
  DesktopPanel,
  NavCard,
} from "@/components/ui/Card";
import { TerreirosMap } from "@/components/map/TerreirosMap";
import { useTerreiros } from "@/hooks/useTerreiros";
import {
  mobileHomeActionsClass,
  mobileHomeLayoutClass,
  mobileHomeMapClass,
} from "@/lib/terreiro-layout";

export default function TerreiroHomePage() {
  const terreiros = useTerreiros();

  return (
    <AppShell showNav accountType="terreiro" desktopInset className="max-md:pt-3">
      <div className={mobileHomeLayoutClass}>
        <div className={mobileHomeMapClass}>
          <TerreirosMap
            terreiros={terreiros}
            height="100%"
            fill
            markerHrefPrefix="/terreiro/terreiros"
          />
        </div>
        <div className={mobileHomeActionsClass}>
          <div className="flex gap-2">
            <NavCard label="Eventos" href="/terreiro/eventos" />
            <NavCard label="Cadastrar Novo Evento" href="/terreiro/eventos/novo" />
          </div>
          <NavCard label="Campanhas" href="/terreiro/doacoes" />
          <NavCard label="Rede de Terreiros" href="/terreiro/terreiros" />
        </div>
      </div>

      <DesktopPanel
        title="Painel do Terreiro"
        subtitle="Gerencie sua presença no mapa e na comunidade"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className="grid min-h-0 flex-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="flex min-h-0 flex-1 flex-col lg:col-span-7 lg:h-full lg:min-h-[420px]">
            <TerreirosMap
              terreiros={terreiros}
              height="100%"
              fill
              markerHrefPrefix="/terreiro/terreiros"
            />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5">
            <DesktopActionCard
              label="Eventos"
              description="Veja e organize suas programações"
              href="/terreiro/eventos"
            />
            <DesktopActionCard
              label="Cadastrar Novo Evento"
              description="Divulgue giras e festividades"
              href="/terreiro/eventos/novo"
            />
            <DesktopActionCard
              label="Campanhas"
              description="Crie campanhas para a comunidade"
              href="/terreiro/doacoes"
            />
            <DesktopActionCard
              label="Rede de Terreiros"
              description="Encontre parceiros para campanhas conjuntas"
              href="/terreiro/terreiros"
            />
          </div>
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
