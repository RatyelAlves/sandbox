"use client";

import { useSearchParams } from "next/navigation";
import { CampanhaForm } from "@/components/doacoes/CampanhaForm";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function TerreiroNovaDoacaoPage() {
  const searchParams = useSearchParams();
  const parceiroId = searchParams.get("parceiro");

  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <CampanhaForm mode="create" parceiroId={parceiroId} />
        </div>
      </Card>

      <DesktopPanel
        backHref="/terreiro/doacoes"
        title={parceiroId ? "Campanha conjunta" : "Nova campanha"}
        subtitle={
          parceiroId
            ? "Proponha uma arrecadação em parceria com outro terreiro"
            : "Crie uma campanha para a comunidade"
        }
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <CampanhaForm embedded mode="create" parceiroId={parceiroId} />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
