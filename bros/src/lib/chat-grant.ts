import { createClient } from "@/lib/supabase/client";
import type { MediaAccess, Message } from "@/lib/types";

export function isGrantNotice(message: Message) {
  const body = message.body ?? "";
  return (
    message.kind === "grant" ||
    message.loc_label === "grant" ||
    body.startsWith("Liberou ") ||
    body.startsWith("Fechou ") ||
    body.startsWith("Fotos ") ||
    body === "Acesso revogado"
  );
}

export function isRevokeNotice(message: Message) {
  const body = message.body ?? "";
  return (
    body.startsWith("Fechou ") ||
    body.includes("fechadas") ||
    body === "Acesso revogado"
  );
}

export function grantNoticeText(previous: MediaAccess, next: MediaAccess) {
  if (next.all) return "Fotos privadas liberadas";
  if (next.photoIds.some((id) => !previous.photoIds.includes(id))) {
    return "Fotos liberadas";
  }
  if (next.photoIds.length) return "Fotos liberadas";
  return null;
}

export async function notifyAlbumGrant(
  viewerId: string,
  text: string,
  conversationId?: string | null,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entre de novo.", conversationId: null };

  const notice = text.trim().slice(0, 2000);
  if (!notice) return { error: "Aviso vazio.", conversationId: conversationId ?? null };

  let conv =
    conversationId ??
    ((await supabase.rpc("start_conversation", { other: viewerId })).data as
      | string
      | null) ??
    ((await supabase.rpc("conversation_with", { other: viewerId })).data as
      | string
      | null) ??
    null;

  if (!conv) {
    return {
      error:
        "Não foi possível avisar no chat. Cole supabase/chat-grant.sql no SQL Editor do Supabase.",
      conversationId: null,
    };
  }

  const { data: last } = await supabase
    .from("messages")
    .select("body, created_at, sender_id, kind, loc_label")
    .eq("conversation_id", conv)
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last && isGrantNotice(last as Message)) {
    const fresh =
      Date.now() - new Date(last.created_at).getTime() < 15_000;
    const lastRevoke = isRevokeNotice(last as Message);
    const thisRevoke =
      notice === "Acesso revogado" ||
      notice.includes("fechadas") ||
      notice.startsWith("Fechou ");
    if (fresh && lastRevoke === thisRevoke) {
      return { error: null, conversationId: conv };
    }
  }

  const inserted = await supabase
    .from("messages")
    .insert({
      conversation_id: conv,
      sender_id: user.id,
      body: notice,
    })
    .select("*")
    .single();

  if (inserted.error) {
    return {
      error:
        "Não foi possível gravar o aviso no chat. Cole supabase/chat-grant.sql no SQL Editor do Supabase.",
      conversationId: conv,
    };
  }

  return { error: null, conversationId: conv };
}
