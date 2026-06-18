"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { TerreiroDetailView } from "@/components/terreiros/TerreiroDetailView";
import { useTerreiroDisplay } from "@/hooks/useTerreiro";

export default function UsuarioTerreiroDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const terreiro = useTerreiroDisplay(id);

  if (!terreiro) {
    return (
      <AppShell showNav accountType="usuario">
        <Card title="Terreiro não encontrado">
          <p className="text-center text-text-brown">
            O terreiro solicitado não existe.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell showNav accountType="usuario" desktopInset>
      <div className="flex h-full min-h-0 w-full md:h-[calc(100dvh-3rem)]">
        <TerreiroDetailView terreiro={terreiro} accountType="usuario" />
      </div>
    </AppShell>
  );
}
