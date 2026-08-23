"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/marketing-chrome";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/utils";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!isSupabaseConfigured()) {
      setError("Supabase ainda não foi configurado.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const adult = form.get("adult") === "on";

    if (!adult) {
      setError("Você precisa confirmar que tem 18 anos ou mais.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (signError) {
        setError(authErrorMessage(signError.message));
        return;
      }
      if (!data.session) {
        setInfo("Confira seu email para ativar a conta. Depois volte para entrar.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Não foi possível criar a conta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent">
          Novo acesso
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">Criar conta</h1>
        <p className="mt-2 text-sm text-muted">
          Sem Facebook, sem Google. O email nunca aparece no perfil.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          {info ? <Alert tone="ok">{info}</Alert> : null}
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label="Senha">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <Field label="Confirmar senha">
            <input
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              name="adult"
              type="checkbox"
              required
              className="mt-1 accent-accent"
            />
            <span>
              Confirmo que tenho 18 anos ou mais e aceito os{" "}
              <Link href="/termos" className="text-accent hover:underline">
                termos
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-accent hover:underline">
                privacidade
              </Link>
              .
            </span>
          </label>
          <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
            {pending ? "Criando…" : "Continuar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </main>
    </AuthFrame>
  );
}
