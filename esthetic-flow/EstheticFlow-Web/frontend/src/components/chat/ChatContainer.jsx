import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ChevronUp,
  Loader2,
  Mic,
  Paperclip,
  Reply,
  Send,
  Sparkles,
  CalendarDays,
  Square,
  X,
  Zap,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import { api }
from "@/api/api";

import { getSocket }
from "@/services/socket";

import { QuickRepliesPanel }
from "@/components/chat/QuickRepliesPanel";

import { MessageBubble }
from "@/components/chat/MessageBubble";

import { ForwardMessageModal }
from "@/components/chat/ForwardMessageModal";

import {
  listQuickReplies,
} from "@/api/quickReplies";

import {
  deleteMessageForEveryone,
  fetchConversations,
  forwardMessage as forwardMessageApi,
  syncOlderMessages,
} from "@/api/chat";

export function ChatContainer({
  className = "",
  conversation,
  onSidebarRefresh,
  onConversationUpdate,
  onCloseConversation,
}) {

  const [
    messages,

    setMessages,
  ] = useState([]);

  const [
    text,

    setText,
  ] = useState("");

  const [
    isLoading,

    setIsLoading,
  ] = useState(false);

  const [
    isSending,

    setIsSending,
  ] = useState(false);

  const [
    isGeneratingAi,

    setIsGeneratingAi,
  ] = useState(false);

  const [
    aiConfigured,

    setAiConfigured,
  ] = useState(false);

  const [
    linkPhoneValue,

    setLinkPhoneValue,
  ] = useState("");

  const [
    isLinkingPhone,

    setIsLinkingPhone,
  ] = useState(false);

  const [
    quickReplies,

    setQuickReplies,
  ] = useState([]);

  const [
    showQuickReplies,

    setShowQuickReplies,
  ] = useState(false);

  const [
    isLoadingOlder,

    setIsLoadingOlder,
  ] = useState(false);

  const [
    hasOlderMessages,

    setHasOlderMessages,
  ] = useState(true);

  const messagesContainerRef =
    useRef(null);

  const restoreScrollHeightRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const messageRefsRef =
    useRef(new Map());

  const highlightTimeoutRef =
    useRef(null);

  const [
    highlightedMessageId,

    setHighlightedMessageId,
  ] = useState(null);

  const fileInputRef =
    useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const recordingIntervalRef =
    useRef(null);

  const [
    isUploadingMedia,

    setIsUploadingMedia,
  ] = useState(false);

  const [
    isRecording,

    setIsRecording,
  ] = useState(false);

  const [
    recordingSeconds,

    setRecordingSeconds,
  ] = useState(0);

  const [
    replyingTo,

    setReplyingTo,
  ] = useState(null);

  const [
    forwardMessage,

    setForwardMessage,
  ] = useState(null);

  const [
    allConversations,

    setAllConversations,
  ] = useState([]);

  const [
    isForwarding,

    setIsForwarding,
  ] = useState(false);

  const conversationId =
    conversation?.id;

  const needsPhoneLink =
    Boolean(
      conversation?.whatsappJid?.endsWith(
        "@lid"
      ) &&
      !conversation?.whatsappJidAlt
    );

  const messagesByWhatsappId =
    useMemo(() => {

      const map = new Map();

      for (const message of messages) {
        if (message.whatsappMsgId) {
          map.set(
            message.whatsappMsgId,
            message.id
          );
        }
      }

      return map;

    }, [messages]);

  const resolveQuotedMessageId =
    useCallback(
      (message) => {

        if (message.replyToMessageId) {
          return message.replyToMessageId;
        }

        if (message.quotedWhatsappMsgId) {
          return (
            messagesByWhatsappId.get(
              message.quotedWhatsappMsgId
            ) ?? null
          );
        }

        return null;

      },
      [messagesByWhatsappId]
    );

  const scrollToMessage =
    useCallback(
      (messageId) => {

        if (!messageId) {
          return false;
        }

        const element =
          messageRefsRef.current.get(
            messageId
          );

        if (!element) {
          return false;
        }

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setHighlightedMessageId(
          messageId
        );

        if (highlightTimeoutRef.current) {
          clearTimeout(
            highlightTimeoutRef.current
          );
        }

        highlightTimeoutRef.current =
          setTimeout(() => {
            setHighlightedMessageId(
              null
            );
          }, 2000);

        return true;

      },
      []
    );

  const handleGoToQuotedMessage =
    useCallback(
      (message) => {

        const targetId =
          resolveQuotedMessageId(
            message
          );

        scrollToMessage(targetId);

      },
      [
        resolveQuotedMessageId,
        scrollToMessage,
      ]
    );

  const getQuotedAuthorLabel =
    useCallback(
      (message) => {

        const quotedId =
          resolveQuotedMessageId(
            message
          );

        if (quotedId) {
          const sourceMessage =
            messages.find(
              (item) =>
                item.id === quotedId
            );

          if (sourceMessage) {
            return sourceMessage.fromMe
              ? "Você"
              : (
                  conversation?.client
                    ?.name ||
                  "Cliente"
                );
          }
        }

        if (message.quotedFromMe) {
          return "Você";
        }

        return (
          conversation?.client?.name ||
          "Cliente"
        );

      },
      [
        messages,
        conversation,
        resolveQuotedMessageId,
      ]
    );

  useEffect(() => {

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(
          highlightTimeoutRef.current
        );
      }
    };

  }, []);

  const markedReadRef =
    useRef(null);

  async function fetchMessages(
    id
  ) {

    const response =
      await api.get(
        `/messages/${id}`
      );

    return response.data;
  }

  async function markAsRead(
    id,
    { force = false } = {}
  ) {

    if (
      !force &&
      markedReadRef.current === id
    ) {
      return;
    }

    await api.post(
      `/conversations/${id}/read`
    );

    markedReadRef.current = id;

    onSidebarRefresh?.();
  }

  useEffect(() => {

    markedReadRef.current = null;
    setLinkPhoneValue("");
    messageRefsRef.current.clear();
    setHighlightedMessageId(null);
    setHasOlderMessages(true);
    setIsLoadingOlder(false);
    restoreScrollHeightRef.current = null;

    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function load() {

      setIsLoading(true);

      try {

        const data =
          await fetchMessages(
            conversationId
          );

        if (cancelled) return;

        setMessages(data);

        await markAsRead(
          conversationId
        );

      } catch (error) {

        console.error(
          "Erro ao carregar mensagens",
          error
        );

      } finally {

        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };

  }, [conversationId]);

  async function handleLoadOlderMessages() {

    if (
      !conversationId ||
      isLoadingOlder ||
      !hasOlderMessages
    ) {
      return;
    }

    const container =
      messagesContainerRef.current;

    if (container) {
      restoreScrollHeightRef.current =
        container.scrollHeight;
    }

    setIsLoadingOlder(true);

    try {
      const result =
        await syncOlderMessages(
          conversationId
        );

      if (
        !result?.saved ||
        result.saved === 0
      ) {
        setHasOlderMessages(false);
        restoreScrollHeightRef.current =
          null;
        return;
      }

      const data =
        await fetchMessages(
          conversationId
        );

      setMessages(data);

      if (!result.hasMore) {
        setHasOlderMessages(false);
      }
    } catch (loadError) {

      console.error(
        "Erro ao carregar mensagens antigas",
        loadError
      );

      restoreScrollHeightRef.current =
        null;

    } finally {

      setIsLoadingOlder(false);
    }
  }

  useEffect(() => {

    if (!conversationId) {
      return;
    }

    function handleEscape(
      event
    ) {

      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (showQuickReplies) {
        setShowQuickReplies(false);
        return;
      }

      onCloseConversation?.();
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };

  }, [
    conversationId,
    showQuickReplies,
    onCloseConversation,
  ]);

  useEffect(() => {

    api
      .get("/ai/status")
      .then((response) => {
        setAiConfigured(
          response.data.configured
        );
      })
      .catch(() => {
        setAiConfigured(false);
      });

    listQuickReplies({
      active: "true",
    })
      .then(setQuickReplies)
      .catch(() => {
        setQuickReplies([]);
      });

  }, []);

  useLayoutEffect(() => {

    const container =
      messagesContainerRef.current;

    const previousHeight =
      restoreScrollHeightRef.current;

    if (
      previousHeight != null &&
      container
    ) {
      const delta =
        container.scrollHeight -
        previousHeight;

      container.scrollTop = delta;

      restoreScrollHeightRef.current = null;
      return;
    }

    if (!isLoading && messages.length) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "auto",
      });
    }

  }, [messages, isLoading]);

  useEffect(() => {

    if (!conversationId) return;

    async function handleNewMessage({
      conversationId: incomingId,
    }) {

      if (
        incomingId !== conversationId
      ) {

        return;
      }

      try {

        const data =
          await fetchMessages(
            conversationId
          );

        setMessages(data);

        await markAsRead(
          conversationId,
          { force: true }
        );

      } catch (error) {

        console.error(
          "Erro ao atualizar mensagens",
          error
        );
      }
    }

    const socket = getSocket();

    if (!socket) {
      return;
    }

    socket.on(
      "new-message",
      handleNewMessage
    );

    return () => {

      socket.off(
        "new-message",
        handleNewMessage
      );
    };

  }, [conversationId]);

  useEffect(() => {
    setReplyingTo(null);
    setForwardMessage(null);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      cleanupRecording(false);
    };
  }, [conversationId]);

  function getSupportedAudioMimeType() {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    return (
      candidates.find((type) =>
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
      ) || ""
    );
  }

  function cleanupRecording(
    sendAfterStop
  ) {
    if (recordingIntervalRef.current) {
      clearInterval(
        recordingIntervalRef.current
      );
      recordingIntervalRef.current = null;
    }

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.onstop = () => {
        const mimeType =
          recorder.mimeType ||
          getSupportedAudioMimeType() ||
          "audio/webm";

        const blob = new Blob(
          audioChunksRef.current,
          { type: mimeType }
        );

        audioChunksRef.current = [];

        if (
          sendAfterStop &&
          blob.size > 0
        ) {
          const extension =
            mimeType.includes("ogg")
              ? "ogg"
              : mimeType.includes("mp4")
                ? "m4a"
                : "webm";

          const file = new File(
            [blob],
            `audio-${Date.now()}.${extension}`,
            { type: mimeType }
          );

          sendMediaFile(file);
        }
      };

      recorder.stop();
    } else {
      audioChunksRef.current = [];
    }

    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  }

  async function toggleAudioRecording() {
    if (
      !conversationId ||
      isSending ||
      isGeneratingAi ||
      isUploadingMedia
    ) {
      return;
    }

    if (isRecording) {
      cleanupRecording(true);
      return;
    }

    if (!window.isSecureContext) {
      alert(
        "Gravação de áudio só funciona em localhost ou HTTPS. Acesse pelo endereço http://localhost:5173"
      );
      return;
    }

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      alert(
        "Seu navegador não suporta gravação de áudio."
      );
      return;
    }

    const mimeType =
      getSupportedAudioMimeType();

    if (!mimeType) {
      alert(
        "Formato de áudio não suportado neste navegador."
      );
      return;
    }

    try {
      if (
        navigator.permissions?.query
      ) {
        try {
          const permission =
            await navigator.permissions.query(
              { name: "microphone" }
            );

          if (
            permission.state ===
            "denied"
          ) {
            alert(
              "Microfone bloqueado neste site. Clique no cadeado ao lado do endereço → Microfone → Permitir, e recarregue a página."
            );
            return;
          }
        } catch {
          // Permission API indisponível neste navegador
        }
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          { audio: true }
        );

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder =
        new MediaRecorder(stream, {
          mimeType,
        });

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onerror = () => {
        alert(
          "Erro ao gravar áudio. Tente novamente."
        );
        cleanupRecording(false);
      };

      mediaRecorderRef.current =
        recorder;

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current =
        setInterval(() => {
          setRecordingSeconds(
            (seconds) => seconds + 1
          );
        }, 1000);
    } catch (error) {
      console.error(
        "Erro ao acessar microfone",
        error
      );

      const name =
        error?.name || "";

      if (
        name === "NotAllowedError" ||
        name ===
          "PermissionDeniedError"
      ) {
        alert(
          "Permita o acesso ao microfone quando o navegador pedir. É necessário só uma vez por site."
        );
      } else if (
        name === "NotFoundError"
      ) {
        alert(
          "Nenhum microfone encontrado. Conecte um microfone ou use o 📎 para enviar um arquivo de áudio."
        );
      } else {
        alert(
          "Não foi possível usar o microfone. Tente recarregar a página ou envie um áudio pelo 📎."
        );
      }

      cleanupRecording(false);
    }
  }

  function formatRecordingTime(
    totalSeconds
  ) {
    const minutes = Math.floor(
      totalSeconds / 60
    );
    const seconds =
      totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  async function sendMediaFile(
    file
  ) {

    if (
      !file ||
      !conversationId ||
      isUploadingMedia ||
      isSending
    ) {
      return;
    }

    const maxBytes = 16 * 1024 * 1024;

    if (file.size > maxBytes) {
      alert(
        "Arquivo muito grande. Limite de 16 MB."
      );
      return;
    }

    setIsUploadingMedia(true);

    try {
      const base64 =
        await new Promise(
          (resolve, reject) => {
            const reader =
              new FileReader();

            reader.onload = () =>
              resolve(reader.result);

            reader.onerror = reject;

            reader.readAsDataURL(file);
          }
        );

      await api.post(
        "/send-media",
        {
          conversationId,
          mimeType:
            file.type ||
            "application/octet-stream",
          fileName: file.name,
          media: base64,
          replyToMessageId:
            replyingTo?.id,
        }
      );

      setReplyingTo(null);

      const data =
        await fetchMessages(
          conversationId
        );

      setMessages(data);
      onSidebarRefresh?.();
    } catch (error) {
      console.error(
        "Erro ao enviar mídia",
        error
      );

      const status =
        error?.response?.status;

      const data =
        error?.response?.data;

      const message =
        data?.message ||
        (status === 413
          ? "Arquivo muito grande para o servidor. Tente uma imagem menor (até 16 MB)."
          : data?.error) ||
        "Não foi possível enviar a mídia.";

      alert(message);
    } finally {
      setIsUploadingMedia(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileSelect(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (file) {
      sendMediaFile(file);
    }
  }

  async function sendMessage(
    overrideText
  ) {

    const messageText = (
      overrideText ?? text
    ).trim();

    if (
      !messageText ||
      !conversationId ||
      isSending
    ) {

      return;
    }

    const tempId =
      `temp-${Date.now()}`;

    setText("");
    setShowQuickReplies(false);

    setMessages((prev) => [
      ...prev,

      {
        id: tempId,

        content: messageText,

        fromMe: true,

        createdAt:
          new Date().toISOString(),

        pending: true,
      },
    ]);

    setIsSending(true);

    try {

      await api.post(
        "/send-message",
        {
          conversationId,

          text: messageText,

          replyToMessageId:
            replyingTo?.id,
        }
      );

      setReplyingTo(null);

      const data =
        await fetchMessages(
          conversationId
        );

      setMessages(data);

      onSidebarRefresh?.();

    } catch (error) {

      console.error(
        "Erro ao enviar mensagem",
        error
      );

      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== tempId
        )
      );

      setText(messageText);

      const apiMessage =
        error?.response?.data?.message;

      alert(
        apiMessage ||
          "Não foi possível enviar a mensagem no WhatsApp."
      );

    } finally {

      setIsSending(false);
    }
  }

  function handleReplyToMessage(
    message
  ) {
    setReplyingTo(message);
    setShowQuickReplies(false);
  }

  async function handleOpenForward(
    message
  ) {
    setForwardMessage(message);

    try {
      const data =
        await fetchConversations();

      setAllConversations(data);
    } catch (error) {
      console.error(
        "Erro ao carregar conversas",
        error
      );

      alert(
        "Não foi possível carregar as conversas."
      );

      setForwardMessage(null);
    }
  }

  async function handleConfirmForward(
    targetConversationId
  ) {
    if (
      !forwardMessage ||
      isForwarding
    ) {
      return;
    }

    setIsForwarding(true);

    try {
      await forwardMessageApi(
        forwardMessage.id,
        targetConversationId
      );

      setForwardMessage(null);
      onSidebarRefresh?.();

      if (
        targetConversationId ===
        conversationId
      ) {
        const data =
          await fetchMessages(
            conversationId
          );

        setMessages(data);
      }

      alert(
        "Mensagem encaminhada com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao encaminhar",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Não foi possível encaminhar a mensagem."
      );
    } finally {
      setIsForwarding(false);
    }
  }

  async function handleDeleteForEveryone(
    message
  ) {
    const confirmed =
      window.confirm(
        "Apagar esta mídia para todos? A mensagem será removida do WhatsApp do cliente e do chat."
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMessageForEveryone(
        message.id
      );

      setMessages((prev) =>
        prev.filter(
          (item) =>
            item.id !== message.id
        )
      );

      onSidebarRefresh?.();
    } catch (error) {
      console.error(
        "Erro ao apagar mensagem",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Não foi possível apagar a mensagem para todos."
      );
    }
  }

  function findQuickReplyByCommand(
    value
  ) {

    if (
      !value.startsWith("/")
    ) {
      return null;
    }

    const command =
      value
        .slice(1)
        .trim()
        .toLowerCase();

    if (!command) {
      return null;
    }

    return (
      quickReplies.find(
        (reply) =>
          reply.shortcut === command
      ) ??
      quickReplies.find(
        (reply) =>
          reply.title
            .toLowerCase()
            .includes(command)
      ) ??
      null
    );
  }

  function handleQuickReplySelect(
    reply
  ) {
    sendMessage(reply.content);
  }

  function handleTextChange(
    value
  ) {
    setText(value);

    if (value.startsWith("/")) {
      setShowQuickReplies(true);
      return;
    }

    if (!value.trim()) {
      setShowQuickReplies(false);
    }
  }

  async function linkPhone() {

    if (
      !conversationId ||
      !linkPhoneValue.trim() ||
      isLinkingPhone
    ) {
      return;
    }

    setIsLinkingPhone(true);

    try {

      const { data } =
        await api.post(
          `/conversations/${conversationId}/link-phone`,
          {
            phone:
              linkPhoneValue.trim(),
          }
        );

      onConversationUpdate?.(
        data.conversation
      );

      onSidebarRefresh?.();

      setLinkPhoneValue("");

      alert(
        "Número vinculado! Agora você pode enviar mensagens no WhatsApp."
      );

    } catch (error) {

      const apiMessage =
        error?.response?.data?.message;

      alert(
        apiMessage ||
          "Não foi possível vincular o número."
      );

    } finally {

      setIsLinkingPhone(false);
    }
  }

  async function generateAiReply() {

    if (
      !conversationId ||
      isGeneratingAi ||
      isSending
    ) {

      return;
    }

    setIsGeneratingAi(true);

    try {

      const { data } =
        await api.post(
          `/conversations/${conversationId}/ai-reply`
        );

      const refreshed =
        await fetchMessages(
          conversationId
        );

      setMessages(refreshed);

      onSidebarRefresh?.();

      if (data?.warning) {
        alert(data.warning);
      }

    } catch (error) {

      console.error(
        "Erro ao gerar resposta IA",
        error
      );

      const apiMessage =
        error?.response?.data?.message;

      alert(
        apiMessage ||
          "Não foi possível gerar resposta com IA. Verifique GEMINI_API_KEY no backend."
      );

    } finally {

      setIsGeneratingAi(false);
    }
  }

  function handleKeyDown(e) {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      const matchedReply =
        findQuickReplyByCommand(text);

      if (matchedReply) {
        sendMessage(
          matchedReply.content
        );
        return;
      }

      sendMessage();
      return;
    }

    if (e.key === "Escape") {
      setShowQuickReplies(false);
    }
  }

  if (!conversation) {

    return (
      <div
        className={`
          flex-1
          min-w-0
          bg-[#efeae2]
          rounded-r-3xl
          flex
          flex-col
          items-center
          justify-center
          text-zinc-500
          gap-2
          ${className}
        `}
      >

        <p className="
          text-lg
          font-medium
          text-zinc-600
        ">
          EstheticFlow Chat
        </p>

        <p className="text-sm">
          Selecione uma conversa para começar
        </p>

      </div>
    );
  }

  return (
    <div
      className={`
        @container
        flex-1
        flex
        flex-col
        bg-[#efeae2]
        min-w-0
        overflow-hidden
        ${className}
      `}
    >

      <header className="
        min-h-20
        bg-white
        border-b
        border-zinc-200
        px-4
        xl:px-6
        py-3
        flex
        items-center
        gap-3
        shrink-0
        min-w-0
      ">

        <button
          type="button"
          onClick={onCloseConversation}
          className="
            xl:hidden
            shrink-0
            rounded-xl
            p-2
            text-zinc-600
            transition
            hover:bg-zinc-100
            hover:text-rose-600
          "
          title="Voltar às conversas"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="
          w-11
          h-11
          xl:w-12
          xl:h-12
          rounded-full
          bg-rose-100
          flex
          items-center
          justify-center
          font-semibold
          text-rose-500
        ">

          {
            conversation.client.name
              .charAt(0)
          }

        </div>

        <div className="
          flex-1
          min-w-0
        ">

          <h2 className="
            font-semibold
            text-zinc-800
            truncate
          ">
            {conversation.client.name}
          </h2>

          <p className="
            text-sm
            text-zinc-500
            truncate
          ">
            {conversation.client.phone}
          </p>

          <p className="
            hidden
            xl:block
            text-xs
            text-zinc-400
            mt-0.5
          ">
            ESC para voltar
          </p>

        </div>

        <Link
          to={`/appointments?clientId=${conversation.client.id}&new=1`}
          className="
            inline-flex
            shrink-0
            items-center
            gap-2
            rounded-xl
            border
            border-zinc-200
            px-2.5
            py-2
            text-sm
            font-medium
            text-zinc-700
            transition
            hover:border-rose-200
            hover:bg-rose-50
            hover:text-rose-600
            xl:px-3
          "
        >

          <CalendarDays size={16} />

          <span className="hidden sm:inline">
            Agendar
          </span>

        </Link>

      </header>

      {needsPhoneLink && (

        <div className="
          bg-amber-50
          border-b
          border-amber-200
          px-6
          py-3
          shrink-0
        ">

          <p className="
            text-sm
            font-medium
            text-amber-900
            mb-1
          ">
            Vincule o telefone do cliente
          </p>

          <p className="
            text-sm
            text-amber-800
            mb-2
          ">
            Não temos o número deste contato — o WhatsApp não exibiu o celular
            (comum em mensagens de quem ainda não está na sua agenda).
            Informe o telefone com DDD para poder enviar mensagens.
          </p>

          <div className="
            flex
            gap-2
          ">

            <input
              type="tel"
              value={linkPhoneValue}
              onChange={(e) =>
                setLinkPhoneValue(
                  e.target.value
                )
              }
              placeholder="Ex: 31999887766 (com DDD)"
              className="
                flex-1
                rounded-xl
                border
                border-amber-300
                bg-white
                px-3
                py-2
                text-sm
                outline-none
                focus:border-amber-500
              "
            />

            <button
              type="button"
              onClick={linkPhone}
              disabled={
                isLinkingPhone ||
                !linkPhoneValue.trim()
              }
              className="
                rounded-xl
                bg-amber-600
                px-4
                py-2
                text-sm
                font-medium
                text-white
                disabled:opacity-50
              "
            >
              {isLinkingPhone
                ? "Vinculando..."
                : "Vincular telefone"}
            </button>

          </div>

        </div>

      )}

      <div
        ref={messagesContainerRef}
        className="
          flex-1
          overflow-x-hidden
          overflow-y-auto
          p-6
          space-y-3
          min-h-0
        "
      >

        {!isLoading &&
          messages.length > 0 &&
          hasOlderMessages && (
            <div className="
              flex
              justify-center
              pb-2
            ">
              <button
                type="button"
                onClick={
                  handleLoadOlderMessages
                }
                disabled={isLoadingOlder}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-zinc-200
                  bg-white
                  px-4
                  py-1.5
                  text-xs
                  font-medium
                  text-zinc-600
                  shadow-sm
                  transition
                  hover:bg-zinc-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isLoadingOlder ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Sincronizando antigas...
                  </>
                ) : (
                  <>
                    <ChevronUp size={14} />
                    Carregar mensagens mais antigas
                  </>
                )}
              </button>
            </div>
          )}

        {isLoading ? (

          <div className="
            flex
            flex-col
            items-center
            justify-center
            h-full
            gap-3
            text-zinc-500
          ">

            <Loader2
              className="
                animate-spin
                text-rose-500
              "
              size={28}
            />

            <span className="text-sm">
              Carregando mensagens...
            </span>

          </div>

        ) : messages.length === 0 ? (

          <div className="
            flex
            items-center
            justify-center
            h-full
            text-sm
            text-zinc-500
          ">
            Nenhuma mensagem ainda. Envie a primeira!
          </div>

        ) : (

          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReply={
                handleReplyToMessage
              }
              onForward={
                handleOpenForward
              }
              onDeleteForEveryone={
                handleDeleteForEveryone
              }
              onQuotedClick={() =>
                handleGoToQuotedMessage(
                  message
                )
              }
              canNavigateToQuoted={Boolean(
                resolveQuotedMessageId(
                  message
                )
              )}
              isHighlighted={
                highlightedMessageId ===
                message.id
              }
              messageRef={(element) => {
                if (element) {
                  messageRefsRef.current.set(
                    message.id,
                    element
                  );
                } else {
                  messageRefsRef.current.delete(
                    message.id
                  );
                }
              }}
              quotedAuthorLabel={getQuotedAuthorLabel(
                message
              )}
            />
          ))

        )}

        <div ref={messagesEndRef} />

      </div>

      <div className="shrink-0 min-w-0 bg-white border-t border-zinc-200">
        <ForwardMessageModal
          open={Boolean(forwardMessage)}
          message={forwardMessage}
          conversations={allConversations}
          currentConversationId={
            conversationId
          }
          onClose={() =>
            setForwardMessage(null)
          }
          onConfirm={
            handleConfirmForward
          }
          isSubmitting={isForwarding}
        />

        {replyingTo && (
          <div className="
            flex
            items-start
            gap-3
            border-b
            border-zinc-200
            px-4
            py-3
            bg-rose-50/60
          ">
            <Reply
              size={16}
              className="
                mt-0.5
                shrink-0
                text-rose-500
              "
            />

            <button
              type="button"
              onClick={() =>
                scrollToMessage(
                  replyingTo.id
                )
              }
              title="Ir até a mensagem"
              className="
                min-w-0
                flex-1
                text-left
                rounded-lg
                px-1
                py-0.5
                -mx-1
                transition
                hover:bg-rose-100/80
              "
            >
              <p className="
                text-xs
                font-medium
                text-rose-600
              ">
                Respondendo
              </p>

              <p className="
                mt-0.5
                text-sm
                text-zinc-700
                line-clamp-2
                whitespace-pre-wrap
              ">
                {replyingTo.content}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setReplyingTo(null)
              }
              className="
                rounded-lg
                p-1.5
                text-zinc-500
                hover:bg-white
              "
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showQuickReplies && (
          <QuickRepliesPanel
            replies={quickReplies}
            filter={text}
            onSelect={handleQuickReplySelect}
            onClose={() =>
              setShowQuickReplies(false)
            }
            disabled={
              isSending ||
              isGeneratingAi ||
              !conversationId
            }
          />
        )}

      <footer className="
        p-3
        min-w-0
        flex
        flex-col
        gap-2
        shrink-0
        @[480px]:flex-row
        @[480px]:items-center
        @[480px]:gap-2
      ">

        <input
          value={text}

          onChange={(e) =>
            handleTextChange(
              e.target.value
            )
          }

          onKeyDown={handleKeyDown}

          disabled={
            isSending ||
            isGeneratingAi ||
            isUploadingMedia ||
            isRecording
          }

          placeholder={
            isRecording
              ? `Gravando... ${formatRecordingTime(recordingSeconds)}`
              : "Digite uma mensagem..."
          }

          className="
            order-1
            w-full
            min-w-0
            h-11
            rounded-xl
            bg-zinc-100
            px-4
            outline-none
            focus:ring-2
            focus:ring-rose-200
            disabled:opacity-60
            @[480px]:order-2
            @[480px]:flex-1
            @[480px]:h-12
          "
        />

        <div className="
          order-2
          flex
          min-w-0
          items-center
          justify-between
          gap-2
          @[480px]:contents
        ">

        <div className="
          flex
          items-center
          gap-1.5
          shrink-0
          @[480px]:order-1
          @[480px]:gap-2
        ">

        <button
          type="button"
          onClick={generateAiReply}
          disabled={
            !aiConfigured ||
            isGeneratingAi ||
            isSending ||
            isRecording ||
            !conversationId
          }
          title={
            aiConfigured
              ? "Gerar resposta com IA"
              : "Configure GEMINI_API_KEY no backend"
          }
          className="
            w-10
            h-10
            shrink-0
            rounded-xl
            border
            border-rose-200
            bg-rose-50
            text-rose-500
            flex
            items-center
            justify-center
            hover:bg-rose-100
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
            @[480px]:w-12
            @[480px]:h-12
          "
        >

          {isGeneratingAi ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Sparkles size={18} />
          )}

        </button>

        <button
          type="button"
          onClick={() =>
            setShowQuickReplies(
              (open) => !open
            )
          }
          disabled={
            isSending ||
            isGeneratingAi ||
            isRecording ||
            !conversationId
          }
          title="Respostas rápidas"
          className="
            w-10
            h-10
            shrink-0
            rounded-xl
            border
            border-zinc-200
            bg-white
            text-zinc-600
            flex
            items-center
            justify-center
            hover:bg-zinc-50
            hover:text-rose-600
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
            @[480px]:w-12
            @[480px]:h-12
          "
        >
          <Zap size={18} />
        </button>

        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="
          flex
          items-center
          gap-1.5
          shrink-0
          @[480px]:order-3
          @[480px]:gap-2
        ">

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={
            isSending ||
            isGeneratingAi ||
            isUploadingMedia ||
            isRecording ||
            !conversationId
          }
          title="Enviar imagem ou documento (até 16 MB)"
          className="
            w-10
            h-10
            shrink-0
            rounded-xl
            border
            border-zinc-200
            bg-white
            text-zinc-600
            flex
            items-center
            justify-center
            hover:bg-zinc-50
            hover:text-rose-600
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
            @[480px]:w-12
            @[480px]:h-12
          "
        >
          {isUploadingMedia ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        <button
          type="button"
          onClick={toggleAudioRecording}
          disabled={
            isSending ||
            isGeneratingAi ||
            isUploadingMedia ||
            !conversationId
          }
          title={
            isRecording
              ? "Parar e enviar áudio"
              : "Gravar áudio (o navegador pedirá permissão do microfone)"
          }
          className={`
            w-10
            h-10
            shrink-0
            rounded-xl
            border
            flex
            items-center
            justify-center
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
            @[480px]:w-12
            @[480px]:h-12
            ${
              isRecording
                ? "border-red-300 bg-red-50 text-red-600 animate-pulse"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-rose-600"
            }
          `}
        >
          {isRecording ? (
            <Square size={16} />
          ) : (
            <Mic size={18} />
          )}
        </button>

        <button
          onClick={() => sendMessage()}

          disabled={
            isSending ||
            isGeneratingAi ||
            isUploadingMedia ||
            isRecording ||
            !text.trim()
          }

          className="
            w-10
            h-10
            shrink-0
            rounded-xl
            bg-rose-500
            text-white
            flex
            items-center
            justify-center
            hover:bg-rose-600
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
            @[480px]:w-12
            @[480px]:h-12
          "
        >

          {isSending ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Send size={18} />
          )}

        </button>

        </div>

        </div>

      </footer>

      <p className="
        hidden
        @[520px]:block
        px-4
        pb-3
        text-center
        text-xs
        text-zinc-400
      ">
        Enter para enviar · ⋮ responder/encaminhar · 📎 anexo · 🎤 gravar
      </p>

      </div>

    </div>
  );
}
