import Image from "next/image";
import Link from "next/link";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({
  href,
  label = "Voltar",
  className = "",
}: BackButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-text-brown shadow-[0_1px_3px_rgba(62,52,46,0.08)] ring-1 ring-[color:var(--input-border)] transition-all hover:bg-surface-elevated hover:ring-input-orange/35 active:scale-95 ${className}`}
    >
      <Image
        src="/assets/down-arrow.png"
        alt=""
        width={14}
        height={14}
        className="rotate-90 opacity-80"
      />
    </Link>
  );
}
