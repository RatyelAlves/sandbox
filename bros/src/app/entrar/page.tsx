"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/marketing-chrome";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/utils";

export default function EntrarPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Supabase ainda não foi configurado.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) {
        setError(authErrorMessage(signError.message));
        return;
      }
      router.push("/descobrir");
      router.refresh();
    } catch {
      setError("Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Acesso</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Só email e senha. Nenhuma rede social.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
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
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>
          <p className="-mt-2 text-right text-sm">
            <Link href="/esqueci-senha" className="text-accent hover:underline">
              Esqueci a senha
            </Link>
          </p>
          <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-accent hover:underline">
            Criar agora
          </Link>
        </p>
      </main>
    </AuthFrame>
  );
}
