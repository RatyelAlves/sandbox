import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { formDesktopWrapClass } from "@/components/ui/FormLayout";
import { UserProfileForm } from "@/components/forms/UserProfileForm";
import {
  mobileListCardClass,
  mobileProfileScrollClass,
} from "@/lib/terreiro-layout";

export default function CadastroUsuarioPage() {
  return (
    <AppShell desktopInset>
      <Card className={mobileListCardClass}>
        <div className={mobileProfileScrollClass}>
          <UserProfileForm mode="register" />
        </div>
      </Card>

      <DesktopPanel
        backHref="/primeiro-acesso"
        title="Cadastro de usuário"
        subtitle="Monte seu perfil para explorar terreiros e eventos"
        surface="white"
        fillHeight
        scrollable
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className={formDesktopWrapClass}>
          <UserProfileForm mode="register" embedded />
        </div>
      </DesktopPanel>
    </AppShell>
  );
}
