"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  DesktopActionCard,
  DesktopPanel,
  HighlightList,
  NavCard,
} from "@/components/ui/Card";
import { TerreirosMap } from "@/components/map/TerreirosMap";
import { useTerreiros } from "@/hooks/useTerreiros";
import {
  mobileHomeActionsClass,
  mobileHomeLayoutClass,
  mobileHomeMapClass,
} from "@/lib/terreiro-layout";

export default function UsuarioHomePage() {
  const terreiros = useTerreiros();
  const highlights = useMemo(
    () =>
      terreiros.slice(0, 3).map((t) => ({
        id: t.id,
        primary: t.nome,
        secondary: `${t.categoria} · ${t.cidade}`,
        href: `/usuario/terreiros/${t.id}`,
      })),
    [terreiros],
  );

  return (
    <AppShell showNav accountType="usuario" desktopInset className="max-md:pt-3">
      <div className={mobileHomeLayoutClass}>
        <div className={mobileHomeMapClass}>
          <TerreirosMap
            terreiros={terreiros}
            height="100%"
            fill
            showUserLocation
            markerHrefPrefix="/usuario/terreiros"
          />
        </div>
        <div className={`${mobileHomeActionsClass} gap-2`}>
          <div className="flex gap-2">
            <NavCard label="Terreiros" href="/usuario/terreiros" />
            <NavCard label="Eventos" href="/usuario/eventos" />
          </div>
        </div>
      </div>

      <DesktopPanel
        title="Início"
        subtitle="Explore terreiros e eventos na região de Belo Horizonte"
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
              showUserLocation
              markerHrefPrefix="/usuario/terreiros"
            />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5">
            <DesktopActionCard
              label="Terreiros"
              description="Busque casas por categoria e localização"
              href="/usuario/terreiros"
            />
            <DesktopActionCard
              label="Eventos"
              description="Giras, festividades e obrigações"
              href="/usuario/eventos"
            />
            <HighlightList items={highlights} />
          </div>
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
