import axios from "axios";

import {
  clearAuth,
  getToken,
} from "@/lib/authStorage";

import {
  API_URL,
} from "@/lib/appConfig";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes(
        "/auth/login"
      ) &&
      !error.config?.url?.includes(
        "/auth/register"
      )
    ) {
      clearAuth();

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    return Promise.reject(error);
  }
);
