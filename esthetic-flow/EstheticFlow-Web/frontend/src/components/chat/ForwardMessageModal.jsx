import {
  Loader2,
  Search,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

export function ForwardMessageModal({
  open,
  message,
  conversations,
  currentConversationId,
  onClose,
  onConfirm,
  isSubmitting,
}) {

  const [
    search,

    setSearch,
  ] = useState("");

  const currentConversation =
    useMemo(() => {
      return conversations.find(
        (conversation) =>
          conversation.id ===
          currentConversationId
      );
    }, [
      conversations,
      currentConversationId,
    ]);

  const filtered =
    useMemo(() => {

      const query =
        search.trim().toLowerCase();

      return conversations
        .filter(
          (conversation) => {
            if (!query) {
              return true;
            }

            const name =
              conversation.client?.name?.toLowerCase() ||
              "";

            const phone =
              conversation.client?.phone?.toLowerCase() ||
              "";

            return (
              name.includes(query) ||
              phone.includes(query)
            );
          }
        )
        .sort((a, b) => {
          if (
            a.id ===
            currentConversationId
          ) {
            return -1;
          }

          if (
            b.id ===
            currentConversationId
          ) {
            return 1;
          }

          return 0;
        });
    }, [
      conversations,
      currentConversationId,
      search,
    ]);

  if (!open || !message) {
    return null;
  }

  return (
    <div className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/40
      p-4
    ">
      <div className="
        w-full
        max-w-md
        rounded-2xl
        bg-white
        shadow-xl
        overflow-hidden
      ">
        <div className="
          flex
          items-center
          justify-between
          border-b
          border-zinc-200
          px-4
          py-3
        ">
          <div>
            <h3 className="
              text-sm
              font-semibold
              text-zinc-800
            ">
              Encaminhar mensagem
            </h3>

            <p className="
              mt-0.5
              text-xs
              text-zinc-500
              line-clamp-2
            ">
              {message.content}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-1.5
              text-zinc-500
              hover:bg-zinc-100
            "
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {currentConversation && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                onConfirm(
                  currentConversation.id
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-rose-200
                bg-rose-50
                px-3
                py-3
                text-left
                hover:bg-rose-100
                disabled:opacity-50
              "
            >
              <p className="
                text-sm
                font-medium
                text-rose-700
              ">
                Encaminhar nesta conversa
              </p>

              <p className="
                mt-0.5
                text-xs
                text-rose-600/80
              ">
                {currentConversation.client?.name ||
                  "Cliente atual"}
                {" · "}
                {currentConversation.client?.phone ||
                  "Sem telefone"}
              </p>
            </button>
          )}

          <div className="relative">
            <Search
              size={16}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-zinc-400
              "
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar outra conversa..."
              className="
                w-full
                h-10
                rounded-xl
                bg-zinc-100
                pl-9
                pr-3
                text-sm
                outline-none
                focus:ring-2
                focus:ring-rose-200
              "
            />
          </div>

          <div className="
            max-h-72
            overflow-y-auto
            space-y-1
          ">
            {filtered.length === 0 ? (
              <p className="
                py-6
                text-center
                text-sm
                text-zinc-500
              ">
                Nenhuma conversa encontrada
              </p>
            ) : (
              filtered.map(
                (conversation) => {
                  const isCurrent =
                    conversation.id ===
                    currentConversationId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      disabled={
                        isSubmitting ||
                        isCurrent
                      }
                      onClick={() =>
                        onConfirm(
                          conversation.id
                        )
                      }
                      className={`
                        w-full
                        rounded-xl
                        px-3
                        py-2.5
                        text-left
                        disabled:opacity-50
                        ${
                          isCurrent
                            ? "bg-zinc-50 cursor-default"
                            : "hover:bg-rose-50"
                        }
                      `}
                    >
                      <p className="
                        text-sm
                        font-medium
                        text-zinc-800
                      ">
                        {conversation.client?.name ||
                          "Cliente"}

                        {isCurrent && (
                          <span className="
                            ml-2
                            text-xs
                            font-normal
                            text-rose-600
                          ">
                            (esta conversa)
                          </span>
                        )}
                      </p>

                      <p className="
                        text-xs
                        text-zinc-500
                      ">
                        {conversation.client?.phone ||
                          "Sem telefone"}
                      </p>
                    </button>
                  );
                }
              )
            )}
          </div>

          {isSubmitting && (
            <div className="
              flex
              items-center
              justify-center
              gap-2
              text-sm
              text-zinc-500
            ">
              <Loader2
                size={16}
                className="animate-spin"
              />
              Encaminhando...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
