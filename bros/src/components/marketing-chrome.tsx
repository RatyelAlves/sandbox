import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SetupBanner } from "@/components/setup-banner";

export function MarketingHeader({ overlay = false }: { overlay?: boolean }) {
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
            <Link
              href="/entrar"
              className="rounded-md px-3 py-2 font-medium text-ink/90 transition hover:text-accent-hot"
            >
              Entrar
            </Link>
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

export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-line/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p>Bros — 18+. Sem nome real, sem GPS, sem exposição.</p>
        <div className="flex gap-4">
          <Link href="/termos" className="text-accent transition hover:text-accent-hot">
            Termos
          </Link>
          <Link href="/privacidade" className="text-accent transition hover:text-accent-hot">
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden min-h-[32rem] overflow-hidden lg:block">
          <Image
            src="/bg/poster.png"
            alt=""
            fill
            sizes="50vw"
            className="object-cover object-[72%_center]"
            priority
          />
        </div>
        <div className="flex flex-col">{children}</div>
      </div>
      <MarketingFooter />
    </div>
  );
}
