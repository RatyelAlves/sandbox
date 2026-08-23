import { createClient } from "@/lib/supabase/client";

export async function hideConversation(userId: string, conversationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("conversation_members")
    .update({ hidden_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    return { error: "Rode o SQL supabase/chat-hide.sql no Supabase." };
  }
  return { error: null };
}
