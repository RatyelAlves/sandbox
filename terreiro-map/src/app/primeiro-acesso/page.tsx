"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { AuthCardHeader, Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const { setAccountType } = useAuth();

  const choose = (type: "usuario" | "terreiro") => {
    setAccountType(type);
    router.push(`/cadastro/${type}`);
  };

  return (
    <AppShell variant="auth">
      <div className="flex w-full flex-col items-center">
        <div className="mb-6">
          <Logo size="md" />
        </div>
        <Card className="w-full">
          <AuthCardHeader
            title="Primeiro Acesso"
            subtitle="Escolha o tipo de conta que deseja criar"
          />
          <div className="flex flex-col gap-3">
            <Button onClick={() => choose("usuario")}>Usuário</Button>
            <Button onClick={() => choose("terreiro")}>Terreiro</Button>
          </div>
          <p className="mt-6 text-center text-sm text-text-brown/70">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-text-brown underline transition-colors hover:text-input-orange"
            >
              Já tenho conta — entrar
            </button>
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
