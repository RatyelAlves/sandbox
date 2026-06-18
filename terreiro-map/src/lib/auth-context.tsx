"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { refreshFromApi } from "@/lib/data-source";

export type AccountType = "usuario" | "terreiro";

type AuthProfileResponse = {
  authenticated: boolean;
  userId?: string;
  email?: string;
  accountType?: AccountType;
  terreiroId?: string | null;
};

interface AuthState {
  accountType: AccountType | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  pendingAccountType: AccountType | null;
  setAccountType: (type: AccountType) => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; accountType?: AccountType }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const PENDING_TYPE_KEY = "terreiro-map-pending-account-type";

function readPendingAccountType(): AccountType | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(PENDING_TYPE_KEY);
  return value === "usuario" || value === "terreiro" ? value : null;
}

function writePendingAccountType(type: AccountType | null) {
  if (typeof window === "undefined") return;
  if (type) sessionStorage.setItem(PENDING_TYPE_KEY, type);
  else sessionStorage.removeItem(PENDING_TYPE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [accountType, setAccountTypeState] = useState<AccountType | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [pendingAccountType, setPendingAccountTypeState] = useState<AccountType | null>(
    null,
  );

  const clearSession = useCallback(() => {
    setAccountTypeState(null);
    setIsLoggedIn(false);
    setUserId(null);
    setEmail(null);
  }, []);

  const applyProfile = useCallback((profile: AuthProfileResponse | null) => {
    if (!profile?.authenticated || !profile.accountType) {
      clearSession();
      return;
    }

    setAccountTypeState(profile.accountType);
    setIsLoggedIn(true);
    setUserId(profile.userId ?? null);
    setEmail(profile.email ?? null);
    writePendingAccountType(null);
    setPendingAccountTypeState(null);
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      clearSession();
      return;
    }

    const profile = (await response.json()) as AuthProfileResponse;
    applyProfile(profile);
    await refreshFromApi();
  }, [applyProfile, clearSession]);

  useEffect(() => {
    setPendingAccountTypeState(readPendingAccountType());

    void (async () => {
      await refreshProfile();
      setIsLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile();
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile, supabase.auth]);

  const setAccountType = (type: AccountType) => {
    writePendingAccountType(type);
    setPendingAccountTypeState(type);
  };

  const login = async (loginEmail: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.trim().toLowerCase(),
        password,
      }),
    });

    const payload = (await response.json()) as AuthProfileResponse & {
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? "E-mail ou senha inválidos.",
      };
    }

    applyProfile(payload);
    await refreshFromApi();

    return {
      ok: true,
      accountType: payload.accountType,
    };
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    clearSession();
    await refreshFromApi();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#D98238]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        accountType,
        isLoggedIn,
        isLoading,
        userId,
        email,
        pendingAccountType,
        setAccountType,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
