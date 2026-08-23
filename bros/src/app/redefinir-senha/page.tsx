"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/marketing-chrome";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/utils";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase ainda não foi configurado.");
      setReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    (async () => {
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setValid(Boolean(data.session));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(authErrorMessage(updateError.message));
        return;
      }
      router.push("/descobrir");
      router.refresh();
    } catch {
      setError("Não foi possível salvar a senha.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Acesso</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Nova senha</h1>
        <p className="mt-2 text-sm text-muted">
          Escolha uma senha nova. O link do email só vale uma vez.
        </p>

        {!ready ? (
          <p className="mt-8 text-sm text-muted">Abrindo o link…</p>
        ) : !valid ? (
          <div className="mt-8 space-y-4">
            <Alert>
              Este link expirou ou já foi usado. Peça outro em Esqueci a senha.
            </Alert>
            <Link href="/esqueci-senha" className={`${buttonClass.primary} w-full`}>
              Pedir outro link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            <Field label="Nova senha">
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
            <button
              type="submit"
              disabled={pending}
              className={`${buttonClass.primary} w-full`}
            >
              {pending ? "Salvando…" : "Salvar senha"}
            </button>
          </form>
        )}
      </main>
    </AuthFrame>
  );
}
