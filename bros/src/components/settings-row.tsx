import Link from "next/link";
import { IconChevron } from "@/components/icons";

export function SettingsRow({
  href,
  label,
  value,
  badge,
  icon,
}: {
  href: string;
  label: string;
  value?: string;
  badge?: number;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition active:bg-bg-elevated"
    >
      {icon ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated text-accent">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 text-[15px] font-bold text-ink">{label}</span>
      <span className="flex items-center gap-2 text-[13px] text-muted">
        {badge ? (
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
            {badge}
          </span>
        ) : null}
        {value ? <span>{value}</span> : null}
        <IconChevron className="h-4 w-4" />
      </span>
    </Link>
  );
}
