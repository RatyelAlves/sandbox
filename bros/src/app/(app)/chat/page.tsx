"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { IconTrash } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { hideConversation } from "@/lib/chat-hide";
import { laterIso, localReadAt, unreadCount } from "@/lib/chat-read";
import { isTapSeen, markTapSeen } from "@/lib/tap-seen";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/types";
import { isGrantNotice } from "@/lib/chat-grant";
import { isChatVideo } from "@/lib/upload-chat";
import { cn, formatDay, formatTime } from "@/lib/utils";

function lastPreview(message?: Message) {
  if (!message) return "Conversa nova. Diga algo.";
  if (isGrantNotice(message)) return message.body || "Fotos liberadas";
  if (message.body) return message.body;
  if (message.loc_lat != null) return "Localização";
  if (isChatVideo(message.attachment_mime, message.attachment_path)) return "Vídeo";
  if (message.attachment_path) return "Foto";
  return "Conversa nova. Diga algo.";
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-accent-ink">
      {count > 99 ? "99+" : count}
    </span>
  );
}

type InboxItem = {
  conversationId: string;
  other: Profile;
  last?: Message;
  unread: number;
};

type TapItem = {
  fromId: string;
  alias: string;
  createdAt: string;
  tappedBack: boolean;
  seen: boolean;
};

type Tab = "conversas" | "taps";

