"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  buttonBaseClass,
  buttonPrimaryClass,
} from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth, type AccountType } from "@/lib/auth-context";

function SwitchAccessIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function useSwitchAccess() {
  const router = useRouter();
  const { logout } = useAuth();

  return useCallback(async () => {
    await logout();
    router.push("/primeiro-acesso");
  }, [logout, router]);
}

interface ConfirmDialogProps {
  open: boolean;
  accountLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmSwitchDialog({
  open,
  accountLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Trocar de acesso?"
      message={
        <>
          Sua sessão como{" "}
          <strong className="text-text-brown">{accountLabel}</strong> será
          encerrada. Você poderá escolher novamente entre Usuário ou Terreiro.
        </>
      }
      confirmLabel="Confirmar"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function useSwitchAccessWithConfirm(accountType?: AccountType) {
  const switchAccess = useSwitchAccess();
  const [open, setOpen] = useState(false);
  const label = accountType === "terreiro" ? "Terreiro" : "Usuário";

  const requestSwitch = () => setOpen(true);
  const cancel = () => setOpen(false);
  const confirm = () => {
    setOpen(false);
    switchAccess();
  };

  const dialog = (
    <ConfirmSwitchDialog
      open={open}
      accountLabel={label}
      onCancel={cancel}
      onConfirm={confirm}
    />
  );

  return { requestSwitch, dialog };
}

interface SwitchAccessButtonProps {
  variant?: "compact" | "sidebar" | "panel";
  accountType?: AccountType;
  className?: string;
}

export function SwitchAccessButton({
  variant = "panel",
  accountType,
  className = "",
}: SwitchAccessButtonProps) {
  const { requestSwitch, dialog } = useSwitchAccessWithConfirm(accountType);

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={requestSwitch}
          className={`${buttonBaseClass} ${buttonPrimaryClass} gap-2 rounded-full px-3.5 py-2 text-xs ${className}`}
        >
          <SwitchAccessIcon className="text-white" />
          Trocar conta
        </button>
        {dialog}
      </>
    );
  }

  if (variant === "sidebar") {
    return (
      <>
        <button
          type="button"
          onClick={requestSwitch}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-text-brown/5 ${className}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-text-brown/5 text-text-brown/70 transition-colors group-hover:bg-input-orange/15 group-hover:text-input-orange">
            <SwitchAccessIcon />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-text-brown">
              Trocar de acesso
            </span>
            <span className="block truncate text-xs text-text-brown/55">
              Encerrar sessão atual
            </span>
          </span>
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div
        className={`rounded-2xl border border-[color:var(--input-border)] bg-surface-elevated/90 p-5 ${className}`}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input-orange/15 text-input-orange">
            <SwitchAccessIcon />
          </span>
          <div>
            <h3 className="font-bold text-text-brown">Sessão e acesso</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-brown/65">
              Encerre a sessão para entrar com outro perfil — Usuário ou Terreiro.
            </p>
          </div>
        </div>
        <Button type="button" onClick={requestSwitch} fullWidth>
          Trocar de acesso
        </Button>
      </div>
      {dialog}
    </>
  );
}
