"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/marketing-chrome";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/utils";

export default function EsqueciSenhaPage() {
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

    setPending(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha` },
      );
      if (resetError) {
        setError(authErrorMessage(resetError.message));
        return;
      }
      setInfo("Se esse email existir, mandamos um link. Abra no mesmo computador em que o app está rodando.");
    } catch {
      setError("Não foi possível pedir o link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Acesso</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Esqueci a senha</h1>
        <p className="mt-2 text-sm text-muted">
          Mandamos um link no email. Ele só funciona neste computador, com o site aberto.
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
          <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
            {pending ? "Enviando…" : "Enviar link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Lembrou?{" "}
          <Link href="/entrar" className="text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </main>
    </AuthFrame>
  );
}
