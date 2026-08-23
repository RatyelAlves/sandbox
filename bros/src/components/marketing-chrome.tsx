import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SetupBanner } from "@/components/setup-banner";

const CREATOR_GITHUB = "https://github.com/RatyelAlves";

function CreatorCredit({ className }: { className?: string }) {
  return (
    <span>
      Criado por{" "}
      <a
        href={CREATOR_GITHUB}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        C0tr4x
      </a>
    </span>
  );
}

export function MarketingHeader({
  overlay = false,
  compact = false,
}: {
  overlay?: boolean;
  compact?: boolean;
}) {
  return (
    <>
      {overlay ? null : <SetupBanner />}
      <header
        className={
          overlay
            ? "absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-sm"
            : "border-b border-line/80 bg-bg/90 backdrop-blur"
        }
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-5">
          <BrandLogo />
          <nav className="flex items-center gap-2 text-sm">
            {compact ? null : (
              <Link
                href="/entrar"
                className="rounded-md px-3 py-2 font-medium text-ink/90 transition hover:text-accent-hot"
              >
                Entrar
              </Link>
            )}
            <Link
              href="/cadastro"
              className="rounded-md bg-accent px-3 py-2 font-medium text-accent-ink transition hover:bg-accent-hot"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

function FooterLinks({ className }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap items-center gap-5 ${className ?? ""}`}>
      <Link href="/termos" className="transition hover:text-ink">
        Termos
      </Link>
      <Link href="/privacidade" className="transition hover:text-ink">
        Privacidade
      </Link>
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-line/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-4">
          <BrandLogo />
          <FooterLinks className="text-xs text-muted" />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} Bros</p>
          <CreatorCredit className="text-ink/80 transition hover:text-accent" />
        </div>
      </div>
    </footer>
  );
}

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <MarketingHeader compact />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <aside className="relative hidden overflow-hidden lg:block">
          <Image
            src="/bg/hero.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            quality={95}
            unoptimized
            className="object-cover object-right"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/25" />
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="max-w-sm font-display text-3xl leading-[1.05] text-ink">
              Encontros sem plateia.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
              Usuário no lugar de nome. Fotos só quando você liberar.
            </p>
          </div>
        </aside>
        <div className="flex flex-col">
          {children}
          <footer className="mt-auto border-t border-line/80 px-6 py-3 text-xs text-muted sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} Bros</p>
              <div className="flex flex-wrap items-center gap-4">
                <FooterLinks />
                <CreatorCredit className="transition hover:text-ink" />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
