import { api } from "./api";

export async function getGoogleCalendarStatus() {

  const { data } = await api.get(
    "/google/status"
  );

  return data;
}

export function getGoogleAuthUrl() {

  return `${api.defaults.baseURL}/google/auth`;
}
