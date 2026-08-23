"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

function queryFromLocation() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  return {
    type: hash.get("type") ?? search.get("type"),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
  };
}

export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { type, accessToken, refreshToken } = queryFromLocation();
    const supabase = createClient();

    const goRecover = () => {
      if (window.location.pathname !== "/redefinir-senha") {
        router.replace("/redefinir-senha");
      }
    };

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") goRecover();
    });

    if (accessToken && refreshToken) {
      void supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (!error && type === "recovery") goRecover();
        });
    } else if (type === "recovery") {
      void supabase.auth.getSession().then(({ data: session }) => {
        if (session.session) goRecover();
      });
    }

    return () => data.subscription.unsubscribe();
  }, [router]);

  return null;
}
