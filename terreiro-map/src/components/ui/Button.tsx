import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const buttonBaseClass =
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

export const buttonPrimaryClass =
  "bg-input-orange text-white shadow-sm shadow-input-orange/20 hover:bg-orange-dark";

export const buttonSecondaryClass =
  "border border-[color:var(--input-border)] bg-surface-elevated text-text-brown shadow-sm hover:bg-input-surface-warm/60";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "peach";
  href?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  href,
  children,
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: buttonPrimaryClass,
    secondary: buttonSecondaryClass,
    peach: buttonSecondaryClass,
  };
  const width = fullWidth ? "w-full" : "";
  const classes = `${buttonBaseClass} ${variants[variant]} ${width} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
