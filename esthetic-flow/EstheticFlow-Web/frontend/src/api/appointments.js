import { api } from "./api";

export async function listAppointments(
  params = {}
) {

  const { data } = await api.get(
    "/appointments",
    { params }
  );

  return data;
}

export async function getAppointment(
  id
) {

  const { data } = await api.get(
    `/appointments/${id}`
  );

  return data;
}

export async function createAppointment(
  payload
) {

  const { data } = await api.post(
    "/appointments",
    payload
  );

  return data;
}

export async function updateAppointment(
  id,
  payload
) {

  const { data } = await api.put(
    `/appointments/${id}`,
    payload
  );

  return data;
}

export async function deleteAppointment(
  id
) {

  const { data } = await api.delete(
    `/appointments/${id}`
  );

  return data;
}
