import { createClient } from "@/lib/supabase/client";

function storageKey(userId: string, fromId: string) {
  return `bros-tap-seen:${userId}:${fromId}`;
}

export function isTapSeenLocal(userId: string, fromId: string) {
  try {
    return Boolean(localStorage.getItem(storageKey(userId, fromId)));
  } catch {
    return false;
  }
}

export function isTapSeen(
  userId: string,
  fromId: string,
  seenAt?: string | null,
) {
  return Boolean(seenAt) || isTapSeenLocal(userId, fromId);
}

export async function markTapSeen(userId: string, fromId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("likes")
    .select("from_id")
    .eq("to_id", userId)
    .eq("from_id", fromId)
    .maybeSingle();
  if (!data) return;

  try {
    localStorage.setItem(storageKey(userId, fromId), new Date().toISOString());
  } catch {
    /* ignore quota / private mode */
  }

  await supabase
    .from("likes")
    .update({ seen_at: new Date().toISOString() })
    .eq("to_id", userId)
    .eq("from_id", fromId);
}
