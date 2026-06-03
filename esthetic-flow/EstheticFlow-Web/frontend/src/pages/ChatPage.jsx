import {
  useCallback,
  useState,
} from "react";

import { ConversationSidebar }
from "@/components/chat/ConversationSidebar";

import { ChatContainer }
from "@/components/chat/ChatContainer";

import {
  WhatsappConnectCard,
} from "@/components/whatsapp/WhatsappConnectCard";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

export default function ChatPage() {

  const {
    connected,
  } = useWhatsappStatus();

  const showQrPanel =
    connected === false;

  const [
    selectedConversation,

    setSelectedConversation,
  ] = useState(null);

  const [
    sidebarRefreshKey,

    setSidebarRefreshKey,
  ] = useState(0);

  const handleSelectConversation =
    useCallback((conversation) => {

      setSelectedConversation(
        conversation
      );
    },

    []);

  const handleCloseConversation =
    useCallback(() => {

      setSelectedConversation(null);
    },

    []);

  const handleDeleteConversation =
    useCallback((conversationId) => {

      setSelectedConversation(
        (current) =>
          current?.id ===
          conversationId
            ? null
            : current
      );
    },

    []);

  const refreshSidebar =
    useCallback(() => {

      setSidebarRefreshKey(
        (key) => key + 1
      );
    },

    []);

  return (
    <div className="
      h-full
      min-w-0
      bg-white
      rounded-3xl
      border
      border-zinc-200
      overflow-hidden
      flex
    ">

        <ConversationSidebar
          className={
            selectedConversation &&
            !showQrPanel
              ? "max-xl:hidden"
              : "max-xl:flex-1 max-xl:w-full max-xl:max-w-none max-xl:border-r-0"
          }
          selectedConversationId={
            selectedConversation?.id
          }

          onSelectConversation={
            handleSelectConversation
          }

          onDeleteConversation={
            handleDeleteConversation
          }

          refreshKey={
            sidebarRefreshKey
          }
        />

        {showQrPanel ? (
          <div className="
            flex-1
            min-w-0
            flex
            items-center
            justify-center
            overflow-y-auto
            bg-[#faf8f7]
            p-6
            max-xl:hidden
          ">
            <WhatsappConnectCard
              variant="inline"
            />
          </div>
        ) : (
          <ChatContainer
            className={
              selectedConversation
                ? ""
                : "max-xl:hidden"
            }
            conversation={
              selectedConversation
            }

            onSidebarRefresh={
              refreshSidebar
            }

            onConversationUpdate={
              setSelectedConversation
            }

            onCloseConversation={
              handleCloseConversation
            }
          />
        )}

      </div>
  );
}
