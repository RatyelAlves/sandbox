"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { ChatCamera } from "@/components/chat-camera";
import {
  IconCamera,
  IconClip,
  IconImage,
  IconPin,
  IconTrash,
  IconVideo,
} from "@/components/icons";
import { SignedMedia } from "@/components/signed-media";
import { Alert, buttonClass, inputClass } from "@/components/ui";
import { isGrantNotice, isRevokeNotice } from "@/lib/chat-grant";
import { hideConversation } from "@/lib/chat-hide";
import { markConversationRead } from "@/lib/chat-read";
import {
  loadAccessForViewer,
  revokeAllAccess,
  saveMediaAccess,
} from "@/lib/media-grants";
import { EMPTY_ACCESS, hasAnyAccess } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import {
  isChatImage,
  mapLink,
  mediaUnsendLeft,
  unsendChatMedia,
  uploadChatAttachment,
} from "@/lib/upload-chat";
import type { MediaAccess, Message, Profile } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

type PendingLocation = { lat: number; lng: number };

export function ChatThread({
  conversationId,
  peerId,
}: {
  conversationId?: string;
  peerId?: string;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const galleryPhotoRef = useRef<HTMLInputElement>(null);
  const galleryVideoRef = useRef<HTMLInputElement>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [other, setOther] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<PendingLocation | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Message | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [camera, setCamera] = useState<"photo" | "video" | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [unsending, setUnsending] = useState<string | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokePrompt, setRevokePrompt] = useState(false);
  const [granting, setGranting] = useState(false);
  const [peerAccess, setPeerAccess] = useState<MediaAccess>(EMPTY_ACCESS);
  const [incomingAccess, setIncomingAccess] = useState<MediaAccess>(EMPTY_ACCESS);

  useEffect(() => {
    if (!meId || !other) return;
    const supabase = createClient();
    void Promise.all([
      loadAccessForViewer(supabase, meId, other.id),
      loadAccessForViewer(supabase, other.id, meId),
    ]).then(([mine, theirs]) => {
      setPeerAccess(mine);
      setIncomingAccess(theirs);
    });
  }, [meId, other]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setMeId(user.id);

      let conv = conversationId ?? null;
      let otherUser = peerId ?? null;

      if (peerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", peerId)
          .maybeSingle();
        if (cancelled) return;
        if (!profile) {
          setForbidden(true);
          return;
        }
        setOther(profile as Profile);

        const { data: existing } = await supabase.rpc("conversation_with", {
          other: peerId,
        });
        if (existing) conv = existing as string;
      }

      if (!conv) {
        setActiveId(null);
        setMessages([]);
        return;
      }

      const { data: members } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", conv);

      if (cancelled) return;

      const list = members ?? [];
      const mine = list.some((row) => row.user_id === user.id);
      if (!mine) {
        setForbidden(true);
        return;
      }

      otherUser = list.find((row) => row.user_id !== user.id)?.user_id ?? otherUser;
      if (otherUser && !peerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherUser)
          .maybeSingle();
        if (!cancelled) setOther((profile as Profile | null) ?? null);
      }

      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setActiveId(conv);
      setMessages((rows ?? []) as Message[]);

      for (const existing of supabase.getChannels()) {
        if (existing.topic.includes(`chat:${conv}`)) {
          await supabase.removeChannel(existing);
        }
      }
      if (cancelled) return;

      const next = supabase
        .channel(`chat:${conv}:${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conv}`,
          },
          (payload) => {
            const incoming = payload.new as Message;
            setMessages((current) => {
              if (current.some((item) => item.id === incoming.id)) return current;
              return [...current, incoming];
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conv}`,
          },
          (payload) => {
            const gone = payload.old as { id?: string };
            if (!gone.id) return;
            setMessages((current) => current.filter((item) => item.id !== gone.id));
            setLightbox((open) => (open?.id === gone.id ? null : open));
          },
        );
      channel = next.subscribe();
      if (cancelled) {
        await supabase.removeChannel(next);
        channel = null;
      }
    })();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [conversationId, peerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!meId || forbidden || !activeId) return;
    void markConversationRead(meId, activeId);
  }, [meId, activeId, messages.length, forbidden]);

  const canUnsend = messages.some(
    (message) =>
      message.sender_id === meId &&
      message.attachment_path &&
      mediaUnsendLeft(message.created_at, now) > 0,
  );

  useEffect(() => {
    if (!canUnsend) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [canUnsend]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    event.target.value = "";
    setMenuOpen(false);
    if (!next) return;
    const image = next.type.startsWith("image/");
    const video = next.type.startsWith("video/");
    if (!image && !video) {
      setError("Escolha uma foto ou um vídeo.");
      return;
    }
    if (image && next.size > 8 * 1024 * 1024) {
      setError("A foto precisa ter menos de 8 MB.");
      return;
    }
    if (video && next.size > 30 * 1024 * 1024) {
      setError("O vídeo precisa ter menos de 30 MB.");
      return;
    }
    setError("");
    setLocation(null);
    setFile(next);
  }

  function shareLocation() {
    setMenuOpen(false);
    if (!navigator.geolocation) {
      setError("Este aparelho não manda localização.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setFile(null);
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setError("Não deu para pegar a localização. Libere o GPS no navegador.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function ensureConversation() {
    if (activeId) return activeId;
    if (!peerId) return null;
    const supabase = createClient();
    const { data, error: startError } = await supabase.rpc("start_conversation", {
      other: peerId,
    });
    if (startError || !data) {
      setError(
        "Não foi possível abrir a conversa. Rode o SQL supabase/start-conversation.sql no Supabase.",
      );
      return null;
    }
    setActiveId(data as string);
    return data as string;
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!meId) return;
    const text = body.trim();
    if (!text && !file && !location) return;

    setSending(true);
    setError("");
    const conv = await ensureConversation();
    if (!conv) {
      setSending(false);
      return;
    }

    let attachmentPath: string | null = null;
    if (file) {
      const uploaded = await uploadChatAttachment({
        conversationId: conv,
        userId: meId,
        file,
      });
      if (uploaded.error || !uploaded.path) {
        setSending(false);
        setError(uploaded.error ?? "Não foi possível enviar o anexo.");
        return;
      }
      attachmentPath = uploaded.path;
    }

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv,
        sender_id: meId,
        body: text.slice(0, 2000),
        attachment_path: attachmentPath,
        attachment_name: file?.name ?? null,
        attachment_mime: file?.type ?? null,
        loc_lat: location?.lat ?? null,
        loc_lng: location?.lng ?? null,
        loc_label: location ? "Localização" : null,
      })
      .select("*")
      .single();

    setSending(false);
    if (insertError) {
      setError(
        file || location
          ? "Rode o SQL supabase/chat-attachments.sql e chat-media.sql no Supabase."
          : "Não foi possível enviar.",
      );
      return;
    }
    setBody("");
    setFile(null);
    setLocation(null);
    if (data) {
      setMessages((current) => {
        if (current.some((item) => item.id === data.id)) return current;
        return [...current, data as Message];
      });
      setNow(Date.now());
    }
    if (peerId && conv) {
      router.replace(`/chat/${conv}`);
    }
  }

  async function reloadThread(conversationId: string | null) {
    if (!conversationId) return;
    const supabase = createClient();
    setActiveId(conversationId);
    const { data: rows } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((rows ?? []) as Message[]);
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function grantAllPrivate() {
    if (!meId || !other) return;
    setGranting(true);
    setError("");
    const supabase = createClient();
    const next = { all: true, photoIds: [], albumIds: [] };
    const saved = await saveMediaAccess(supabase, meId, other.id, next);
    setGranting(false);
    if (saved.error) {
      setError(saved.error);
      return;
    }
    setPeerAccess(next);
    await reloadThread(saved.conversationId ?? activeId);
  }

  async function revokeEverything() {
    if (!meId || !other) return;
    setGranting(true);
    setError("");
    const supabase = createClient();
    const saved = await revokeAllAccess(supabase, meId, other.id, activeId);
    setGranting(false);
    if (saved.error) {
      setError(saved.error);
      return;
    }
    setPeerAccess(EMPTY_ACCESS);
    setRevokePrompt(false);
    setGrantOpen(false);
    await reloadThread(saved.conversationId ?? activeId);
  }

  async function unsend(message: Message) {
    setUnsending(message.id);
    setError("");
    const result = await unsendChatMedia(message);
    setUnsending(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setLightbox((open) => (open?.id === message.id ? null : open));
  }

  if (forbidden) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Conversa não encontrada</h1>
        <Link href="/chat" className={buttonClass.secondary}>
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] w-full max-w-3xl flex-col md:h-[calc(100dvh-5.5rem)]">
      <header className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Chat</p>
          <h1 className="font-display text-3xl text-ink">
            {other?.alias ?? "…"}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {other ? (
            <>
              <Link href={`/u/${other.id}`} className={buttonClass.ghost}>
                Ver perfil
              </Link>
              <button
                type="button"
                onClick={() => {
                setRevokePrompt(false);
                setGrantOpen((open) => !open);
              }}
                className={buttonClass.ghost}
              >
                Liberar
              </button>
            </>
          ) : null}
          {meId && activeId ? (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Apagar esta conversa da sua lista?")) return;
                const result = await hideConversation(meId, activeId);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                router.push("/chat");
              }}
              className={buttonClass.ghost}
              aria-label="Apagar conversa"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      {grantOpen ? (
        <div className="mb-3 rounded-2xl bg-bg-elevated p-3">
          <p className="mb-2 text-[13px] font-bold">Fotos nesta conversa</p>
          {hasAnyAccess(peerAccess) ? (
            <button
              type="button"
              disabled={granting}
              onClick={revokeEverything}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[13px] font-bold hover:bg-bg-soft"
            >
              <span>Fotos privadas</span>
              <span className="text-muted">{granting ? "…" : "Revogar"}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={granting}
              onClick={grantAllPrivate}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[13px] font-bold hover:bg-bg-soft"
            >
              <span>Fotos privadas</span>
              <span className="text-accent">{granting ? "…" : "Liberar"}</span>
            </button>
          )}
          {other ? (
            <Link
              href={`/conta/liberar?viewer=${other.id}`}
              className="mt-1 block px-2 py-1 text-[12px] font-bold text-accent"
            >
              Escolher foto por foto
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Digam oi. A conversa só aparece na lista depois da primeira mensagem.
          </p>
        ) : (
          messages.map((message) => {
            if (isGrantNotice(message)) {
              const mine = message.sender_id === meId;
              const stillOpen = mine
                ? hasAnyAccess(peerAccess)
                : hasAnyAccess(incomingAccess);
              const active = stillOpen && !isRevokeNotice(message);
              const noticeClass = cn(
                "max-w-[80%] rounded-[18px] px-3 py-1.5 text-left text-[12px] font-medium",
                mine
                  ? "rounded-br-sm bg-bg-elevated text-muted"
                  : "rounded-bl-sm bg-bg-elevated text-muted",
                active ? "" : "pointer-events-none opacity-50",
              );
              return (
                <div
                  key={message.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  {active && mine ? (
                    <button
                      type="button"
                      onClick={() => {
                        setGrantOpen(false);
                        setRevokePrompt(true);
                      }}
                      className={noticeClass}
                    >
                      {message.body}
                    </button>
                  ) : active ? (
                    <Link href={`/u/${message.sender_id}`} className={noticeClass}>
                      {message.body}
                    </Link>
                  ) : (
                    <p className={noticeClass}>{message.body}</p>
                  )}
                </div>
              );
            }
            const mine = message.sender_id === meId;
            const media = Boolean(message.attachment_path);
            const pin = message.loc_lat != null && message.loc_lng != null;
            const unsendLeft = mine && media ? mediaUnsendLeft(message.created_at, now) : 0;
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] overflow-hidden rounded-lg text-sm",
                    mine
                      ? "rounded-[18px] rounded-br-sm bg-accent text-accent-ink"
                      : "rounded-[18px] rounded-bl-sm bg-bg-soft text-ink",
                    media || pin ? "p-1.5" : "px-3 py-2",
                  )}
                >
                  {message.attachment_path ? (
                    isChatImage(message.attachment_mime, message.attachment_path) ? (
                      <button
                        type="button"
                        onClick={() => setLightbox(message)}
                        className="relative mb-1 block overflow-hidden rounded-xl"
                      >
                        <SignedMedia
                          path={message.attachment_path}
                          mime={message.attachment_mime}
                          alt={message.attachment_name ?? "Foto"}
                          className="max-h-72 w-full object-contain"
                        />
                      </button>
                    ) : (
                      <div className="relative mb-1 overflow-hidden rounded-xl">
                        <SignedMedia
                          path={message.attachment_path}
                          mime={message.attachment_mime}
                          alt={message.attachment_name ?? "Vídeo"}
                          className="max-h-72 w-full"
                        />
                      </div>
                    )
                  ) : null}

                  {pin ? (
                    <a
                      href={mapLink(message.loc_lat as number, message.loc_lng as number)}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "mb-1 flex items-center gap-3 rounded-xl px-3 py-3",
                        mine ? "bg-black/15" : "bg-black/30",
                      )}
                    >
                      <IconPin className="h-6 w-6 shrink-0" />
                      <span>
                        <span className="block text-[14px] font-bold">Localização</span>
                        <span className="text-[12px] opacity-80">Abrir no mapa</span>
                      </span>
                    </a>
                  ) : null}

                  {message.body ? (
                    <p
                      className={cn(
                        "whitespace-pre-wrap break-words",
                        media || pin ? "px-2 py-1" : "",
                      )}
                    >
                      {message.body}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-between gap-3",
                      media || pin ? "px-2 pb-1" : "",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px]",
                        mine ? "text-accent-ink/70" : "text-muted",
                      )}
                    >
                      {formatTime(message.created_at)}
                    </p>
                    {unsendLeft > 0 ? (
                      <button
                        type="button"
                        disabled={unsending === message.id}
                        onClick={() => unsend(message)}
                        className="text-[10px] font-bold text-accent-ink/80 underline-offset-2 hover:underline"
                      >
                        {unsending === message.id
                          ? "Apagando…"
                          : `Apagar ${Math.ceil(unsendLeft / 1000)}s`}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {preview && file ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-bg-elevated p-2">
          {file.type.startsWith("video/") ? (
            <video src={preview} className="h-16 w-16 rounded-xl object-cover" muted />
          ) : (
            <img src={preview} alt="" className="h-16 w-16 rounded-xl object-cover" />
          )}
          <p className="min-w-0 flex-1 truncate text-[13px] font-bold">{file.name}</p>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-[13px] font-bold text-muted"
          >
            Tirar
          </button>
        </div>
      ) : null}

      {location ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-bg-elevated p-3">
          <IconPin className="h-5 w-5 text-accent" />
          <p className="min-w-0 flex-1 text-[13px] font-bold">
            Localização pronta. Confira antes de enviar.
          </p>
          <button
            type="button"
            onClick={() => setLocation(null)}
            className="text-[13px] font-bold text-muted"
          >
            Tirar
          </button>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-bg-elevated p-3">
          <button
            type="button"
            onClick={() => galleryPhotoRef.current?.click()}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold"
          >
            <IconImage className="h-5 w-5 text-accent" />
            Foto da galeria
          </button>
          <button
            type="button"
            onClick={() => galleryVideoRef.current?.click()}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold"
          >
            <IconVideo className="h-5 w-5 text-accent" />
            Vídeo da galeria
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setCamera("photo");
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold"
          >
            <IconCamera className="h-5 w-5 text-accent" />
            Tirar foto
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setCamera("video");
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold"
          >
            <IconVideo className="h-5 w-5 text-accent" />
            Gravar vídeo
          </button>
          <button
            type="button"
            onClick={shareLocation}
            disabled={locating}
            className="col-span-2 flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold"
          >
            <IconPin className="h-5 w-5 text-accent" />
            {locating ? "Pegando localização…" : "Localização"}
          </button>
        </div>
      ) : null}

      <form onSubmit={send} className="mt-4 flex items-center gap-2">
        <input
          ref={galleryPhotoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickFile}
        />
        <input
          ref={galleryVideoRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={pickFile}
        />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-accent"
          aria-label="Anexos"
        >
          <IconClip className="h-5 w-5" />
        </button>
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          placeholder="Escreva sem se expor demais"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={sending || (!body.trim() && !file && !location)}
          className={buttonClass.primary}
        >
          {sending ? "…" : "Enviar"}
        </button>
      </form>

      {camera && typeof document !== "undefined"
        ? createPortal(
            <ChatCamera
              mode={camera}
              onCapture={(next) => {
                setError("");
                setLocation(null);
                setFile(next);
              }}
              onClose={() => setCamera(null)}
              onError={setError}
            />,
            document.body,
          )
        : null}

      {revokePrompt && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-6"
              onClick={() => {
                if (!granting) setRevokePrompt(false);
              }}
            >
              <div
                role="dialog"
                aria-label="Revogar fotos"
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-[220px] rounded-2xl bg-bg-elevated p-4 shadow-lg"
              >
                <p className="mb-3 text-center text-[13px] font-bold">Revogar fotos?</p>
                <button
                  type="button"
                  disabled={granting}
                  onClick={revokeEverything}
                  className={`${buttonClass.secondary} w-full py-2 text-[13px]`}
                >
                  {granting ? "…" : "Revogar"}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {lightbox?.attachment_path && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] bg-black">
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold"
              >
                Fechar
              </button>
              <div className="relative flex h-dvh items-center justify-center p-4">
                <SignedMedia
                  path={lightbox.attachment_path}
                  mime={lightbox.attachment_mime}
                  alt="Anexo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
