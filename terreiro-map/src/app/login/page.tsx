"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthCardHeader, Card } from "@/components/ui/Card";
import { FormField, FormSection } from "@/components/ui/FormField";
import { FormActions, FormShell } from "@/components/ui/FormLayout";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { ProjectCredits } from "@/components/ui/ProjectCredits";
import { useAuth } from "@/lib/auth-context";
import { TEST_ACCOUNTS } from "@/lib/test-accounts";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "E-mail ou senha inválidos.");
      return;
    }

    const destination =
      result.accountType === "terreiro" ? "/terreiro/home" : "/usuario/home";
    router.push(destination);
  };

  const fillTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError("");
  };

  return (
    <AppShell variant="auth">
      <div className="flex w-full flex-col items-center">
        <div className="mb-6">
          <Logo size="md" />
        </div>
        <Card className="w-full">
          <AuthCardHeader
            title="Entrar"
            subtitle="Entre na sua conta para continuar"
          />

          <FormShell onSubmit={handleSubmit}>
            <FormSection title="Acesso" description="Use seu e-mail e senha cadastrados.">
              <FormField label="E-mail" htmlFor="login-email">
                <Input
                  id="login-email"
                  placeholder="seu@email.com"
                  type="email"
                  variant="peach"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Senha" htmlFor="login-senha">
                <Input
                  id="login-senha"
                  placeholder="Sua senha"
                  type="password"
                  variant="peach"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormField>
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
                  {error}
                </p>
              )}
            </FormSection>

            <FormActions submitLabel={submitting ? "Entrando..." : "Entrar"} />
          </FormShell>

          <div className="mt-6 rounded-2xl bg-input-surface-warm/70 px-4 py-3 ring-1 ring-[color:var(--input-border)]">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-text-brown/55">
              Acessos de teste
            </p>
            <div className="mt-3 space-y-2">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillTestAccount(account.email, account.password)}
                  className="flex w-full items-center justify-between rounded-xl bg-input-surface px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#f3e2cc] active:scale-[0.99]"
                >
                  <span className="font-semibold text-text-brown">
                    {account.label}
                  </span>
                  <span className="text-xs text-text-brown/60">
                    {account.email} · {account.password}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/primeiro-acesso")}
            className="mt-6 w-full text-center text-sm font-semibold text-text-brown/70 transition-colors hover:text-text-brown"
          >
            Primeiro acesso?{" "}
            <span className="font-bold text-text-brown underline">Criar conta</span>
          </button>
        </Card>
        <ProjectCredits className="mt-6" />
      </div>
    </AppShell>
  );
}
