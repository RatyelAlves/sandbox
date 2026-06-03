import { api } from "./api";

export async function listUsers() {
  const { data } = await api.get("/users");
  return data.users;
}

export async function createUser(payload) {
  const { data } = await api.post(
    "/users",
    payload
  );

  return data.user;
}

export async function getPendingUsersCount() {
  const { data } = await api.get(
    "/users/pending-count"
  );

  return data.count;
}

export async function approveUser(userId) {
  const { data } = await api.patch(
    `/users/${userId}/approve`
  );

  return data.user;
}

export async function updateUser(
  userId,
  payload
) {
  const { data } = await api.put(
    `/users/${userId}`,
    payload
  );

  return data.user;
}

export async function deleteUser(
  userId
) {
  const { data } = await api.delete(
    `/users/${userId}`
  );

  return data;
}

export async function toggleUserActive(
  userId,
  active
) {
  const { data } = await api.patch(
    `/users/${userId}/active`,
    { active }
  );

  return data.user;
}
