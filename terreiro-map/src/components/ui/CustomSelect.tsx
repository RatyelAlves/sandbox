"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: readonly CustomSelectOption[];
  placeholder: string;
  ariaLabel?: string;
  leftIconSrc?: string;
  variant?: "default" | "orange";
  size?: "default" | "compact";
}

export function CustomSelect({
  value = "",
  onChange,
  options,
  placeholder,
  ariaLabel,
  leftIconSrc,
  variant = "default",
  size = "default",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const isOrange = variant === "orange";
  const isCompact = size === "compact";

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (nextValue: string) => {
    onChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center rounded-xl border text-left font-medium transition-colors focus:outline-none focus:ring-2 ${
          isCompact ? "py-2 text-xs" : "py-3.5 text-sm"
        } ${leftIconSrc ? (isCompact ? "pl-9" : "pl-11") : isCompact ? "pl-3" : "pl-4"} ${
          isCompact ? "pr-9" : "pr-10"
        } ${
          isOrange
            ? "border-input-orange bg-input-orange text-white shadow-[0_2px_8px_rgba(223,133,58,0.28)] focus:ring-white/40"
            : "border-[color:var(--input-border)] bg-input-surface text-text-brown shadow-[0_1px_2px_rgba(62,52,46,0.04)] focus:border-input-orange focus:ring-input-orange/35"
        }`}
      >
        {displayLabel}
      </button>

      {leftIconSrc && (
        <Image
          src={leftIconSrc}
          alt=""
          width={isCompact ? 15 : 18}
          height={isCompact ? 15 : 18}
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
            isCompact ? "left-3" : "left-4"
          } ${
            isOrange ? "brightness-0 invert opacity-90" : "opacity-70"
          }`}
        />
      )}

      <Image
        src="/assets/down-arrow.png"
        alt=""
        width={isCompact ? 12 : 14}
        height={isCompact ? 12 : 14}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 transition-transform ${
          isCompact ? "right-3" : "right-4"
        } ${open ? "rotate-180" : ""} ${isOrange ? "brightness-0 invert" : "opacity-70"}`}
      />

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          className={`absolute left-0 right-0 z-30 overflow-hidden rounded-xl border border-[color:var(--input-border)] bg-input-surface shadow-[0_8px_24px_rgba(62,52,46,0.14)] ${
            isCompact ? "top-[calc(100%+0.25rem)] py-0.5" : "top-[calc(100%+0.35rem)] py-1"
          }`}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;

            return (
              <li key={opt.value || "__placeholder__"} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left transition-colors ${
                    isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
                  } ${
                    isSelected
                      ? "bg-input-orange font-semibold text-white"
                      : "text-text-brown hover:bg-input-orange hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
