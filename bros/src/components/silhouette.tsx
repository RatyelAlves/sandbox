import { cn, initials } from "@/lib/utils";

export function Silhouette({
  alias,
  className,
}: {
  alias?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-b from-bg-soft to-bg text-muted",
        className,
      )}
    >
      <span className="font-display text-3xl tracking-wide">
        {alias ? initials(alias) : "B"}
      </span>
    </div>
  );
}
