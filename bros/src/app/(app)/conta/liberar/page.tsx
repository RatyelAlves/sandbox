"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BackBar } from "@/components/back-bar";
import { SignedImage } from "@/components/signed-image";
import { Alert, buttonClass } from "@/components/ui";
import {
  loadAccessForViewer,
  revokeAllAccess,
  saveMediaAccess,
} from "@/lib/media-grants";
import { EMPTY_ACCESS, hasAnyAccess, profilePhotos } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { MediaAccess, Photo, Profile } from "@/lib/types";

type Candidate = {
  id: string;
  alias: string;
  reason: string;
};

function LiberarPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const viewerId = search.get("viewer");
  const prePhoto = search.get("photo");

  const [meId, setMeId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [viewer, setViewer] = useState<{ id: string; alias: string } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [access, setAccess] = useState<MediaAccess>(EMPTY_ACCESS);
  const [savedAccess, setSavedAccess] = useState<MediaAccess>(EMPTY_ACCESS);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMeId(user.id);

    const { data: photoRows } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    setPhotos((photoRows ?? []) as Photo[]);

    if (viewerId) {
      const [{ data: profile }, current] = await Promise.all([
        supabase.from("profiles").select("id, alias").eq("id", viewerId).maybeSingle(),
        loadAccessForViewer(supabase, user.id, viewerId),
      ]);
      setViewer((profile as { id: string; alias: string } | null) ?? {
        id: viewerId,
        alias: "Usuário",
      });
      const next = {
        all: current.all,
        photoIds: [...current.photoIds],
        albumIds: [] as string[],
      };
      if (!next.all) {
        for (const photo of (photoRows ?? []) as Photo[]) {
          if (
            photo.album_id &&
            current.albumIds.includes(photo.album_id) &&
            !next.photoIds.includes(photo.id)
          ) {
            next.photoIds.push(photo.id);
          }
        }
      }
      if (!next.all && prePhoto && !next.photoIds.includes(prePhoto)) {
        next.photoIds.push(prePhoto);
      }
      setSavedAccess(current);
      setAccess(next);
      setLoading(false);
      return;
    }

    const [{ data: mine, error: memberError }, { data: blocked }] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id, hidden_at")
        .eq("user_id", user.id),
      supabase.from("blocks").select("blocker_id, blocked_id"),
    ]);

    const memberships = (
      memberError
        ? ((
            await supabase
              .from("conversation_members")
              .select("conversation_id")
              .eq("user_id", user.id)
          ).data ?? []
          ).map((row) => ({ conversation_id: row.conversation_id, hidden_at: null }))
        : (mine ?? [])
    ).filter((row) => !row.hidden_at);

    const conversationIds = memberships.map((row) => row.conversation_id);
    const [{ data: members }, { data: messageRows }] = await Promise.all([
      conversationIds.length
        ? supabase
            .from("conversation_members")
            .select("conversation_id, user_id")
            .in("conversation_id", conversationIds)
        : Promise.resolve({ data: [] }),
      conversationIds.length
        ? supabase
            .from("messages")
            .select("conversation_id")
            .in("conversation_id", conversationIds)
        : Promise.resolve({ data: [] }),
    ]);

    const withMessages = new Set(
      (messageRows ?? []).map((row) => row.conversation_id),
    );
    const blockedIds = new Set(
      (blocked ?? []).flatMap((row) => {
        if (row.blocker_id === user.id) return [row.blocked_id];
        if (row.blocked_id === user.id) return [row.blocker_id];
        return [];
      }),
    );

    const ids = [
      ...new Set(
        (members ?? [])
          .filter(
            (row) =>
              row.user_id !== user.id &&
              withMessages.has(row.conversation_id) &&
              !blockedIds.has(row.user_id),
          )
          .map((row) => row.user_id),
      ),
    ];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, alias").in("id", ids)
      : { data: [] };
    const map = new Map(
      ((profiles ?? []) as Array<{ id: string; alias: string }>).map((item) => [
        item.id,
        item.alias,
      ]),
    );

    setCandidates(
      ids.map((id) => ({
        id,
        alias: map.get(id) ?? "Usuário",
        reason: "Chat",
      })),
    );
    setLoading(false);
  }, [prePhoto, viewerId]);

  useEffect(() => {
    load();
  }, [load]);

  const grid = useMemo(() => profilePhotos(photos), [photos]);

  function pickerHref(id: string) {
    const params = new URLSearchParams({ viewer: id });
    if (prePhoto) params.set("photo", prePhoto);
    return `/conta/liberar?${params.toString()}`;
  }

  function toggleAll() {
    setSaved(false);
    setAccess((current) =>
      current.all
        ? { all: false, photoIds: [], albumIds: [] }
        : { all: true, photoIds: [], albumIds: [] },
    );
  }

  function togglePhoto(id: string) {
    setSaved(false);
    setAccess((current) => {
      if (current.all) return current;
      const on = current.photoIds.includes(id);
      return {
        ...current,
        photoIds: on
          ? current.photoIds.filter((item) => item !== id)
          : [...current.photoIds, id],
      };
    });
  }

  async function save() {
    if (!meId || !viewer) return;
    setBusy(true);
    setError("");
    setSaved(false);
    const supabase = createClient();
    const result = await saveMediaAccess(supabase, meId, viewer.id, access);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSavedAccess(access);
    setSaved(true);
  }

  if (loading) {
    return <p className="text-[13px] text-muted">Carregando…</p>;
  }

  if (!viewerId) {
    return (
      <div>
        <BackBar href="/conta" title="Liberar fotos" />
        <p className="mb-4 text-[13px] text-muted">
          Só quem ainda está no seu Chat. Escolha para quem liberar as fotos.
        </p>
        {candidates.length === 0 ? (
          <p className="text-[13px] text-muted">
            Só aparece quem ainda tem conversa com você. Mande ou receba uma
            mensagem primeiro.
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {candidates.map((person) => (
              <li key={person.id}>
                <Link
                  href={pickerHref(person.id)}
                  className="flex items-center justify-between py-3.5"
                >
                  <span className="text-[16px] font-bold">{person.alias}</span>
                  <span className="text-[13px] text-muted">{person.reason}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <BackBar href="/conta/liberar" title="Liberar fotos" />
      <p className="mb-4 text-[15px] font-bold">
        Para {viewer?.alias ?? "usuário"}
      </p>
      <p className="mb-4 text-[13px] text-muted">
        Marque uma foto ou tudo que está privado.
      </p>
      {error ? <Alert>{error}</Alert> : null}
      {saved ? (
        <Alert tone="ok">
          Liberação salva.{" "}
          {viewer ? (
            <Link href={`/chat/com/${viewer.id}`} className="underline">
              Abrir o chat com {viewer.alias}
            </Link>
          ) : (
            "Abra o chat para ver o aviso."
          )}
        </Alert>
      ) : null}

      <button
        type="button"
        onClick={toggleAll}
        className="mb-6 flex w-full items-center justify-between border-b border-line py-4 text-left"
      >
        <span>
          <span className="block text-[16px] font-bold">Tudo privado</span>
          <span className="text-[13px] text-muted">
            Inclui fotos privadas e o rosto, se o modo discreto estiver ligado.
          </span>
        </span>
        <span className="text-[15px] font-bold text-accent">
          {access.all ? "On" : "Off"}
        </span>
      </button>

      {grid.length ? (
        <section className="mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            Fotos do perfil
          </p>
          <div className="grid grid-cols-3 gap-0.5">
            {grid.map((photo) => {
              const on = access.all || access.photoIds.includes(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  disabled={access.all}
                  onClick={() => togglePhoto(photo.id)}
                  className="relative aspect-square disabled:opacity-50"
                >
                  <SignedImage
                    path={photo.path}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute inset-x-0 bottom-0 px-1 py-1 text-[10px] font-bold ${
                      on ? "bg-accent text-accent-ink" : "bg-black/70 text-white"
                    }`}
                  >
                    {on ? "Liberada" : "Fechada"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={buttonClass.primary}
        >
          {busy ? "Salvando…" : "Salvar liberação"}
        </button>
        {hasAnyAccess(savedAccess) ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!meId || !viewer) return;
              setBusy(true);
              setError("");
              const supabase = createClient();
              const result = await revokeAllAccess(supabase, meId, viewer.id);
              setBusy(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              setAccess(EMPTY_ACCESS);
              setSavedAccess(EMPTY_ACCESS);
              setSaved(true);
            }}
            className={buttonClass.ghost}
          >
            Revogar tudo
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => router.push("/conta")}
          className={buttonClass.ghost}
        >
          Voltar à conta
        </button>
      </div>
    </div>
  );
}

export default function LiberarPage() {
  return (
    <Suspense fallback={<p className="text-[13px] text-muted">Carregando…</p>}>
      <LiberarPageInner />
    </Suspense>
  );
}
