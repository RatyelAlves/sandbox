import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { TerreiroProfileForm } from "@/components/forms/TerreiroProfileForm";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function CadastroTerreiroPage() {
  return (
    <AppShell desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <TerreiroProfileForm mode="register" />
        </div>
      </Card>

      <DesktopPanel
        backHref="/primeiro-acesso"
        title="Cadastro de terreiro"
        subtitle="Cadastre sua casa no mapa da comunidade"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <TerreiroProfileForm mode="register" embedded />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
