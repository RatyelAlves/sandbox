import { createClient } from "@/lib/supabase/client";

function storageKey(userId: string, conversationId: string) {
  return `bros-read:${userId}:${conversationId}`;
}

export function localReadAt(userId: string, conversationId: string) {
  try {
    return localStorage.getItem(storageKey(userId, conversationId));
  } catch {
    return null;
  }
}

export function laterIso(a?: string | null, b?: string | null) {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

export function unreadCount(
  messages: Array<{ conversation_id: string; sender_id: string; created_at: string }>,
  conversationId: string,
  meId: string,
  readAt?: string | null,
) {
  return messages.filter(
    (message) =>
      message.conversation_id === conversationId &&
      message.sender_id !== meId &&
      (!readAt || message.created_at > readAt),
  ).length;
}

export async function markConversationRead(userId: string, conversationId: string) {
  const iso = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(userId, conversationId), iso);
  } catch {
    /* ignore quota / private mode */
  }

  const supabase = createClient();
  await supabase
    .from("conversation_members")
    .update({ last_read_at: iso })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}
