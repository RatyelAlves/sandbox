import { api } from "./api";

export async function deleteConversation(
  conversationId
) {

  const { data } = await api.delete(
    `/conversations/${conversationId}`
  );

  return data;
}

export async function forwardMessage(
  messageId,
  targetConversationId
) {

  const { data } = await api.post(
    "/forward-message",
    {
      messageId,
      targetConversationId,
    }
  );

  return data;
}

export async function deleteMessageForEveryone(
  messageId
) {

  const { data } = await api.delete(
    `/messages/${messageId}/for-everyone`
  );

  return data;
}

export async function fetchConversations() {

  const { data } = await api.get(
    "/conversations"
  );

  return data;
}

export async function deleteAllConversations() {

  const { data } = await api.delete(
    "/conversations/all"
  );

  return data;
}

export async function syncOlderMessages(
  conversationId
) {

  const { data } = await api.post(
    `/conversations/${conversationId}/sync-older`
  );

  return data;
}
