import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-full border border-line bg-bg-elevated px-4 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-accent";

export const textareaClass =
  "w-full rounded-xl border border-line bg-bg-elevated px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-accent resize-none";

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-accent px-7 py-3 text-base font-bold tracking-wide text-accent-ink transition hover:bg-accent-hot active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-muted px-6 py-3 text-[15px] font-bold text-ink transition hover:border-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-bold text-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center rounded-full border border-danger px-6 py-3 text-[15px] font-bold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50",
};

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "ok";
}) {
  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm",
        tone === "error"
          ? "bg-danger/10 text-danger"
          : "bg-accent/15 text-accent",
      )}
    >
      {children}
    </p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-5 space-y-1 px-1">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[22px] font-bold tracking-tight text-ink">{title}</h1>
      {description ? (
        <p className="max-w-xl text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}
