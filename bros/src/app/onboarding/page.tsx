"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { PanicButton } from "@/components/panic-button";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { CITIES } from "@/lib/cities";
import { isSupabaseConfigured } from "@/lib/env";
import { LOOKING_FOR_OPTIONS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { LookingFor } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const alias = String(form.get("alias") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const age = Number(form.get("age"));
    const bio = String(form.get("bio") ?? "").trim();
    const looking_for = String(form.get("looking_for") ?? "encontros") as LookingFor;
    const discreet_mode = form.get("discreet_mode") === "on";

    if (alias.length < 2 || alias.length > 24) {
      setError("O apelido precisa ter entre 2 e 24 caracteres.");
      return;
    }
    if (!city) {
      setError("Escolha uma cidade.");
      return;
    }
    if (!Number.isFinite(age) || age < 18 || age > 99) {
      setError("A idade precisa ser 18 ou mais.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Supabase ainda não foi configurado.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/entrar");
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        alias,
        city,
        age,
        bio,
        looking_for,
        discreet_mode,
      });

      if (insertError) {
        if (insertError.message.toLowerCase().includes("alias")) {
          setError("Este apelido já está em uso.");
        } else {
          setError("Não foi possível salvar o perfil.");
        }
        return;
      }

      router.push("/descobrir");
      router.refresh();
    } catch {
      setError("Algo deu errado. Tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line/80">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <BrandLogo href="/descobrir" />
          <PanicButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent">
          Perfil
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">Como você aparece</h1>
        <p className="mt-2 text-sm text-muted">
          Sem nome real. O modo discreto vem ligado: seu rosto fica escondido
          até você liberar alguém.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Apelido">
            <input
              name="alias"
              required
              minLength={2}
              maxLength={24}
              className={inputClass}
              placeholder="Como quer ser chamado"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Idade">
              <input
                name="age"
                type="number"
                required
                min={18}
                max={99}
                className={inputClass}
              />
            </Field>
            <Field label="Cidade">
              <input
                name="city"
                required
                list="cities"
                className={inputClass}
                placeholder="Cidade, UF"
              />
              <datalist id="cities">
                {CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="O que busca">
            <select name="looking_for" className={inputClass} defaultValue="encontros">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bio" hint="Opcional. Sem telefone, sem @ de rede social.">
            <textarea
              name="bio"
              rows={4}
              maxLength={400}
              className={`${inputClass} resize-none`}
            />
          </Field>
          <label className="flex items-start gap-3 rounded-md border border-line bg-bg-elevated p-3 text-sm text-muted">
            <input
              name="discreet_mode"
              type="checkbox"
              defaultChecked
              className="mt-1 accent-accent"
            />
            <span>
              <strong className="text-ink">Modo discreto</strong> — esconde fotos
              de rosto no Explorar e no perfil. Só quem você Liberar vê. Fotos
              de corpo podem ficar públicas.
            </span>
          </label>
          <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
            {pending ? "Salvando…" : "Entrar no Bros"}
          </button>
        </form>
      </main>
    </div>
  );
}
