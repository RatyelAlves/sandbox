"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, FormSection } from "@/components/ui/FormField";
import {
  FormActions,
  FormPageHeader,
  FormShell,
} from "@/components/ui/FormLayout";
import { Input } from "@/components/ui/Input";
import { ProfilePhotoUpload } from "@/components/ui/ProfilePhotoUpload";
import { useAuth } from "@/lib/auth-context";

interface UserProfileFormProps {
  mode: "register" | "update";
  embedded?: boolean;
  backHref?: string;
  cancelHref?: string;
}

export function UserProfileForm({
  mode,
  embedded = false,
  backHref,
  cancelHref,
}: UserProfileFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (mode === "update") {
      router.push("/usuario/perfil");
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          accountType: "usuario",
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível criar a conta.");
        return;
      }

      const signIn = await login(email, password);
      if (!signIn.ok) {
        setError(signIn.error ?? "Conta criada, mas falha ao entrar.");
        return;
      }

      router.push("/usuario/home");
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === "register" ? "Monte seu perfil de Usuário" : "Atualize seu perfil";
  const subtitle =
    mode === "register"
      ? "Preencha seus dados para explorar terreiros e eventos"
      : "Mantenha suas informações de contato atualizadas";
  const submitLabel =
    mode === "register"
      ? submitting
        ? "Cadastrando..."
        : "Cadastrar"
      : "Atualizar";
  const resolvedBackHref =
    backHref ?? (mode === "register" ? "/primeiro-acesso" : undefined);
  const resolvedCancelHref =
    cancelHref ?? (mode === "register" ? "/primeiro-acesso" : "/usuario/home");

  return (
    <FormShell onSubmit={handleSubmit}>
      {!embedded && (
        <FormPageHeader
          title={title}
          subtitle={subtitle}
          backHref={resolvedBackHref}
        />
      )}

      <FormSection
        title="Foto de perfil"
        description="Opcional — ajuda a personalizar sua conta."
      >
        <ProfilePhotoUpload />
      </FormSection>

      <FormSection title="Dados pessoais" description="Informações básicas da sua conta.">
        <FormField label="Nome" htmlFor="usuario-nome">
          <Input id="usuario-nome" name="nome" placeholder="Seu nome" required />
        </FormField>
        <FormField label="Sobrenome" htmlFor="usuario-sobrenome">
          <Input
            id="usuario-sobrenome"
            name="sobrenome"
            placeholder="Seu sobrenome"
            required
          />
        </FormField>
        <FormField label="E-mail" htmlFor="usuario-email">
          <Input
            id="usuario-email"
            name="email"
            placeholder="seu@email.com"
            type="email"
            autoComplete="email"
            required
          />
        </FormField>
        <FormField label="Telefone" htmlFor="usuario-telefone">
          <Input
            id="usuario-telefone"
            name="telefone"
            placeholder="(31) 99999-9999"
            type="tel"
            autoComplete="tel"
            required
          />
        </FormField>
      </FormSection>

      {mode === "register" && (
        <FormSection
          title="Segurança"
          description="Defina uma senha para acessar sua conta."
        >
          <FormField label="Senha" htmlFor="usuario-senha">
            <Input
              id="usuario-senha"
              name="password"
              placeholder="Mínimo 6 caracteres"
              type="password"
              variant="peach"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </FormField>
          <FormField label="Confirmar senha" htmlFor="usuario-confirmar-senha">
            <Input
              id="usuario-confirmar-senha"
              name="confirmPassword"
              placeholder="Repita a senha"
              type="password"
              variant="peach"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </FormField>
        </FormSection>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <FormActions submitLabel={submitLabel} cancelHref={resolvedCancelHref} />
    </FormShell>
  );
}
