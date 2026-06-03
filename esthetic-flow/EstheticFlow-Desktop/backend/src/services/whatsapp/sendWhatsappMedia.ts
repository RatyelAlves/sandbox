import { env } from "../../config/env";

import {
  isLidJid,
  jidToEvolutionNumber,
} from "./jid";

import {
  resolvePhoneJidFromEvolution,
} from "./resolveLidContact";

import {
  getEvolutionApiKey,
  getEvolutionInstance,
} from "./evolutionApi";

import {
  EvolutionQuoted,
} from "./buildQuotedPayload";

export type OutboundMediaInput = {
  mediatype:
    | "image"
    | "video"
    | "document"
    | "audio";
  mimetype: string;
  media: string;
  fileName?: string;
  caption?: string;
};

async function resolveTargetNumber(
  jidOrNumber: string,
  pushName?: string | null
) {

  let targetJid = jidOrNumber;

  if (isLidJid(targetJid)) {
    const resolved =
      await resolvePhoneJidFromEvolution(
        targetJid,
        pushName
      );

    if (!resolved) {
      throw new Error(
        "Contato @lid sem número WhatsApp. Vincule o telefone real do cliente no chat."
      );
    }

    targetJid = resolved;
  }

  return jidToEvolutionNumber(targetJid);
}

async function postEvolution(
  endpoint: string,
  body: Record<string, unknown>
) {

  const response = await fetch(
    `${env.evolutionApiUrl}${endpoint}/${getEvolutionInstance()}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        apikey:
          getEvolutionApiKey(),
      },

      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Evolution API retornou ${response.status}`
    );
  }

  return data;
}

export async function sendWhatsappMedia(
  jidOrNumber: string,
  input: OutboundMediaInput,
  pushName?: string | null,
  quoted?: EvolutionQuoted
) {

  const number =
    await resolveTargetNumber(
      jidOrNumber,
      pushName
    );

  if (input.mediatype === "audio") {
    const audioBody: Record<string, unknown> = {
      number,
      audio: input.media,
    };

    if (quoted) {
      audioBody.quoted = quoted;
    }

    return postEvolution(
      "/message/sendWhatsAppAudio",
      audioBody
    );
  }

  const mediaBody: Record<string, unknown> = {
    number,
    mediatype: input.mediatype,
    mimetype: input.mimetype,
    media: input.media,
    fileName: input.fileName,
    caption: input.caption || "",
  };

  if (quoted) {
    mediaBody.quoted = quoted;
  }

  return postEvolution(
    "/message/sendMedia",
    mediaBody
  );
}

export function inferOutboundMediaType(
  mimeType: string
): OutboundMediaInput["mediatype"] {

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
}
