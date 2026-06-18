"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopActionCard, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { TerreiroProfileForm } from "@/components/forms/TerreiroProfileForm";
import { SwitchAccessButton } from "@/components/layout/SwitchAccessButton";
import { ProjectCredits } from "@/components/ui/ProjectCredits";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function TerreiroPerfilPage() {
  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <SwitchAccessButton variant="panel" accountType="terreiro" className="mb-5" />
          <Link
            href="/terreiro/terreiros"
            className="mb-5 block rounded-2xl bg-input-orange/10 px-4 py-4 text-center ring-1 ring-input-orange/20 transition-colors hover:bg-input-orange/15"
          >
            <span className="block font-bold text-text-brown">Rede de Terreiros</span>
            <span className="mt-1 block text-sm text-text-brown/70">
              Busque parceiros para campanhas conjuntas
            </span>
          </Link>
          <TerreiroProfileForm mode="update" />
          <ProjectCredits className="mt-6" />
        </div>
      </Card>

      <DesktopPanel
        title="Perfil do terreiro"
        subtitle="Mantenha as informações do seu terreiro atualizadas"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <TerreiroProfileForm mode="update" embedded />
        </div>
        <div className="mx-auto mt-6 w-full max-w-2xl">
          <DesktopActionCard
            label="Rede de Terreiros"
            description="Busque casas parceiras para campanhas conjuntas"
            href="/terreiro/terreiros"
          />
        </div>
        <div className="mx-auto mt-6 w-full max-w-2xl border-t border-[color:var(--input-border)] pt-6">
          <SwitchAccessButton variant="panel" accountType="terreiro" />
        </div>
        <ProjectCredits className="mx-auto mt-6 w-full max-w-2xl" />
      </DesktopPanel>
    </AppShell>
  );
}
