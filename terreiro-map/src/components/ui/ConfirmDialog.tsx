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
  buttonSecondaryClass,
} from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "destructive"
      ? "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
      : buttonPrimaryClass;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-text-brown/40 p-4 backdrop-blur-[2px] md:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-card p-6 shadow-2xl ring-1 ring-[color:var(--input-border)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-bold text-text-brown">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-text-brown/70">
          {message}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`${buttonBaseClass} ${buttonSecondaryClass} flex-1`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${buttonBaseClass} ${confirmClass} flex-1`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface OpenConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<OpenConfirmOptions | null>(null);

  const openConfirm = useCallback((next: OpenConfirmOptions) => {
    setOptions(next);
  }, []);

  const close = useCallback(() => setOptions(null), []);

  const dialog = options ? (
    <ConfirmDialog
      open
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      tone={options.tone}
      onCancel={close}
      onConfirm={() => {
        options.onConfirm();
        close();
      }}
    />
  ) : null;

  return { openConfirm, dialog };
}
