"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccountType } from "@/lib/auth-context";
import { getNavItems, isNavActive } from "@/lib/navigation";
import { Logo } from "@/components/ui/Logo";
import { ProjectCredits } from "@/components/ui/ProjectCredits";
import { SwitchAccessButton } from "./SwitchAccessButton";

interface SidebarNavProps {
  accountType: AccountType;
}

export function SidebarNav({ accountType }: SidebarNavProps) {
  const pathname = usePathname();
  const items = getNavItems(accountType, true);
  const label = accountType === "usuario" ? "Usuário" : "Terreiro";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-[260px] flex-col overflow-hidden bg-[var(--surface-sidebar)] md:flex">
      <div className="flex flex-col items-center px-6 py-7">
        <Link href={accountType === "usuario" ? "/usuario/home" : "/terreiro/home"}>
          <Logo size="sm" showText />
        </Link>
        <p className="mt-3 w-full text-center text-[11px] font-semibold uppercase tracking-widest text-text-brown">
          Perfil {label}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-4" aria-label="Navegação principal">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-input-orange text-white shadow-sm shadow-input-orange/20"
                  : "text-text-brown/75 hover:bg-surface-elevated/70 hover:text-text-brown"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <img
                src={item.icon}
                alt=""
                width={18}
                height={18}
                className={`h-[18px] w-[18px] shrink-0 object-contain ${active ? "brightness-0 invert" : "opacity-70"}`}
                decoding="async"
                draggable={false}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mb-3 mt-auto rounded-2xl bg-[var(--surface-elevated)] p-3 ring-1 ring-text-brown/10">
        <p className="mb-2 px-2 text-center text-[10px] font-bold uppercase tracking-widest text-text-brown">
          Sessão
        </p>
        <SwitchAccessButton variant="sidebar" accountType={accountType} />
      </div>

      <ProjectCredits className="mb-5 px-4" />
    </aside>
  );
}
