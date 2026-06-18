"use client";

import { useParams } from "next/navigation";
import { CampanhaForm } from "@/components/doacoes/CampanhaForm";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { useCampanha } from "@/hooks/useCampanhas";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function TerreiroEditarCampanhaPage() {
  const params = useParams();
  const id = params.id as string;
  const campanha = useCampanha(id);

  if (!campanha) {
    return (
      <AppShell showNav accountType="terreiro">
        <Card title="Campanha não encontrada">
          <p className="text-center text-sm text-text-brown/70">
            A campanha solicitada não existe.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <CampanhaForm mode="edit" campanha={campanha} />
        </div>
      </Card>

      <DesktopPanel
        backHref="/terreiro/doacoes"
        title="Editar campanha"
        subtitle="Atualize as informações da campanha"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <CampanhaForm embedded mode="edit" campanha={campanha} />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
