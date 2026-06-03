import { api } from "./api";

export async function listQuickReplies(params = {}) {
  const { data } = await api.get("/quick-replies", {
    params,
  });
  return data;
}

export async function createQuickReply(payload) {
  const { data } = await api.post("/quick-replies", payload);
  return data;
}

export async function updateQuickReply(id, payload) {
  const { data } = await api.put(`/quick-replies/${id}`, payload);
  return data;
}

export async function deleteQuickReply(id) {
  const { data } = await api.delete(`/quick-replies/${id}`);
  return data;
}
