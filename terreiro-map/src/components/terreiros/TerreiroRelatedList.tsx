import Link from "next/link";
import type { Terreiro } from "@/lib/mock-data";

interface TerreiroRelatedListProps {
  terreiros: Terreiro[];
  detailBase: string;
  title?: string;
  className?: string;
}

export function TerreiroRelatedList({
  terreiros,
  detailBase,
  title = "Terreiros relacionados",
  className = "",
}: TerreiroRelatedListProps) {
  if (terreiros.length === 0) return null;

  return (
    <aside
      aria-label={title}
      className={`flex w-full flex-col gap-2 lg:w-[11.5rem] lg:shrink-0 lg:self-stretch xl:w-[13rem] ${className}`}
    >
      <h2 className="rounded-lg bg-cream/95 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-text-brown shadow-[0_2px_10px_rgba(62,52,46,0.08)] ring-1 ring-[color:var(--input-border)] lg:text-left">
        {title}
      </h2>
      {terreiros.map((t) => (
        <Link
          key={t.id}
          href={`${detailBase}/${t.id}`}
          className="block rounded-[1.15rem] bg-cream/95 px-3 py-4 text-center shadow-[0_2px_10px_rgba(62,52,46,0.08)] ring-1 ring-[color:var(--input-border)] transition-all hover:bg-[#f5e8dc] active:scale-[0.99]"
        >
          <p className="line-clamp-2 text-sm font-bold leading-snug text-text-brown">
            {t.nome}
          </p>
          <p className="mt-1 text-xs text-text-brown/65">{t.categoria}</p>
        </Link>
      ))}
    </aside>
  );
}
