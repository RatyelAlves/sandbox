import { api } from "./api";

export async function listClients() {

  const { data } = await api.get(
    "/clients"
  );

  return data;
}
