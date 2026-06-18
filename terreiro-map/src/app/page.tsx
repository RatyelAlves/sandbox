"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { useAuth } from "@/lib/auth-context";

const SPLASH_DELAY_MS = 2200;

export default function SplashPage() {
  const router = useRouter();
  const { isLoggedIn, accountType } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn && accountType === "usuario") {
        router.replace("/usuario/home");
      } else if (isLoggedIn && accountType === "terreiro") {
        router.replace("/terreiro/home");
      } else {
        router.replace("/primeiro-acesso");
      }
    }, SPLASH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [router, isLoggedIn, accountType]);

  return <SplashScreen />;
}
