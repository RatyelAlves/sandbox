import { api } from "./api";

export async function listProcedures(params = {}) {
  const { data } = await api.get("/procedures", {
    params,
  });
  return data;
}

export async function getProcedure(id) {
  const { data } = await api.get(`/procedures/${id}`);
  return data;
}

export async function createProcedure(payload) {
  const { data } = await api.post("/procedures", payload);
  return data;
}

export async function updateProcedure(id, payload) {
  const { data } = await api.put(`/procedures/${id}`, payload);
  return data;
}

export async function deleteProcedure(id) {
  const { data } = await api.delete(`/procedures/${id}`);
  return data;
}
