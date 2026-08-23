import { createClient } from "@/lib/supabase/client";

export async function loadBlockedIds(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("blocks").select("blocker_id, blocked_id");
  return new Set(
    (data ?? []).flatMap((row) => {
      if (row.blocker_id === userId) return [row.blocked_id];
      if (row.blocked_id === userId) return [row.blocker_id];
      return [];
    }),
  );
}

export async function blockUser(otherId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("block_user", { other: otherId });
  if (!error) return { error: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entre de novo para bloquear." };

  const { error: insertError } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: otherId,
  });
  if (insertError) {
    return { error: "Rode o SQL supabase/block-chat.sql no Supabase." };
  }
  return { error: null };
}

export async function unblockUser(otherId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entre de novo." };

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", otherId);

  if (error) return { error: "Não foi possível desbloquear." };
  return { error: null };
}
