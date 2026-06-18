"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccountType } from "@/lib/auth-context";
import { getNavItems, isNavActive } from "@/lib/navigation";

interface BottomNavProps {
  accountType: AccountType;
}

function NavIcon({ src, label }: { src: string; label: string }) {
  return (
    <img
      src={src}
      alt=""
      width={26}
      height={26}
      className="h-[26px] w-[26px] shrink-0 object-contain"
      decoding="async"
      draggable={false}
      aria-hidden
      data-nav-icon={label}
    />
  );
}

export function BottomNav({ accountType }: BottomNavProps) {
  const pathname = usePathname();
  const items = getNavItems(accountType);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-text-brown/5 bg-cream px-3 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex w-full max-w-md items-center">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center px-1 py-1.5 transition-opacity ${active ? "opacity-100" : "opacity-55 active:opacity-80"}`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon src={item.icon} label={item.label} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
