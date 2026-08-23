"use client";

import { useEffect, useState } from "react";
import { loadPanicUrl } from "@/lib/panic-url";
import { CLIMA_CITY_KEY } from "@/lib/weather";
import { cn } from "@/lib/utils";

const HINT =
  "Sai do Bros na hora. Abre a página que você cadastrou em Ajustes, ou o clima se deixar em branco. No clima, toque 3 vezes no logo para voltar.";

export function PanicButton({
  city,
  className,
}: {
  city?: string;
  className?: string;
}) {
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (!hintOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setHintOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hintOpen]);

  function exit() {
    const custom = loadPanicUrl();
    if (custom) {
      window.location.replace(custom);
      return;
    }
    if (city) {
      sessionStorage.setItem(CLIMA_CITY_KEY, city);
    }
    window.location.replace("/camuflado");
  }

  return (
    <div className="group relative shrink-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={exit}
          className={cn(
            "h-8 rounded-full border border-muted px-3 text-[11px] font-bold tracking-wide text-ink",
            className,
          )}
          aria-describedby="panic-hint"
          title={HINT}
        >
          <span className="sm:hidden">Panic</span>
          <span className="hidden sm:inline">Gay Panic Button</span>
        </button>
        <button
          type="button"
          onClick={() => setHintOpen((open) => !open)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-muted text-[12px] font-bold text-muted sm:hidden"
          aria-expanded={hintOpen}
          aria-controls="panic-hint"
          aria-label="Como funciona o Panic"
        >
          ?
        </button>
      </div>

      {hintOpen ? (
        <button
          type="button"
          aria-label="Fechar dica"
          onClick={() => setHintOpen(false)}
          className="fixed inset-0 z-40 bg-transparent sm:hidden"
        />
      ) : null}

      <p
        id="panic-hint"
        role="tooltip"
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] z-50 w-max max-w-[min(240px,calc(100vw-2rem))] rounded-xl bg-bg-elevated px-3 py-2 text-left text-[11px] font-medium leading-snug text-muted shadow-lg ring-1 ring-line",
          hintOpen
            ? "block"
            : "hidden group-hover:block group-focus-within:block",
        )}
      >
        {HINT}
      </p>
    </div>
  );
}
