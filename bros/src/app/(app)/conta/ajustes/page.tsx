"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { BackBar } from "@/components/back-bar";
import { Alert, buttonClass, inputClass } from "@/components/ui";
import { loadPanicUrl, parsePanicUrl, savePanicUrl } from "@/lib/panic-url";
import { accessFromGrantRows, accessSummary } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { MediaGrant, PhotoRequest, Profile } from "@/lib/types";

type IncomingRequest = PhotoRequest & {
  requester?: { alias: string } | null;
};

type GrantRow = {
  viewer_id: string;
  viewer?: { alias: string } | null;
  summary: string;
};

export default function AjustesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [error, setError] = useState("");
  const [panicUrl, setPanicUrl] = useState("");
  const [panicSaved, setPanicSaved] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: row } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile((row as Profile | null) ?? null);

    const [{ data: requestRows }, { data: grantRows }, media] = await Promise.all([
      supabase
        .from("photo_requests")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "pending"),
      supabase.from("photo_grants").select("viewer_id").eq("owner_id", user.id),
      supabase
        .from("media_grants")
        .select("viewer_id, scope, album_id, photo_id")
        .eq("owner_id", user.id),
    ]);

    const mediaRows = (media.data ?? []) as Array<
      Pick<MediaGrant, "viewer_id" | "scope" | "album_id" | "photo_id">
    >;
    const extraIds = [
      ...((requestRows ?? []).map((item) => item.requester_id) as string[]),
      ...((grantRows ?? []).map((item) => item.viewer_id) as string[]),
      ...mediaRows.map((item) => item.viewer_id),
    ];
    const unique = [...new Set(extraIds)];
    const { data: extras } = unique.length
      ? await supabase.from("profiles").select("id, alias").in("id", unique)
      : { data: [] };
    const map = new Map(
      ((extras ?? []) as Array<{ id: string; alias: string }>).map((item) => [
        item.id,
        item,
      ]),
    );

    setRequests(
      ((requestRows ?? []) as PhotoRequest[]).map((item) => ({
        ...item,
        requester: map.get(item.requester_id) ?? null,
      })),
    );
    const viewerIds = [
      ...new Set([
        ...((grantRows ?? []).map((item) => item.viewer_id) as string[]),
        ...mediaRows.map((item) => item.viewer_id),
      ]),
    ];
    const legacyAll = new Set(
      ((grantRows ?? []) as Array<{ viewer_id: string }>).map((item) => item.viewer_id),
    );
    setGrants(
      viewerIds.map((id) => {
        const access = accessFromGrantRows(
          legacyAll.has(id),
          mediaRows.filter((row) => row.viewer_id === id),
        );
        return {
          viewer_id: id,
          viewer: map.get(id) ?? null,
          summary: accessSummary(access),
        };
      }),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPanicUrl(loadPanicUrl() ?? "");
  }, []);

  function savePanicPage(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPanicSaved(false);
    const raw = panicUrl.trim();
    if (!raw) {
      savePanicUrl("");
      setPanicSaved(true);
      return;
    }
    if (!parsePanicUrl(raw)) {
      setError("Use uma URL válida, tipo https://www.google.com");
      return;
    }
    const saved = savePanicUrl(raw);
    setPanicUrl(saved ?? "");
    setPanicSaved(true);
  }

  async function toggleDiscreet() {
    if (!profile) return;
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ discreet_mode: !profile.discreet_mode })
      .eq("id", profile.id);
    if (updateError) {
      setError("Não foi possível atualizar.");
      return;
    }
    await load();
  }

  async function declineRequest(item: IncomingRequest) {
    const supabase = createClient();
    await supabase
      .from("photo_requests")
      .update({ status: "declined" })
      .eq("id", item.id);
    await load();
  }

  async function revokeGrant(viewerId: string) {
    if (!profile) return;
    const supabase = createClient();
    await supabase
      .from("photo_grants")
      .delete()
      .eq("owner_id", profile.id)
      .eq("viewer_id", viewerId);
    await supabase
      .from("media_grants")
      .delete()
      .eq("owner_id", profile.id)
      .eq("viewer_id", viewerId);
    await load();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!profile) {
    return <p className="text-[13px] text-muted">Carregando…</p>;
  }

  return (
    <div>
      <BackBar href="/conta" title="Ajustes" />
      {error ? <Alert>{error}</Alert> : null}

      <button
        type="button"
        onClick={toggleDiscreet}
        className="flex w-full items-center justify-between border-b border-line py-4 text-left"
      >
        <span className="pr-4">
          <span className="block text-[16px] font-bold">Modo discreto</span>
          <span className="mt-1 block text-[13px] leading-snug text-muted">
            Fotos de rosto somem do Explorar e do perfil. Só quem você Liberar
            vê. Corpo e outras fotos continuam públicas ou privadas, como você
            escolher. O perfil mostra um selo ao lado da idade.
          </span>
        </span>
        <span className="text-[15px] font-bold text-accent">
          {profile.discreet_mode ? "On" : "Off"}
        </span>
      </button>

      <form
        onSubmit={savePanicPage}
        className="space-y-3 border-b border-line py-4"
      >
        <div>
          <p className="text-[16px] font-bold">Gay Panic Button</p>
          <p className="mt-1 text-[13px] text-muted">
            Página que abre no lugar do Bros. Se ficar vazio, vai para o clima.
          </p>
        </div>
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          value={panicUrl}
          onChange={(event) => {
            setPanicSaved(false);
            setPanicUrl(event.target.value);
          }}
          placeholder="https://www.google.com"
          className={inputClass}
        />
        <button type="submit" className={buttonClass.secondary}>
          Salvar página
        </button>
        {panicSaved ? (
          <p className="text-[13px] text-accent">Página salva neste aparelho.</p>
        ) : null}
      </form>

      <div className="border-b border-line py-4">
        <p className="text-[16px] font-bold">Sem print</p>
        <p className="mt-1 text-[13px] text-muted">
          Print, gravação de tela e salvar foto de outra pessoa são proibidos.
          Se o app detectar print, a conta trava por 24 horas.
        </p>
      </div>

      <section className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Pedidos de foto
        </p>
        {requests.length === 0 ? (
          <p className="py-3 text-[13px] text-muted">Nenhum pedido pendente.</p>
        ) : (
          <ul>
            {requests.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 border-b border-line py-3"
              >
                <span className="text-[15px] font-bold">
                  {item.requester?.alias ?? "Alguém"}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/conta/liberar?viewer=${item.requester_id}`}
                    className="rounded-full bg-accent px-3 py-1 text-[13px] font-bold text-accent-ink"
                  >
                    Liberar
                  </Link>
                  <button
                    type="button"
                    onClick={() => declineRequest(item)}
                    className="text-[13px] font-bold text-muted"
                  >
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Quem já pode ver
        </p>
        {grants.length === 0 ? (
          <p className="py-3 text-[13px] text-muted">Ninguém além de você.</p>
        ) : (
          <ul>
            {grants.map((grant) => (
              <li
                key={grant.viewer_id}
                className="flex items-center justify-between gap-2 border-b border-line py-3"
              >
                <span>
                  <span className="block text-[15px] font-bold">
                    {grant.viewer?.alias ?? "Usuário"}
                  </span>
                  {grant.summary ? (
                    <span className="text-[12px] text-muted">{grant.summary}</span>
                  ) : null}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/conta/liberar?viewer=${grant.viewer_id}`}
                    className="text-[13px] font-bold text-accent"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => revokeGrant(grant.viewer_id)}
                    className="text-[13px] font-bold text-muted"
                  >
                    Revogar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/conta/bloqueados" className={`${buttonClass.ghost} mt-6 w-full`}>
        Ver bloqueados
      </Link>

      <button
        type="button"
        onClick={signOut}
        className={`${buttonClass.danger} mt-8 w-full`}
      >
        Sair
      </button>
    </div>
  );
}