export default function ChatInboxPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("conversas");
  const [meId, setMeId] = useState<string | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [taps, setTaps] = useState<TapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMeId(user.id);

    const { data: mine, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at, hidden_at")
      .eq("user_id", user.id);

    const memberships = (
      memberError
        ? ((
            await supabase
              .from("conversation_members")
              .select("conversation_id")
              .eq("user_id", user.id)
          ).data ?? []
          ).map((row) => ({
            conversation_id: row.conversation_id,
            last_read_at: null,
            hidden_at: null,
          }))
        : (mine ?? [])
    ).filter((row) => !row.hidden_at);

    const conversationIds = memberships.map((row) => row.conversation_id);
    const readByConv = new Map(
      memberships.map((row) => [
        row.conversation_id,
        laterIso(row.last_read_at, localReadAt(user.id, row.conversation_id)),
      ]),
    );

    const likesQuery = await supabase
      .from("likes")
      .select("from_id, created_at, seen_at")
      .eq("to_id", user.id)
      .order("created_at", { ascending: false });
    const incomingLikes = likesQuery.error
      ? ((
          await supabase
            .from("likes")
            .select("from_id, created_at")
            .eq("to_id", user.id)
            .order("created_at", { ascending: false })
        ).data ?? []
        ).map((row) => ({ ...row, seen_at: null }))
      : (likesQuery.data ?? []);

    const [
      { data: members },
      { data: outgoingLikes },
      { data: blocked },
    ] = await Promise.all([
      conversationIds.length
        ? supabase
            .from("conversation_members")
            .select("conversation_id, user_id")
            .in("conversation_id", conversationIds)
        : Promise.resolve({ data: [] }),
      supabase.from("likes").select("to_id").eq("from_id", user.id),
      supabase.from("blocks").select("blocker_id, blocked_id"),
    ]);

    const blockedIds = new Set(
      (blocked ?? []).flatMap((row) => {
        if (row.blocker_id === user.id) return [row.blocked_id];
        if (row.blocked_id === user.id) return [row.blocker_id];
        return [];
      }),
    );

    const others = (members ?? []).filter((row) => row.user_id !== user.id);
    const tapIds = incomingLikes
      .map((row) => row.from_id)
      .filter((id) => !blockedIds.has(id));
    const otherIds = [...new Set([...others.map((row) => row.user_id), ...tapIds])];

    const [{ data: profiles }, { data: messages }] = await Promise.all([
      otherIds.length
        ? supabase.from("profiles").select("*").in("id", otherIds)
        : Promise.resolve({ data: [] }),
      conversationIds.length
        ? supabase
            .from("messages")
            .select("*")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false })
            .limit(400)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map(
      ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
    );
    const lastByConv = new Map<string, Message>();
    for (const message of (messages ?? []) as Message[]) {
      if (!lastByConv.has(message.conversation_id)) {
        lastByConv.set(message.conversation_id, message);
      }
    }

    const next: InboxItem[] = [];
    for (const row of others) {
      if (blockedIds.has(row.user_id)) continue;
      const other = profileMap.get(row.user_id);
      if (!other) continue;
      const last = lastByConv.get(row.conversation_id);
      if (!last) continue;
      next.push({
        conversationId: row.conversation_id,
        other,
        last,
        unread: unreadCount(
          (messages ?? []) as Message[],
          row.conversation_id,
          user.id,
          readByConv.get(row.conversation_id),
        ),
      });
    }

    next.sort((a, b) => {
      const aTime = a.last?.created_at ?? "";
      const bTime = b.last?.created_at ?? "";
      return bTime.localeCompare(aTime);
    });

    const outgoing = new Set((outgoingLikes ?? []).map((row) => row.to_id));
    const nextTaps: TapItem[] = [];
    for (const like of incomingLikes) {
      if (blockedIds.has(like.from_id)) continue;
      const profile = profileMap.get(like.from_id);
      if (!profile) continue;
      nextTaps.push({
        fromId: like.from_id,
        alias: profile.alias,
        createdAt: like.created_at,
        tappedBack: outgoing.has(like.from_id),
        seen: isTapSeen(user.id, like.from_id, like.seen_at),
      });
    }

    setItems(next);
    setTaps(nextTaps);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function tapBack(fromId: string) {
    if (!meId) return;
    setBusyId(fromId);
    const supabase = createClient();
    const { error } = await supabase.from("likes").insert({
      from_id: meId,
      to_id: fromId,
    });
    setBusyId(null);
    if (error) return;
    setTaps((current) =>
      current.map((item) =>
        item.fromId === fromId ? { ...item, tappedBack: true } : item,
      ),
    );
  }

  async function openChat(otherId: string) {
    router.push(`/chat/com/${otherId}`);
  }

  async function removeConversation(conversationId: string) {
    if (!meId) return;
    if (!window.confirm("Apagar esta conversa da sua lista?")) return;
    setBusyId(conversationId);
    const result = await hideConversation(meId, conversationId);
    setBusyId(null);
    if (result.error) return;
    setItems((current) => current.filter((item) => item.conversationId !== conversationId));
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-3 px-1 text-[22px] font-bold">Chat</h1>

      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-bg-elevated p-1">
        <TabButton
          active={tab === "conversas"}
          onClick={() => setTab("conversas")}
        >
          Conversas
        </TabButton>
        <TabButton active={tab === "taps"} onClick={() => setTab("taps")}>
          Taps
          <UnreadBadge count={taps.filter((item) => !item.seen).length} />
        </TabButton>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted">Carregando…</p>
      ) : tab === "conversas" ? (
        items.length === 0 ? (
          <p className="px-1 py-6 text-[13px] text-muted">
            Nenhuma conversa ainda. Dê um Tap ou escreva para alguém.
          </p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.conversationId} className="flex items-center gap-1">
                <Link
                  href={`/chat/${item.conversationId}`}
                  className="flex h-[72px] min-w-0 flex-1 items-center justify-between gap-3 px-1 transition hover:bg-bg-elevated"
                >
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-bg-soft text-sm font-bold">
                    {item.other.alias.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-ink">
                      {item.other.alias}
                    </p>
                    <p
                      className={cn(
                        "truncate text-[13px]",
                        item.unread ? "font-bold text-ink" : "text-muted",
                      )}
                    >
                      {lastPreview(item.last)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {item.last ? (
                      <p className="text-[12px] text-muted">
                        {formatDay(item.last.created_at)} {formatTime(item.last.created_at)}
                      </p>
                    ) : null}
                    <UnreadBadge count={item.unread} />
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={busyId === item.conversationId}
                  onClick={() => removeConversation(item.conversationId)}
                  className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg-elevated hover:text-danger"
                  aria-label={`Apagar conversa com ${item.other.alias}`}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : taps.length === 0 ? (
        <p className="px-1 py-6 text-[13px] text-muted">
          Ninguém deu Tap ainda. Quando alguém demonstrar interesse, aparece aqui.
        </p>
      ) : (
        <ul>
          {taps.map((item) => (
            <li
              key={item.fromId}
              className="flex items-center justify-between gap-3 border-b border-line px-1 py-3"
            >
              <Link
                href={`/u/${item.fromId}`}
                onClick={() => {
                  if (!meId) return;
                  void markTapSeen(meId, item.fromId);
                  setTaps((current) =>
                    current.map((tap) =>
                      tap.fromId === item.fromId ? { ...tap, seen: true } : tap,
                    ),
                  );
                }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-bg-soft text-sm font-bold">
                  {item.alias.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={cn("truncate text-[16px] font-bold", item.seen && "text-muted")}>
                    {item.alias}
                  </p>
                  <p className="truncate text-[13px] text-muted">
                    Deu um Tap · {formatDay(item.createdAt)} {formatTime(item.createdAt)}
                  </p>
                </div>
              </Link>
              <div className="flex shrink-0 gap-2">
                {item.tappedBack ? (
                  <span className="rounded-full border border-line px-3 py-2 text-[12px] font-bold text-muted">
                    Tap dado
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === item.fromId}
                    onClick={() => tapBack(item.fromId)}
                    className={buttonClass.secondary + " !px-3 !py-2 text-[12px]"}
                  >
                    Tap
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === item.fromId}
                  onClick={() => openChat(item.fromId)}
                  className={buttonClass.primary + " !px-3 !py-2 text-[12px]"}
                >
                  Chat
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full py-2 text-[13px] font-bold",
        active ? "bg-accent text-accent-ink" : "text-muted",
      )}
    >
      {children}
    </button>
  );
}
