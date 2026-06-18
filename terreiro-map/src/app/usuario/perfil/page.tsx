"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { UserProfileForm } from "@/components/forms/UserProfileForm";
import { SwitchAccessButton } from "@/components/layout/SwitchAccessButton";
import { ProjectCredits } from "@/components/ui/ProjectCredits";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function UsuarioPerfilPage() {
  return (
    <AppShell showNav accountType="usuario" desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <SwitchAccessButton variant="panel" accountType="usuario" className="mb-5" />
          <UserProfileForm mode="update" />
          <ProjectCredits className="mt-6" />
        </div>
      </Card>

      <DesktopPanel
        title="Meu perfil"
        subtitle="Atualize seus dados de usuário"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <UserProfileForm mode="update" embedded />
        </div>
        <div className="mx-auto mt-6 w-full max-w-2xl border-t border-[color:var(--input-border)] pt-6">
          <SwitchAccessButton variant="panel" accountType="usuario" />
        </div>
        <ProjectCredits className="mx-auto mt-6 w-full max-w-2xl" />
      </DesktopPanel>
    </AppShell>
  );
}
