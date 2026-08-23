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
      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-6 py-12 sm:px-8">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Entre com email e senha. Sem rede social.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@email.com"
              className={`${inputClass} rounded-lg`}
            />
          </Field>
          <Field label="Senha">
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Sua senha"
              className={`${inputClass} rounded-lg`}
            />
          </Field>
          <div className="flex justify-end">
            <Link
              href="/esqueci-senha"
              className="text-[13px] font-medium text-muted transition hover:text-ink"
            >
              Esqueci a senha
            </Link>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${buttonClass.primary} w-full rounded-lg`}
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-8 border-t border-line pt-6 text-[14px] text-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-accent hover:underline">
            Criar agora
          </Link>
        </p>
      </main>
    </AuthFrame>
  );
}
