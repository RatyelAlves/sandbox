export type ParsedWhatsappMessage = {
  messageType:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "sticker";
  content: string;
  mimeType?: string;
  fileName?: string;
  isMedia: boolean;
  quotedWhatsappMsgId?: string;
  quotedContent?: string;
  quotedFromMe?: boolean;
  quotedMessageType?: string;
};

function pickCaption(
  caption?: string | null
) {
  return caption?.trim() || "";
}

type ContextInfo = {
  stanzaId?: string;
  participant?: string;
  quotedMessage?: Record<string, unknown>;
};

function normalizeContextInfo(
  raw?: Record<string, unknown>
): ContextInfo | undefined {

  if (!raw) {
    return undefined;
  }

  const stanzaId =
    raw.stanzaId ??
    raw.stanzaID ??
    raw.quotedStanzaId;

  const participant =
    raw.participant ??
    raw.Participant;

  const quotedMessage =
    (raw.quotedMessage ??
      raw.QuotedMessage) as
      | Record<string, unknown>
      | undefined;

  if (
    !stanzaId &&
    !quotedMessage
  ) {
    return undefined;
  }

  return {
    stanzaId:
      typeof stanzaId === "string"
        ? stanzaId
        : undefined,
    participant:
      typeof participant === "string"
        ? participant
        : undefined,
    quotedMessage,
  };
}

function mergeContextInfo(
  ...sources: (
    | ContextInfo
    | undefined
  )[]
): ContextInfo | undefined {

  let merged:
    | ContextInfo
    | undefined;

  for (const source of sources) {
    if (!source) {
      continue;
    }

    merged = {
      stanzaId:
        source.stanzaId ??
        merged?.stanzaId,
      participant:
        source.participant ??
        merged?.participant,
      quotedMessage:
        source.quotedMessage ??
        merged?.quotedMessage,
    };
  }

  return merged;
}

function extractQuotedContent(
  quotedMessage?: Record<
    string,
    unknown
  >
) {

  if (!quotedMessage) {
    return undefined;
  }

  const conversation = (
    quotedMessage.conversation as
      | string
      | undefined
  )?.trim();

  if (conversation) {
    return conversation;
  }

  const extended = (
    quotedMessage.extendedTextMessage as
      | { text?: string }
      | undefined
  )?.text?.trim();

  if (extended) {
    return extended;
  }

  const imageCaption = (
    quotedMessage.imageMessage as
      | { caption?: string }
      | undefined
  )?.caption?.trim();

  if (imageCaption) {
    return imageCaption;
  }

  if (quotedMessage.imageMessage) {
    return "[Imagem]";
  }

  if (quotedMessage.videoMessage) {
    return "[Vídeo]";
  }

  if (quotedMessage.audioMessage) {
    return "[Áudio]";
  }

  if (quotedMessage.documentMessage) {
    const doc = quotedMessage.documentMessage as {
      fileName?: string;
      title?: string;
    };

    return `[Documento] ${
      doc.fileName ||
      doc.title ||
      "arquivo"
    }`;
  }

  if (quotedMessage.stickerMessage) {
    return "[Sticker]";
  }

  return "[Mensagem]";
}

function extractQuotedMessageType(
  quotedMessage?: Record<
    string,
    unknown
  >
) {

  if (!quotedMessage) {
    return undefined;
  }

  if (quotedMessage.conversation) {
    return "text";
  }

  if (
    quotedMessage.extendedTextMessage
  ) {
    return "text";
  }

  if (quotedMessage.imageMessage) {
    return "image";
  }

  if (quotedMessage.videoMessage) {
    return "video";
  }

  if (quotedMessage.audioMessage) {
    return "audio";
  }

  if (quotedMessage.documentMessage) {
    return "document";
  }

  if (quotedMessage.stickerMessage) {
    return "sticker";
  }

  return "text";
}

function extractQuotedInfo(
  contextInfo?: ContextInfo
) {

  if (
    !contextInfo?.stanzaId &&
    !contextInfo?.quotedMessage
  ) {
    return {};
  }

  const quotedContent =
    extractQuotedContent(
      contextInfo.quotedMessage
    );

  return {
    quotedWhatsappMsgId:
      contextInfo.stanzaId,
    quotedContent,
    quotedMessageType:
      extractQuotedMessageType(
        contextInfo.quotedMessage
      ),
  };
}

