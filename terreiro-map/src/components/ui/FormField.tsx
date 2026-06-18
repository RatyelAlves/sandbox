import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  hint,
  optional = false,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-semibold text-text-brown/80"
      >
        {label}
        {optional && (
          <span className="ml-1 font-normal text-text-brown/45">(opcional)</span>
        )}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-text-brown/45">{hint}</p>}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4">
      <div className="border-b border-[color:var(--input-border)] pb-3">
        <h2 className="text-sm font-bold tracking-tight text-text-brown">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-text-brown/50">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
