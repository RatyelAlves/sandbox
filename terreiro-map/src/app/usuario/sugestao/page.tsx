"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { TerreiroProfileForm } from "@/components/forms/TerreiroProfileForm";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function SugestaoPage() {
  return (
    <AppShell showNav accountType="usuario" desktopInset>
      <Card title="Sugestão de cadastro" className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <TerreiroProfileForm mode="suggestion" />
        </div>
      </Card>

      <DesktopPanel
        backHref="/usuario/terreiros"
        title="Sugestão de cadastro"
        subtitle="Sua sugestão será avaliada e ficará disponível em até 3 dias"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <TerreiroProfileForm mode="suggestion" embedded />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
