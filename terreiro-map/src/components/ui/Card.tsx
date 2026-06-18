import Link from "next/link";
import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = "", title }: CardProps) {
  return (
    <div
      className={`flex flex-col rounded-[1.75rem] bg-surface-card px-5 py-6 shadow-[0_4px_24px_rgba(62,52,46,0.1)] ring-1 ring-[color:var(--input-border)] md:rounded-3xl md:px-8 md:py-8 ${className}`}
    >
      {title && (
        <h1 className="mb-5 shrink-0 text-center text-xl font-bold text-text-brown md:mb-6 md:text-2xl">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
}

export function AuthCardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-xl font-bold tracking-tight text-text-brown">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-text-brown/55">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** Painel unificado para telas desktop logadas */
export function DesktopPanel({
  children,
  title,
  subtitle,
  backHref,
  className = "",
  centered = false,
  scrollable = false,
  surface = "card",
  fillHeight = false,
  expandable = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  className?: string;
  centered?: boolean;
  scrollable?: boolean;
  surface?: "card" | "white";
  fillHeight?: boolean;
  expandable?: boolean;
}) {
  const surfaceClass =
    surface === "white" ? "bg-white ring-black/[0.06]" : "bg-surface-card";

  return (
    <div
      className={`hidden rounded-3xl p-6 shadow-[0_8px_32px_rgba(62,52,46,0.1)] ring-1 ring-[color:var(--input-border)] md:flex md:flex-col lg:p-7 ${surfaceClass} ${
        expandable ? "md:h-auto md:max-h-none" : "md:max-h-[calc(100dvh-3rem)]"
      } ${
        centered ? "mx-auto w-full max-w-2xl" : "w-full"
      } ${className}`}
    >
      {(title || subtitle || backHref) && (
        <header className="mb-6 shrink-0 border-b border-[color:var(--input-border)] pb-5">
          <div className="flex items-start gap-4">
            {backHref && <BackButton href={backHref} className="mt-0.5" />}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-2xl font-bold tracking-tight text-text-brown">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-text-brown/55">{subtitle}</p>
              )}
            </div>
          </div>
        </header>
      )}
      <div
        className={
          scrollable
            ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1"
            : fillHeight
              ? "flex min-h-0 flex-1 flex-col"
              : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

interface NavCardProps {
  label: string;
  href: string;
  className?: string;
}

export function NavCard({ label, href, className = "" }: NavCardProps) {
  return (
    <Link
      href={href}
      className={`flex flex-1 items-center justify-center rounded-[1.25rem] bg-cream px-3 py-5 text-center text-base font-bold leading-tight text-text-brown shadow-[0_2px_12px_rgba(62,52,46,0.1)] transition-transform active:scale-[0.98] md:hidden ${className}`}
    >
      {label}
    </Link>
  );
}

interface DesktopActionCardProps {
  label: string;
  href: string;
  description?: string;
}

export function DesktopActionCard({
  label,
  href,
  description,
}: DesktopActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl bg-surface-elevated px-5 py-4 ring-1 ring-[color:var(--input-border)] transition-all hover:bg-[#f5e4cc] hover:ring-input-orange/30 hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input-orange/10 text-lg font-bold text-input-orange transition-colors group-hover:bg-input-orange group-hover:text-white">
        {label.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-text-brown">{label}</span>
        {description && (
          <span className="block truncate text-sm text-text-brown/50">
            {description}
          </span>
        )}
      </span>
      <span className="shrink-0 text-text-brown/25 transition-transform group-hover:translate-x-0.5 group-hover:text-input-orange">
        →
      </span>
    </Link>
  );
}

interface HighlightListProps {
  title?: string;
  items: { id: string; primary: string; secondary?: string; href?: string }[];
}

export function HighlightList({ title = "Destaques", items }: HighlightListProps) {
  return (
    <div className="rounded-2xl bg-surface-elevated p-5 ring-1 ring-[color:var(--input-border)]">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-brown/45">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-input-orange/5"
              >
                <p className="truncate text-sm font-semibold text-text-brown">
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="truncate text-xs text-text-brown/50">
                    {item.secondary}
                  </p>
                )}
              </Link>
            ) : (
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-semibold text-text-brown">
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="truncate text-xs text-text-brown/50">
                    {item.secondary}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
