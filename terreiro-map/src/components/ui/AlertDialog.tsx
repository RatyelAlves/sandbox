"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  buttonBaseClass,
  buttonPrimaryClass,
} from "@/components/ui/Button";

export interface AlertDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  okLabel?: string;
  onClose: () => void;
}

export function AlertDialog({
  open,
  title,
  message,
  okLabel = "Entendi",
  onClose,
}: AlertDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-text-brown/40 p-4 backdrop-blur-[2px] md:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-card p-6 shadow-2xl ring-1 ring-[color:var(--input-border)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-input-orange/15 text-input-orange">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2 id={titleId} className="text-lg font-bold text-text-brown">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-text-brown/70">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`${buttonBaseClass} ${buttonPrimaryClass} mt-6 w-full`}
        >
          {okLabel}
        </button>
      </div>
    </div>
  );
}

interface OpenAlertOptions {
  title: string;
  message: ReactNode;
  okLabel?: string;
}

export function useAlertDialog() {
  const [options, setOptions] = useState<OpenAlertOptions | null>(null);

  const openAlert = useCallback((next: OpenAlertOptions) => {
    setOptions(next);
  }, []);

  const close = useCallback(() => setOptions(null), []);

  const dialog = options ? (
    <AlertDialog
      open
      title={options.title}
      message={options.message}
      okLabel={options.okLabel}
      onClose={close}
    />
  ) : null;

  return { openAlert, dialog };
}