function getContextInfo(
  message: Record<string, unknown>,
  externalContextInfo?: Record<
    string,
    unknown
  >
): ContextInfo | undefined {

  const nested = mergeContextInfo(
    normalizeContextInfo(
      (
        message.extendedTextMessage as
          | { contextInfo?: Record<string, unknown> }
          | undefined
      )?.contextInfo
    ),
    normalizeContextInfo(
      (
        message.imageMessage as
          | { contextInfo?: Record<string, unknown> }
          | undefined
      )?.contextInfo
    ),
    normalizeContextInfo(
      (
        message.videoMessage as
          | { contextInfo?: Record<string, unknown> }
          | undefined
      )?.contextInfo
    ),
    normalizeContextInfo(
      (
        message.audioMessage as
          | { contextInfo?: Record<string, unknown> }
          | undefined
      )?.contextInfo
    ),
    normalizeContextInfo(
      (
        message.documentMessage as
          | { contextInfo?: Record<string, unknown> }
          | undefined
      )?.contextInfo
    ),
    normalizeContextInfo(
      (
        message.stickerMessage as
          | { contextInfo?: Record<string, unknown> }
          | undefined
      )?.contextInfo
    )
  );

  return mergeContextInfo(
    nested,
    normalizeContextInfo(
      externalContextInfo
    )
  );
}

function withQuotedInfo(
  parsed: Omit<
    ParsedWhatsappMessage,
    | "quotedWhatsappMsgId"
    | "quotedContent"
    | "quotedFromMe"
    | "quotedMessageType"
  >,
  message: Record<string, unknown>,
  externalContextInfo?: Record<
    string,
    unknown
  >
): ParsedWhatsappMessage {

  const quoted =
    extractQuotedInfo(
      getContextInfo(
        message,
        externalContextInfo
      )
    );

  return {
    ...parsed,
    ...quoted,
  };
}

export function parseWhatsappMessage(
  message: Record<string, unknown> | null | undefined,
  externalContextInfo?: Record<
    string,
    unknown
  >
): ParsedWhatsappMessage | null {

  if (!message) {
    return null;
  }

  const text =
    (message.conversation as string | undefined)?.trim() ||
    (
      message.extendedTextMessage as
        | { text?: string }
        | undefined
    )?.text?.trim() ||
    "";

  if (text) {
    return withQuotedInfo(
      {
        messageType: "text",
        content: text,
        isMedia: false,
      },
      message,
      externalContextInfo
    );
  }

  const imageMessage =
    message.imageMessage as
      | {
          caption?: string;
          mimetype?: string;
        }
      | undefined;

  if (imageMessage) {
    const caption =
      pickCaption(imageMessage.caption);

    return withQuotedInfo(
      {
        messageType: "image",
        content: caption || "[Imagem]",
        mimeType:
          imageMessage.mimetype ||
          "image/jpeg",
        isMedia: true,
      },
      message,
      externalContextInfo
    );
  }

  const stickerMessage =
    message.stickerMessage as
      | { mimetype?: string }
      | undefined;

  if (stickerMessage) {
    return withQuotedInfo(
      {
        messageType: "sticker",
        content: "[Sticker]",
        mimeType:
          stickerMessage.mimetype ||
          "image/webp",
        isMedia: true,
      },
      message,
      externalContextInfo
    );
  }

  const videoMessage =
    message.videoMessage as
      | {
          caption?: string;
          mimetype?: string;
        }
      | undefined;

  if (videoMessage) {
    const caption =
      pickCaption(videoMessage.caption);

    return withQuotedInfo(
      {
        messageType: "video",
        content: caption || "[Vídeo]",
        mimeType:
          videoMessage.mimetype ||
          "video/mp4",
        isMedia: true,
      },
      message,
      externalContextInfo
    );
  }

  const audioMessage =
    message.audioMessage as
      | { mimetype?: string }
      | undefined;

  if (audioMessage) {
    return withQuotedInfo(
      {
        messageType: "audio",
        content: "[Áudio]",
        mimeType:
          audioMessage.mimetype ||
          "audio/ogg",
        isMedia: true,
      },
      message,
      externalContextInfo
    );
  }

  const documentMessage =
    message.documentMessage as
      | {
          caption?: string;
          mimetype?: string;
          fileName?: string;
          title?: string;
        }
      | undefined;

  if (documentMessage) {
    const caption =
      pickCaption(documentMessage.caption);

    const fileName =
      documentMessage.fileName ||
      documentMessage.title ||
      "documento";

    return withQuotedInfo(
      {
        messageType: "document",
        content:
          caption || `[Documento] ${fileName}`,
        mimeType:
          documentMessage.mimetype ||
          "application/octet-stream",
        fileName,
        isMedia: true,
      },
      message,
      externalContextInfo
    );
  }

  return null;
}
