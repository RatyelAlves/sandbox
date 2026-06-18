import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-xl border px-4 py-3 text-sm font-medium text-text-brown shadow-[inset_0_1px_2px_rgba(62,52,46,0.04)] transition-[border-color,box-shadow,background-color] placeholder:text-text-brown/50 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-input-orange/20 md:py-3.5";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "orange" | "peach";
}

export function Input({ variant = "orange", className = "", ...props }: InputProps) {
  const variants = {
    orange:
      "border-[color:var(--input-border)] bg-input-surface focus:border-[color:var(--input-border-focus)] focus:bg-[#f3e2cc]",
    peach:
      "border-input-peach/50 bg-input-surface-warm focus:border-input-orange/45 focus:ring-input-peach/25",
  };

  return (
    <input className={`${fieldBase} ${variants[variant]} ${className}`} {...props} />
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "orange" | "peach";
}

export function TextArea({
  variant = "orange",
  className = "",
  ...props
}: TextAreaProps) {
  const variants = {
    orange:
      "border-[color:var(--input-border)] bg-input-surface focus:border-[color:var(--input-border-focus)] focus:bg-[#f3e2cc]",
    peach:
      "border-input-peach/50 bg-input-surface-warm focus:border-input-orange/45 focus:ring-input-peach/25",
  };

  return (
    <textarea
      className={`${fieldBase} resize-none ${variants[variant]} ${className}`}
      rows={3}
      {...props}
    />
  );
}
