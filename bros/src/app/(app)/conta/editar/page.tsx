"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackBar } from "@/components/back-bar";
import { Alert, Field, buttonClass, inputClass, textareaClass } from "@/components/ui";
import { CITIES } from "@/lib/cities";
import {
  BODY_TYPE_OPTIONS,
  LOOKING_FOR_OPTIONS,
  POSITION_OPTIONS,
} from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { BodyType, LookingFor, Position, Profile } from "@/lib/types";

export default function EditarPerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile((row as Profile | null) ?? null);
    });
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      alias: String(form.get("alias") ?? "").trim(),
      age: Number(form.get("age")),
      city: String(form.get("city") ?? "").trim(),
      looking_for: String(form.get("looking_for")) as LookingFor,
      bio: String(form.get("bio") ?? "").trim(),
      height_cm: form.get("height_cm") ? Number(form.get("height_cm")) : null,
      weight_kg: form.get("weight_kg") ? Number(form.get("weight_kg")) : null,
      body_type: (String(form.get("body_type")) || null) as BodyType | null,
      position: (String(form.get("position")) || null) as Position | null,
    };

    setPending(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id);
    setPending(false);

    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("column")
          ? "Rode o SQL supabase/profile-albums.sql no Supabase."
          : updateError.message.toLowerCase().includes("alias")
            ? "Este apelido já está em uso."
            : "Não foi possível salvar.",
      );
      return;
    }
    router.push("/conta");
  }

  if (!profile) {
    return <p className="text-[13px] text-muted">Carregando…</p>;
  }

  return (
    <div>
      <BackBar href="/conta" title="Editar perfil" />
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <Alert>{error}</Alert> : null}
        <Field label="Apelido">
          <input
            name="alias"
            defaultValue={profile.alias}
            required
            minLength={2}
            maxLength={24}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Idade">
            <input
              name="age"
              type="number"
              min={18}
              max={99}
              defaultValue={profile.age}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Cidade">
            <input
              name="city"
              list="edit-cities"
              defaultValue={profile.city}
              required
              className={inputClass}
            />
            <datalist id="edit-cities">
              {CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="O que busca">
          <select
            name="looking_for"
            defaultValue={profile.looking_for}
            className={inputClass}
          >
            {LOOKING_FOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Altura (cm)">
            <input
              name="height_cm"
              type="number"
              min={120}
              max={230}
              defaultValue={profile.height_cm ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Peso (kg)">
            <input
              name="weight_kg"
              type="number"
              min={40}
              max={250}
              defaultValue={profile.weight_kg ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Tipo físico">
          <select name="body_type" defaultValue={profile.body_type ?? ""} className={inputClass}>
            <option value="">Não informar</option>
            {BODY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Posição">
          <select name="position" defaultValue={profile.position ?? ""} className={inputClass}>
            <option value="">Não informar</option>
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descrição" hint="O que você quer que os outros leiam. Sem telefone.">
          <textarea
            name="bio"
            defaultValue={profile.bio}
            maxLength={800}
            rows={6}
            className={textareaClass}
            placeholder="Sobre você"
          />
        </Field>
        <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}
