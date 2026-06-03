import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal }
from "react-dom";

import {
  ChevronDown,
  DownloadCloud,
  HelpCircle,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

import {
  deleteAllConversations,
} from "@/api/chat";

const DROPDOWN_WIDTH = 288;

const DROPDOWN_GAP = 8;

const VIEWPORT_MARGIN = 8;

export function WhatsappStatusDropdown() {

  const {
    connected,
    profileName,
    loading,
    isAdmin,
    syncing,
    lastSync,
    refresh,
    disconnect,
    sync,
  } = useWhatsappStatus();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    position,
    setPosition,
  ] = useState({
    top: 0,
    left: 0,
  });

  const buttonRef = useRef(null);

  const dropdownRef = useRef(null);

  const updatePosition =
    useCallback(() => {

      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect =
        button.getBoundingClientRect();

      const top =
        rect.bottom + DROPDOWN_GAP;

      let left =
        rect.right - DROPDOWN_WIDTH;

      const maxLeft =
        window.innerWidth -
        DROPDOWN_WIDTH -
        VIEWPORT_MARGIN;

      if (left > maxLeft) {
        left = maxLeft;
      }

      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
      }

      setPosition({ top, left });
    }, []);

  useEffect(() => {

    if (!open) {
      return;
    }

    updatePosition();

    window.addEventListener(
      "resize",
      updatePosition
    );

    window.addEventListener(
      "scroll",
      updatePosition,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePosition
      );

      window.removeEventListener(
        "scroll",
        updatePosition,
        true
      );
    };
  }, [open, updatePosition]);

  useEffect(() => {

    if (!open) {
      return;
    }

    function handleClickOutside(
      event
    ) {

      const button = buttonRef.current;

      const dropdown =
        dropdownRef.current;

      if (
        button &&
        button.contains(event.target)
      ) {
        return;
      }

      if (
        dropdown &&
        dropdown.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  const isConnected =
    connected === true;

  const isUnknown =
    connected === null;

  const dotColor = isConnected
    ? "bg-emerald-500"
    : isUnknown
      ? "bg-zinc-300"
      : "bg-amber-500";

  const statusLabel = loading &&
    isUnknown
      ? "Verificando..."
      : isConnected
        ? "Conectado"
        : "Desconectado";

  async function handleDisconnect() {

    if (busy) {
      return;
    }

    const ok = window.confirm(
      "Tem certeza que deseja desconectar o WhatsApp da clínica?"
    );

    if (!ok) {
      return;
    }

    setBusy(true);

    try {
      await disconnect();
    } catch (error) {
      console.error(error);
      window.alert(
        "Não foi possível desconectar o WhatsApp."
      );
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function handleRefresh() {

    if (busy) {
      return;
    }

    setBusy(true);

    try {
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {

    if (busy || syncing) {
      return;
    }

    setBusy(true);

    try {
      await sync({
        wait: true,
        force: true,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleClearAll() {

    console.log(
      "[ClearAll] click",
      { busy, syncing }
    );

    if (busy || syncing) {
      console.log(
        "[ClearAll] ignored (busy/syncing)"
      );
      return;
    }

    const ok = window.confirm(
      "Isso vai apagar TODAS as conversas e mensagens do painel.\n\nO histórico no celular não é afetado. Deseja continuar?"
    );

    console.log(
      "[ClearAll] confirm =",
      ok
    );

    if (!ok) {
      return;
    }

    setBusy(true);

    try {
      const result =
        await deleteAllConversations();

      console.log(
        "[ClearAll] OK",
        result
      );
    } catch (error) {
      console.error(
        "[ClearAll] ERROR",
        error
      );
      window.alert(
        `Não foi possível apagar as conversas.\n${error?.message || ""}`
      );
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  function formatSyncSummary() {

    if (syncing) {
      return "Buscando conversas novas...";
    }

    if (!lastSync) {
      return null;
    }

    if (lastSync.running) {
      return "Atualização em andamento...";
    }

    const created =
      lastSync.conversationsCreated || 0;

    const messages =
      lastSync.messagesSaved || 0;

    const archived =
      lastSync.conversationsArchived || 0;

    if (
      created === 0 &&
      messages === 0 &&
      archived === 0
    ) {
      return "Nenhuma mudança encontrada.";
    }

    const parts = [];

    if (messages > 0) {
      parts.push(
        `+${messages} mensagens`
      );
    }

    if (created > 0) {
      parts.push(
        `+${created} conversas`
      );
    }

    if (archived > 0) {
      parts.push(
        `${archived} arquivadas`
      );
    }

    return `Atualizado: ${parts.join(", ")}.`;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-zinc-200
          bg-white
          px-3
          py-1.5
          text-xs
          font-medium
          text-zinc-700
          transition
          hover:bg-zinc-50
        "
      >
        <span
          className={`
            inline-block
            h-2
            w-2
            rounded-full
            ${dotColor}
          `}
        />
        <span>{statusLabel}</span>
        <ChevronDown
          size={14}
          className="text-zinc-400"
        />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${DROPDOWN_WIDTH}px`,
            zIndex: 60,
          }}
          className="
            rounded-2xl
            border
            border-zinc-200
            bg-white
            shadow-lg
          "
        >
          <div className="
            border-b
            border-zinc-100
            px-4
            py-3
          ">
            <p className="
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-zinc-400
            ">
              WhatsApp da clínica
            </p>

            <div className="
              mt-1
              flex
              items-center
              gap-2
            ">
              <span
                className={`
                  inline-block
                  h-2
                  w-2
                  rounded-full
                  ${dotColor}
                `}
              />

              <span className="
                text-sm
                font-semibold
                text-zinc-800
              ">
                {statusLabel}
              </span>
            </div>

            {isConnected && profileName && (
              <p
                className="
                  mt-2
                  truncate
                  text-sm
                  text-zinc-600
                "
                title={profileName}
              >
                {profileName}
              </p>
            )}

            {!isConnected && !isUnknown && (
              <p className="
                mt-2
                text-xs
                text-zinc-500
              ">
                Escaneie o QR Code abaixo no chat para reconectar.
              </p>
            )}
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busy}
              className="
                flex
                w-full
                items-center
                gap-2
                rounded-xl
                px-3
                py-2
                text-sm
                text-zinc-700
                transition
                hover:bg-zinc-50
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {busy && !syncing ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw size={16} />
              )}
              Atualizar status
            </button>

            {isAdmin && isConnected && (
              <button
                type="button"
                onClick={handleSync}
                disabled={busy || syncing}
                className="
                  group
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  text-sm
                  text-zinc-700
                  transition
                  hover:bg-zinc-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {syncing ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <DownloadCloud size={16} />
                )}

                <span className="flex-1 text-left">
                  Atualizar todas as conversas
                </span>

                <span
                  tabIndex={0}
                  className="
                    relative
                    group/hint
                    inline-flex
                    items-center
                    justify-center
                    rounded-full
                    text-zinc-400
                    transition
                    hover:text-rose-500
                    focus:outline-none
                    focus:text-rose-500
                  "
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <HelpCircle size={14} />

                  <span
                    role="tooltip"
                    className="
                      pointer-events-none
                      absolute
                      bottom-full
                      right-0
                      z-10
                      mb-2
                      w-64
                      origin-bottom-right
                      scale-95
                      rounded-xl
                      border
                      border-zinc-200
                      bg-white
                      px-3.5
                      py-3
                      text-left
                      text-[11px]
                      leading-relaxed
                      text-zinc-600
                      opacity-0
                      shadow-lg
                      shadow-rose-100/40
                      transition
                      duration-150
                      ease-out
                      group-hover/hint:scale-100
                      group-hover/hint:opacity-100
                      group-focus/hint:scale-100
                      group-focus/hint:opacity-100
                    "
                  >
                    <span className="
                      block
                      font-semibold
                      text-zinc-800
                    ">
                      Atualiza mensagens de todos os chats
                    </span>

                    <ul className="
                      mt-1.5
                      space-y-0.5
                      text-zinc-600
                    ">
                      <li>
                        • Importa conversas novas no painel
                      </li>
                      <li>
                        • Puxa as 30 mensagens mais recentes de cada chat
                      </li>
                    </ul>

                    <span className="
                      mt-2
                      block
                      text-zinc-500
                    ">
                      Para ver mensagens antigas de uma conversa, abra o chat e use “Carregar mensagens mais antigas”.
                    </span>

                    <span
                      className="
                        absolute
                        -bottom-1
                        right-3
                        h-2
                        w-2
                        rotate-45
                        border-b
                        border-r
                        border-zinc-200
                        bg-white
                      "
                    />
                  </span>
                </span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={busy}
                className="
                  group
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  text-sm
                  text-rose-600
                  transition
                  hover:bg-rose-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <Trash2 size={16} />

                <span className="flex-1 text-left">
                  Apagar todas as conversas
                </span>

                <span
                  tabIndex={0}
                  className="
                    relative
                    group/hint
                    inline-flex
                    items-center
                    justify-center
                    rounded-full
                    text-zinc-400
                    transition
                    hover:text-rose-500
                    focus:outline-none
                    focus:text-rose-500
                  "
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <HelpCircle size={14} />

                  <span
                    role="tooltip"
                    className="
                      pointer-events-none
                      absolute
                      bottom-full
                      right-0
                      z-10
                      mb-2
                      w-64
                      origin-bottom-right
                      scale-95
                      rounded-xl
                      border
                      border-zinc-200
                      bg-white
                      px-3.5
                      py-3
                      text-left
                      text-[11px]
                      leading-relaxed
                      text-zinc-600
                      opacity-0
                      shadow-lg
                      shadow-rose-100/40
                      transition
                      duration-150
                      ease-out
                      group-hover/hint:scale-100
                      group-hover/hint:opacity-100
                      group-focus/hint:scale-100
                      group-focus/hint:opacity-100
                    "
                  >
                    <span className="
                      block
                      font-semibold
                      text-zinc-800
                    ">
                      Limpa o painel local
                    </span>

                    <ul className="
                      mt-1.5
                      space-y-0.5
                      text-zinc-600
                    ">
                      <li>
                        • Remove todas as conversas e mensagens deste painel
                      </li>
                      <li>
                        • Seu celular continua intacto
                      </li>
                      <li>
                        • Conversas voltam a aparecer quando chegarem novas mensagens
                      </li>
                    </ul>

                    <span className="
                      mt-2
                      block
                      text-zinc-500
                    ">
                      Útil quando o painel ficou com conversas antigas que não existem mais no WhatsApp.
                    </span>

                    <span
                      className="
                        absolute
                        -bottom-1
                        right-3
                        h-2
                        w-2
                        rotate-45
                        border-b
                        border-r
                        border-zinc-200
                        bg-white
                      "
                    />
                  </span>
                </span>
              </button>
            )}

            {isAdmin && isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={busy || syncing}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  text-sm
                  text-rose-600
                  transition
                  hover:bg-rose-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <LogOut size={16} />
                Desconectar WhatsApp
              </button>
            )}

            {(syncing || lastSync) && (
              <p className="
                px-3
                pt-2
                text-[11px]
                leading-tight
                text-zinc-500
              ">
                {formatSyncSummary()}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
