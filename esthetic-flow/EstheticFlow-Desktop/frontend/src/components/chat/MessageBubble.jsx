import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  Download,
  FileText,
  Forward,
  Loader2,
  MoreVertical,
  Reply,
  Sparkles,
  Trash2,
} from "lucide-react";

import { api } from "@/api/api";

import {
  formatMessageTime,
} from "@/lib/formatTime";

const MEDIA_TYPES = new Set([
  "image",
  "video",
  "audio",
  "document",
  "sticker",
]);

function isMediaMessage(message) {
  return MEDIA_TYPES.has(
    message.messageType
  );
}

function isPlaceholderContent(
  content
) {
  return (
    typeof content === "string" &&
    /^\[(Imagem|Vídeo|Áudio|Documento|Sticker)/.test(
      content.trim()
    )
  );
}

async function loadMediaBlob(
  messageId
) {

  const response = await api.get(
    `/messages/${messageId}/media`,
    { responseType: "blob" }
  );

  return URL.createObjectURL(
    response.data
  );
}

function QuotedPreview({
  message,
  fromMe,
  onClick,
  canNavigate,
  authorLabel,
}) {

  if (!message.quotedContent) {
    return null;
  }

  const isClickable =
    canNavigate && onClick;

  const Wrapper = isClickable
    ? "button"
    : "div";

  return (
    <Wrapper
      type={
        isClickable
          ? "button"
          : undefined
      }
      onClick={
        isClickable
          ? onClick
          : undefined
      }
      title={
        isClickable
          ? "Ir até a mensagem"
          : undefined
      }
      className={`
        mb-2
        w-full
        rounded-lg
        border-l-4
        px-3
        py-2
        text-left
        text-xs
        ${
          fromMe
            ? "border-rose-400 bg-white text-zinc-700"
            : "border-rose-400 bg-white text-zinc-600"
        }
        ${
          isClickable
            ? fromMe
              ? "cursor-pointer transition hover:bg-zinc-50"
              : "cursor-pointer transition hover:bg-zinc-50"
            : ""
        }
      `}
    >
      <p className="font-medium text-rose-600">
        {authorLabel}
      </p>

      <p className="
        mt-0.5
        line-clamp-2
        whitespace-pre-wrap
      ">
        {message.quotedContent}
      </p>
    </Wrapper>
  );
}

function MessageMedia({
  message,
  fromMe,
  onFailed,
}) {

  const [mediaUrl, setMediaUrl] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function load() {
      setLoading(true);

      try {
        objectUrl =
          await loadMediaBlob(
            message.id
          );

        if (!cancelled) {
          setMediaUrl(objectUrl);
        }
      } catch {
        if (!cancelled) {
          onFailed?.();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message.id, onFailed]);

  if (loading) {
    return (
      <div className="
        flex
        items-center
        gap-2
        py-1
        text-xs
        opacity-80
      ">
        <Loader2
          size={14}
          className="animate-spin"
        />
        Carregando mídia...
      </div>
    );
  }

  if (!mediaUrl) {
    return null;
  }

  if (
    message.messageType === "image" ||
    message.messageType === "sticker"
  ) {
    return (
      <img
        src={mediaUrl}
        alt={message.content}
        className="
          max-h-72
          max-w-full
          rounded-xl
          object-cover
        "
      />
    );
  }

  if (message.messageType === "video") {
    return (
      <video
        src={mediaUrl}
        controls
        className="
          max-h-72
          max-w-full
          rounded-xl
        "
      />
    );
  }

  if (message.messageType === "audio") {
    return (
      <audio
        src={mediaUrl}
        controls
        className="w-full min-w-0 max-w-full"
      />
    );
  }

  return (
    <a
      href={mediaUrl}
      download={
        message.fileName ||
        "documento"
      }
      className={`
        flex
        items-center
        gap-2
        rounded-lg
        px-2
        py-1.5
        text-sm
        underline-offset-2
        hover:underline
        ${fromMe ? "text-white" : "text-zinc-800"}
      `}
    >
      <FileText size={16} />
      <span className="truncate">
        {message.fileName ||
          "Baixar documento"}
      </span>
      <Download size={14} />
    </a>
  );
}

export function MessageBubble({
  message,
  onReply,
  onForward,
  onDeleteForEveryone,
  onQuotedClick,
  canNavigateToQuoted,
  isHighlighted,
  messageRef,
  quotedAuthorLabel,
}) {

  const fromMe = message.fromMe;

  const isMedia = isMediaMessage(message);

  const isAi =
    message.messageType === "ai";

  const canDeleteForEveryone =
    isMedia &&
    fromMe &&
    Boolean(
      message.whatsappMsgId
    ) &&
    !message.pending;

  const menuRef =
    useRef(null);

  const buttonRef =
    useRef(null);

  const dropdownRef =
    useRef(null);

  const [
    mediaFailed,

    setMediaFailed,
  ] = useState(false);

  const [
    menuOpen,

    setMenuOpen,
  ] = useState(false);

  const [
    menuPosition,

    setMenuPosition,
  ] = useState(null);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuPosition(null);
      return;
    }

    function updatePosition() {
      const button =
        buttonRef.current;

      const dropdown =
        dropdownRef.current;

      if (!button) {
        return;
      }

      const rect =
        button.getBoundingClientRect();

      const dropdownWidth =
        dropdown?.offsetWidth || 180;

      const dropdownHeight =
        dropdown?.offsetHeight || 140;

      const gap = 6;
      const margin = 8;

      let top =
        rect.bottom + gap;

      let left =
        fromMe
          ? rect.left
          : rect.right -
            dropdownWidth;

      if (
        left +
          dropdownWidth >
        window.innerWidth -
          margin
      ) {
        left =
          window.innerWidth -
          dropdownWidth -
          margin;
      }

      if (left < margin) {
        left = margin;
      }

      if (
        top +
          dropdownHeight >
        window.innerHeight -
          margin
      ) {
        top =
          rect.top -
          dropdownHeight -
          gap;
      }

      if (top < margin) {
        top = margin;
      }

      setMenuPosition({
        top,
        left,
      });
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
  }, [
    menuOpen,
    fromMe,
    canDeleteForEveryone,
  ]);

  useEffect(() => {
    function handleClickOutside(
      event
    ) {
      const target =
        event.target;

      if (
        menuRef.current?.contains(
          target
        ) ||
        dropdownRef.current?.contains(
          target
        )
      ) {
        return;
      }

      setMenuOpen(false);
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const showCaption =
    isMedia &&
    message.content &&
    !isPlaceholderContent(
      message.content
    );

  const showTextOnly =
    !isMedia ||
    isAi ||
    (
      mediaFailed &&
      showCaption
    );

  const showMediaBlock =
    isMedia &&
    !isAi &&
    !(
      mediaFailed &&
      showCaption
    );

  return (
    <div
      ref={messageRef}
      data-message-id={message.id}
      className={`
        group
        flex
        flex-col
        max-w-[75%]
        min-w-0
        w-fit
        scroll-mt-4
        rounded-2xl
        transition-shadow
        duration-500

        ${
          isHighlighted
            ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#efeae2]"
            : ""
        }

        ${
          fromMe
            ? "ml-auto items-end"
            : "items-start"
        }
      `}
    >

      <div
        className={`
          relative
          px-4
          py-2.5
          rounded-2xl
          text-sm
          shadow-sm

          ${
            fromMe
              ? `
                bg-rose-300
                text-zinc-900
                border
                border-rose-400/50
                rounded-br-md
              `
              : `
                bg-white
                text-zinc-800
                rounded-bl-md
              `
          }

          ${
            message.pending
              ? "opacity-70"
              : ""
          }

          ${
            !message.pending
              ? fromMe
                ? "pl-7"
                : "pr-7"
              : ""
          }
        `}
      >

        {!message.pending && (
          <div
            ref={menuRef}
            className={`
              absolute
              top-1.5
              z-10
              ${fromMe ? "left-1.5" : "right-1.5"}
            `}
          >
            <button
              ref={buttonRef}
              type="button"
              onClick={() =>
                setMenuOpen(
                  (open) => !open
                )
              }
              className={`
                rounded-md
                p-1
                opacity-0
                transition
                group-hover:opacity-100
                ${
                  fromMe
                    ? "text-rose-700 hover:bg-rose-400/30 hover:text-rose-900"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                }
                ${menuOpen ? "opacity-100" : ""}
              `}
              title="Ações"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        )}

        {menuOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top:
                  menuPosition?.top ??
                  -9999,
                left:
                  menuPosition?.left ??
                  -9999,
                visibility:
                  menuPosition
                    ? "visible"
                    : "hidden",
              }}
              className="
                z-[200]
                min-w-[180px]
                rounded-xl
                border
                border-zinc-200
                bg-white
                py-1
                shadow-lg
              "
            >
              <button
                type="button"
                onClick={() => {
                  onReply?.(message);
                  setMenuOpen(false);
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  px-3
                  py-2
                  text-sm
                  text-zinc-700
                  hover:bg-zinc-50
                "
              >
                <Reply size={14} />
                Responder
              </button>

              <button
                type="button"
                onClick={() => {
                  onForward?.(message);
                  setMenuOpen(false);
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  px-3
                  py-2
                  text-sm
                  text-zinc-700
                  hover:bg-zinc-50
                "
              >
                <Forward size={14} />
                Encaminhar
              </button>

              {canDeleteForEveryone && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteForEveryone?.(
                      message
                    );
                    setMenuOpen(false);
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2
                    px-3
                    py-2
                    text-sm
                    text-red-600
                    hover:bg-red-50
                  "
                >
                  <Trash2 size={14} />
                  Apagar para todos
                </button>
              )}
            </div>,
            document.body
          )}

        {isAi && (
          <span className="
            mb-1.5
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-rose-400/35
            px-2
            py-0.5
            text-[10px]
            font-medium
            uppercase
            tracking-wide
            text-rose-900
          ">
            <Sparkles size={10} />
            IA
          </span>
        )}

        <QuotedPreview
          message={message}
          fromMe={fromMe}
          authorLabel={quotedAuthorLabel}
          onClick={
            canNavigateToQuoted
              ? onQuotedClick
              : undefined
          }
          canNavigate={
            canNavigateToQuoted
          }
        />

        {showMediaBlock && (
          <div className="space-y-2">
            <MessageMedia
              message={message}
              fromMe={fromMe}
              onFailed={() =>
                setMediaFailed(true)
              }
            />

            {mediaFailed &&
              isPlaceholderContent(
                message.content
              ) && (
              <p className="
                text-xs
                opacity-80
              ">
                Mídia indisponível
              </p>
            )}

            {showCaption && (
              <p className="text-sm whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        )}

        {showTextOnly && (
          <p className="whitespace-pre-wrap">
            {message.content}
          </p>
        )}

      </div>

      <span className="
        text-[10px]
        text-zinc-500
        mt-1
        px-1
      ">

        {message.pending
          ? "Enviando..."
          : formatMessageTime(
              message.createdAt
            )}
      </span>

    </div>
  );
}
