import { api } from "./api";

export async function login({
  email,
  password,
}) {
  const { data } = await api.post(
    "/auth/login",
    {
      email,
      password,
    }
  );

  return data;
}

export async function register({
  name,
  email,
  password,
}) {
  const { data } = await api.post(
    "/auth/register",
    {
      name,
      email,
      password,
    }
  );

  return data;
}

export async function getMe() {
  const { data } = await api.get(
    "/auth/me"
  );

  return data.user;
}

export async function forgotPassword({
  email,
}) {
  const { data } = await api.post(
    "/auth/forgot-password",
    { email }
  );

  return data;
}

export async function resetPassword({
  token,
  password,
}) {
  const { data } = await api.post(
    "/auth/reset-password",
    { token, password }
  );

  return data;
}
