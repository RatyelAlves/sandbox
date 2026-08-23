"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { IconChat, IconCompass, IconUser } from "@/components/icons";
import { NoPrintGuard, PrintLockNotice, usePrintBlock } from "@/components/no-print-guard";
import { PanicButton } from "@/components/panic-button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/descobrir", label: "Explorar", Icon: IconCompass },
  { href: "/chat", label: "Chat", Icon: IconChat },
  { href: "/conta", label: "Perfil", Icon: IconUser },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const configured = isSupabaseConfigured();
  const flush =
    pathname === "/descobrir" ||
    pathname === "/conta" ||
    pathname.startsWith("/u/");

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(row as Profile | null);
    });
  }, [configured]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-sm text-muted">
        Configure o arquivo <code className="text-ink">.env.local</code> com as
        chaves do Supabase e rode o SQL em{" "}
        <code className="text-ink">supabase/schema.sql</code>.
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <NoPrintGuard>
        <AppBody flush={flush} city={profile?.city}>
          {children}
        </AppBody>
      </NoPrintGuard>
    </div>
  );
}

function AppBody({
  children,
  flush,
  city,
}: {
  children: React.ReactNode;
  flush: boolean;
  city?: string;
}) {
  const pathname = usePathname();
  const blockedUntil = usePrintBlock();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/94 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
          <BrandLogo href={blockedUntil ? "/camuflado" : "/descobrir"} />
          {blockedUntil ? null : (
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-wide",
                      active ? "bg-accent text-accent-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    <item.Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
          <PanicButton city={city} />
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-6xl flex-1",
          blockedUntil ? "pb-6" : "pb-20 md:pb-6",
          flush || blockedUntil ? "" : "px-4 py-4 sm:px-5",
        )}
      >
        {blockedUntil ? <PrintLockNotice /> : children}
      </main>

      {blockedUntil ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-black/94 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-3">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wide",
                      active ? "text-accent" : "text-muted",
                    )}
                  >
                    <item.Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
