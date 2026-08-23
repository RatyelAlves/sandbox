"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  clearLocalPrintBlock,
  formatBlockRemaining,
  isLocalHost,
  isScreenshotGesture,
  laterIso,
  laterOf,
  readLocalPrintBlock,
  writeLocalPrintBlock,
} from "@/lib/screenshot-block";

const NoPrintContext = createContext<{ blockedUntil: string | null }>({
  blockedUntil: null,
});

export function usePrintBlock() {
  return useContext(NoPrintContext).blockedUntil;
}

export function NoPrintGuard({ children }: { children: React.ReactNode }) {
  const [cloaked, setCloaked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isLocalHost()) {
      clearLocalPrintBlock();
      setBlockedUntil(null);
    } else {
      setBlockedUntil(readLocalPrintBlock());
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: ban } = await supabase
        .from("screenshot_blocks")
        .select("blocked_until")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (isLocalHost()) {
        setBlockedUntil(null);
        return;
      }
      const remote = (ban as { blocked_until?: string } | null)?.blocked_until ?? null;
      const until = laterOf(readLocalPrintBlock(), remote);
      if (until && new Date(until).getTime() > Date.now()) {
        writeLocalPrintBlock(until);
        setBlockedUntil(until);
      }
    });
  }, []);

  useEffect(() => {
    let hideTimer = 0;
    let locking = false;

    function cloak(ms = 2500) {
      setCloaked(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setCloaked(false), ms);
    }

    async function banForPrint() {
      cloak(5000);
      if (isLocalHost()) return;
      if (locking) return;
      locking = true;
      const fallback = laterOf(readLocalPrintBlock(), laterIso());
      if (fallback) {
        writeLocalPrintBlock(fallback);
        setBlockedUntil(fallback);
      }
      const supabase = createClient();
      const { data } = await supabase.rpc("report_screenshot_attempt");
      const remote = typeof data === "string" ? data : null;
      const until = laterOf(fallback, remote);
      if (until) {
        writeLocalPrintBlock(until);
        setBlockedUntil(until);
      }
      locking = false;
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        setCloaked(true);
        return;
      }
      cloak(900);
    }

    function onKey(event: KeyboardEvent) {
      if (!isScreenshotGesture(event)) return;
      event.preventDefault();
      void banForPrint();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);

    return () => {
      window.clearTimeout(hideTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("no-print-active", cloaked);
    return () => document.documentElement.classList.remove("no-print-active");
  }, [cloaked]);

  useEffect(() => {
    if (!blockedUntil) return;
    const timer = window.setInterval(() => {
      if (new Date(blockedUntil).getTime() <= Date.now()) {
        setBlockedUntil(null);
        return;
      }
      setNow(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [blockedUntil]);

  const activeBlock =
    blockedUntil && new Date(blockedUntil).getTime() > now ? blockedUntil : null;

  return (
    <NoPrintContext.Provider value={{ blockedUntil: activeBlock }}>
      {children}
    </NoPrintContext.Provider>
  );
}

export function PrintLockNotice() {
  const blockedUntil = usePrintBlock();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!blockedUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [blockedUntil]);

  if (!blockedUntil || new Date(blockedUntil).getTime() <= now) return null;
  const remaining = formatBlockRemaining(blockedUntil);

  return (
    <div className="px-5 py-10 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
        Conta bloqueada
      </p>
      <h1 className="mt-2 text-[26px] font-bold tracking-tight">
        Tentativa de print
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Tirar print é proibido. Você fica fora por 24 horas.
      </p>
      <p className="mt-6 text-[16px] font-bold text-ink">
        Volta em {remaining ?? "instantes"}
      </p>
    </div>
  );
}

