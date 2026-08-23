"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PublicProfileView } from "@/components/public-profile-view";
import { Alert, buttonClass, inputClass } from "@/components/ui";
import { loadAccessForViewer } from "@/lib/media-grants";
import { EMPTY_ACCESS, hasAnyAccess } from "@/lib/photos";
import { blockUser as persistBlock, unblockUser } from "@/lib/blocks";
import { markTapSeen } from "@/lib/tap-seen";
import { createClient } from "@/lib/supabase/client";
import type { MediaAccess, Photo, PhotoRequest, Profile } from "@/lib/types";

export default function PerfilPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [meId, setMeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [access, setAccess] = useState<MediaAccess>(EMPTY_ACCESS);
  const [request, setRequest] = useState<PhotoRequest | null>(null);
  const [liked, setLiked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMeId(user.id);

    if (user.id === id) {
      router.replace("/conta");
      return;
    }

    const [{ data: row }, { data: myBlock }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", id)
        .maybeSingle(),
    ]);

    const iBlocked = Boolean(myBlock);
    setBlockedByMe(iBlocked);

    if (!row) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(row as Profile);

    const [{ data: photoRows }, mediaAccess, { data: req }, { data: myLike }] =
      await Promise.all([
        supabase.from("photos").select("*").eq("user_id", id).order("created_at"),
        loadAccessForViewer(supabase, id, user.id),
        supabase
          .from("photo_requests")
          .select("*")
          .eq("owner_id", id)
          .eq("requester_id", user.id)
          .maybeSingle(),
        supabase
          .from("likes")
          .select("*")
          .eq("from_id", user.id)
          .eq("to_id", id)
          .maybeSingle(),
      ]);

    setPhotos((photoRows ?? []) as Photo[]);
    setAccess(mediaAccess);
    setRequest((req as PhotoRequest | null) ?? null);
    setLiked(Boolean(myLike));
    setLoading(false);
    if (!iBlocked) void markTapSeen(user.id, id);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function startChat() {
    router.push(`/chat/com/${id}`);
  }

  async function sendLike() {
    if (!meId) return;
    setError("");
    const supabase = createClient();
    const { error: likeError } = await supabase.from("likes").insert({
      from_id: meId,
      to_id: id,
    });
    if (likeError) {
      setError("Não foi possível enviar o interesse.");
      return;
    }
    await load();
  }

  async function requestPhotos() {
    if (!meId) return;
    setError("");
    const supabase = createClient();
    const { error: reqError } = await supabase.from("photo_requests").insert({
      owner_id: id,
      requester_id: meId,
      status: "pending",
    });
    if (reqError) {
      setError("Não foi possível pedir as fotos.");
      return;
    }
    setMessage("Pedido enviado. Ele decide se libera.");
    await load();
  }

  async function blockUser() {
    if (!meId) return;
    if (!window.confirm("Bloquear e apagar a conversa para os dois?")) return;
    setBlocking(true);
    setError("");
    const result = await persistBlock(id);
    setBlocking(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBlockedByMe(true);
    router.push("/descobrir");
  }

  async function undoBlock() {
    setBlocking(true);
    setError("");
    const result = await unblockUser(id);
    setBlocking(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!meId) return;
    const supabase = createClient();
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_id: meId,
      reported_id: id,
      reason: reportReason.trim(),
    });
    if (reportError) {
      setError("Não foi possível enviar a denúncia.");
      return;
    }
    setReportOpen(false);
    setReportReason("");
    setMessage("Denúncia enviada.");
  }

  if (loading) {
    return <p className="text-sm text-muted">Carregando…</p>;
  }

  if (!profile && !blockedByMe) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Perfil indisponível</h1>
        <p className="text-sm text-muted">
          Ele pode ter bloqueado você ou a conta não existe.
        </p>
        <Link href="/descobrir" className={buttonClass.secondary}>
          Voltar
        </Link>
      </div>
    );
  }

  if (blockedByMe) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-1 py-8">
        <h1 className="font-display text-3xl">{profile?.alias ?? "Perfil"}</h1>
        {error ? <Alert>{error}</Alert> : null}
        <p className="text-sm text-muted">
          Você bloqueou este perfil. Ele não aparece no Explorar e a conversa foi apagada.
        </p>
        <button
          type="button"
          disabled={blocking}
          onClick={undoBlock}
          className={buttonClass.secondary}
        >
          {blocking ? "Desbloqueando…" : "Desbloquear"}
        </button>
        <Link href="/descobrir" className={`${buttonClass.ghost} block`}>
          Voltar
        </Link>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="pb-4">
      <PublicProfileView
        profile={profile}
        photos={photos}
        viewerId={meId}
        access={access}
        footer={
          <aside className="space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            {message ? <Alert tone="ok">{message}</Alert> : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={startChat}
                className={buttonClass.primary}
              >
                Conversar
              </button>

              {liked ? (
                <p className="rounded-full border border-muted px-6 py-3 text-center text-[15px] font-bold text-ink">
                  Interesse enviado
                </p>
              ) : (
                <button type="button" onClick={sendLike} className={buttonClass.secondary}>
                  Tap
                </button>
              )}

              {access.all ? (
                <p className="text-sm text-accent">Ele liberou as fotos privadas para você.</p>
              ) : hasAnyAccess(access) ? (
                <p className="text-sm text-accent">Ele liberou algumas fotos para você.</p>
              ) : request?.status === "pending" ? (
                <p className="text-sm text-muted">Pedido de fotos enviado.</p>
              ) : request?.status === "declined" ? (
                <p className="text-sm text-muted">Pedido de fotos recusado.</p>
              ) : (
                <button type="button" onClick={requestPhotos} className={buttonClass.secondary}>
                  Pedir fotos privadas
                </button>
              )}

              <Link href={`/conta/liberar?viewer=${id}`} className={buttonClass.ghost}>
                Liberar minhas fotos para ele
              </Link>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                disabled={blocking}
                onClick={blockUser}
                className={buttonClass.danger}
              >
                {blocking ? "Bloqueando…" : "Bloquear"}
              </button>
              <button
                type="button"
                onClick={() => setReportOpen((open) => !open)}
                className={buttonClass.ghost}
              >
                Denunciar
              </button>
            </div>

            {reportOpen ? (
              <form onSubmit={submitReport} className="space-y-3">
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="O que aconteceu?"
                  className={`${inputClass} min-h-24 resize-none`}
                />
                <button type="submit" className={buttonClass.secondary}>
                  Enviar denúncia
                </button>
              </form>
            ) : null}
          </aside>
        }
      />
    </div>
  );
}
