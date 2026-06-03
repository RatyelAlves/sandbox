import {
  Search,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { api }
from "@/api/api";

import {
  deleteConversation,
} from "@/api/chat";

import { getSocket }
from "@/services/socket";

import {
  formatMessageTime,
} from "@/lib/formatTime";

import {
  WhatsappStatusDropdown,
} from "@/components/whatsapp/WhatsappStatusDropdown";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

export function ConversationSidebar({
  className = "",
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  refreshKey,
}) {

  const [
    conversations,

    setConversations,
  ] = useState([]);

  const [
    search,

    setSearch,
  ] = useState("");

  const [
    isLoading,

    setIsLoading,
  ] = useState(true);

  const [
    deletingId,

    setDeletingId,
  ] = useState(null);

  const {
    connected: whatsappConnected,
  } = useWhatsappStatus();

  const whatsappOffline =
    whatsappConnected === false;

  async function loadConversations() {

    try {

      const response =
        await api.get(
          "/conversations"
        );

      setConversations(
        response.data
      );

      return response.data;

    } catch (error) {

      console.error(
        "Erro ao carregar conversas",
        error
      );

      return [];

    } finally {

      setIsLoading(false);
    }
  }

  useEffect(() => {

    loadConversations();

  }, [refreshKey]);

  useEffect(() => {

    function handleNewMessage() {

      loadConversations();
    }

    function handleConversationDeleted({
      conversationId,
    }) {

      setConversations(
        (current) =>
          current.filter(
            (item) =>
              item.id
              !== conversationId
          )
      );

      onDeleteConversation?.(
        conversationId
      );
    }

    function handleConversationsCleared() {

      setConversations([]);

      onDeleteConversation?.(null);
    }

    const socket = getSocket();

    if (!socket) {
      return;
    }

    socket.on(
      "new-message",
      handleNewMessage
    );

    socket.on(
      "conversation-deleted",
      handleConversationDeleted
    );

    socket.on(
      "conversations-archived",
      handleNewMessage
    );

    socket.on(
      "conversations-cleared",
      handleConversationsCleared
    );

    socket.on(
      "whatsapp-account-changed",
      handleNewMessage
    );

    return () => {

      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.off(
        "conversation-deleted",
        handleConversationDeleted
      );

      socket.off(
        "conversations-archived",
        handleNewMessage
      );

      socket.off(
        "conversations-cleared",
        handleConversationsCleared
      );

      socket.off(
        "whatsapp-account-changed",
        handleNewMessage
      );
    };

  }, [onDeleteConversation]);

  async function handleDeleteConversation(
    event,
    conversation
  ) {

    event.stopPropagation();

    const confirmed =
      window.confirm(
        "Remover esta conversa do painel?\n\nO histórico será apagado aqui no EstheticFlow. Isso não desfaz bloqueios nem exclusões no celular."
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(conversation.id);

    try {

      await deleteConversation(
        conversation.id
      );

      setConversations(
        (current) =>
          current.filter(
            (item) =>
              item.id
              !== conversation.id
          )
      );

      onDeleteConversation?.(
        conversation.id
      );

    } catch (error) {

      console.error(
        "Erro ao excluir conversa",
        error
      );

      window.alert(
        "Não foi possível excluir a conversa."
      );

    } finally {

      setDeletingId(null);
    }
  }

  const filtered =
    conversations.filter(
      (conversation) => {

        const term =
          search.toLowerCase();

        const name =
          conversation.client?.name
            ?.toLowerCase() || "";

        const phone =
          conversation.client?.phone
            ?.toLowerCase() || "";

        return (
          name.includes(term) ||
          phone.includes(term)
        );
      }
    );

  return (
    <div
      className={`
        w-72
        max-w-[38%]
        border-r
        border-zinc-200
        bg-white
        flex
        flex-col
        shrink-0
        min-w-0
        ${className}
      `}
    >

      <div className="
        p-5
        border-b
        border-zinc-200
      ">

        <div className="
          flex
          items-center
          justify-between
          gap-2
          mb-4
        ">
          <h2 className="
            text-xl
            font-bold
            text-zinc-800
          ">
            Conversas
          </h2>

          <WhatsappStatusDropdown />
        </div>

        {!whatsappOffline && (
          <div className="
            h-11
            rounded-xl
            bg-zinc-100
            flex
            items-center
            px-3
            gap-2
          ">

            <Search
              size={18}
              className="text-zinc-400"
            />

            <input
              value={search}

              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }

              placeholder="Buscar cliente..."

              className="
                bg-transparent
                outline-none
                flex-1
                text-sm
              "
            />

          </div>
        )}

      </div>

      <div className="
        flex-1
        overflow-y-auto
        min-h-0
      ">

        {whatsappOffline ? (

          <div className="
            flex
            h-full
            flex-col
            items-center
            justify-center
            gap-2
            p-6
            text-center
          ">
            <p className="
              text-sm
              font-medium
              text-zinc-700
            ">
              WhatsApp desconectado
            </p>

            <p className="
              text-xs
              text-zinc-500
            ">
              As conversas voltam quando o WhatsApp da clínica estiver conectado.
            </p>
          </div>

        ) : isLoading ? (

          <div className="
            p-6
            space-y-4
          ">

            {[1, 2, 3].map((i) => (

              <div
                key={i}
                className="
                  flex
                  gap-3
                  animate-pulse
                "
              >

                <div className="
                  w-10
                  h-10
                  rounded-full
                  bg-zinc-200
                " />

                <div className="
                  flex-1
                  space-y-2
                ">

                  <div className="
                    h-3
                    bg-zinc-200
                    rounded
                    w-2/3
                  " />

                  <div className="
                    h-2
                    bg-zinc-100
                    rounded
                    w-full
                  " />

                </div>

              </div>
            ))}

          </div>

        ) : filtered.length === 0 ? (

          <p className="
            p-6
            text-sm
            text-zinc-500
            text-center
          ">
            Nenhuma conversa encontrada
          </p>

        ) : (

          filtered.map(
            (conversation) => {

            const client =
              conversation.client;

            const initial =
              client?.name
                ?.charAt(0) || "?";

            const isSelected =
              selectedConversationId
              === conversation.id;

            const lastMessage =
              conversation.messages?.[0];

            const unread =
              conversation.unreadCount > 0;

            return (
              <div
                key={conversation.id}
                className={`
                  group
                  flex
                  items-stretch
                  border-b
                  border-zinc-100

                  ${
                    isSelected
                      ? "bg-rose-50"
                      : "hover:bg-zinc-50"
                  }
                `}
              >

                <button
                  type="button"

                  onClick={() =>
                    onSelectConversation(
                      conversation
                    )
                  }

                  className="
                    flex-1
                    min-w-0
                    px-4
                    py-4
                    flex
                    items-center
                    gap-3
                    text-left
                  "
                >

                <div className="
                  w-10
                  h-10
                  rounded-full
                  bg-rose-100
                  flex
                  items-center
                  justify-center
                  text-sm
                  font-semibold
                  text-rose-500
                  shrink-0
                ">

                  {initial}

                </div>

                <div className="
                  flex-1
                  min-w-0
                ">

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  ">

                    <p className={`
                      font-medium
                      truncate

                      ${
                        unread
                          ? "text-zinc-900"
                          : "text-zinc-800"
                      }
                    `}>
                      {client?.name}
                    </p>

                    {lastMessage?.createdAt && (
                      <span className="
                        text-[10px]
                        text-zinc-400
                        shrink-0
                      ">
                        {formatMessageTime(
                          lastMessage.createdAt
                        )}
                      </span>
                    )}

                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-2
                    mt-0.5
                  ">

                    <p className={`
                      text-xs
                      truncate

                      ${
                        unread
                          ? "text-zinc-700 font-medium"
                          : "text-zinc-500"
                      }
                    `}>
                      {
                        lastMessage?.content ||
                        client?.phone
                      }
                    </p>

                    {unread && (
                      <span className="
                        min-w-[20px]
                        h-5
                        px-1.5
                        rounded-full
                        bg-rose-500
                        text-white
                        text-[11px]
                        font-semibold
                        flex
                        items-center
                        justify-center
                        shrink-0
                      ">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}

                  </div>

                </div>

                </button>

                <button
                  type="button"
                  title="Remover do painel"
                  disabled={
                    deletingId
                    === conversation.id
                  }
                  onClick={(event) =>
                    handleDeleteConversation(
                      event,
                      conversation
                    )
                  }
                  className="
                    shrink-0
                    px-3
                    text-zinc-400
                    opacity-0
                    transition
                    group-hover:opacity-100
                    hover:text-red-500
                    disabled:opacity-40
                  "
                >

                  <Trash2 size={16} />

                </button>

              </div>
            );
          })

        )}

      </div>

    </div>
  );
}
