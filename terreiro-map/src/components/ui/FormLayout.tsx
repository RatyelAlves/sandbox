import type { FormHTMLAttributes, ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";

interface FormPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
}

export function FormPageHeader({ title, subtitle, backHref }: FormPageHeaderProps) {
  return (
    <header className="flex items-start gap-3 border-b border-[color:var(--input-border)] pb-5">
      {backHref && <BackButton href={backHref} className="mt-0.5" />}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-text-brown">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-brown/55">{subtitle}</p>
        )}
      </div>
    </header>
  );
}

interface FormActionsProps {
  submitLabel: string;
  cancelHref?: string;
  cancelLabel?: string;
}

export function FormActions({
  submitLabel,
  cancelHref,
  cancelLabel = "Cancelar",
}: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[color:var(--input-border)] pt-6 sm:flex-row sm:justify-end">
      {cancelHref && (
        <Button
          type="button"
          variant="secondary"
          href={cancelHref}
          fullWidth={false}
          className="sm:min-w-[7.5rem]"
        >
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" fullWidth={false} className="sm:min-w-[10rem]">
        {submitLabel}
      </Button>
    </div>
  );
}

export const formDesktopWrapClass = "mx-auto w-full max-w-2xl pb-2";

interface FormShellProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

export function FormShell({ children, className = "", ...props }: FormShellProps) {
  return (
    <form className={`flex flex-col gap-8 ${className}`} {...props}>
      {children}
    </form>
  );
}
