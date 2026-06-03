import { env } from "../../config/env";

import {
  getEvolutionApiKey,
  getEvolutionInstance,
} from "./evolutionApi";

type MessageKey = {
  remoteJid?: string;
  remoteJidAlt?: string;
  fromMe?: boolean;
  id?: string;
};

export type FetchedMedia = {
  base64: string;
  mimeType?: string;
  fileName?: string;
};

export async function fetchWhatsappMedia(
  messageKey: MessageKey,
  options?: {
    convertToMp4?: boolean;
  }
): Promise<FetchedMedia | null> {

  if (!messageKey.id) {
    return null;
  }

  const response = await fetch(
    `${env.evolutionApiUrl}/chat/getBase64FromMediaMessage/${getEvolutionInstance()}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        apikey:
          getEvolutionApiKey(),
      },

      body: JSON.stringify({
        message: {
          key: messageKey,
        },
        convertToMp4:
          options?.convertToMp4 ??
          false,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.warn(
      "Evolution getBase64FromMediaMessage:",
      data?.message ||
        data?.error ||
        response.status
    );

    return null;
  }

  const base64 =
    data?.base64 ||
    data?.data?.base64 ||
    data?.media?.base64;

  if (
    typeof base64 !== "string" ||
    !base64.length
  ) {
    return null;
  }

  return {
    base64,
    mimeType:
      data?.mimetype ||
      data?.mimeType ||
      data?.data?.mimetype,
    fileName:
      data?.fileName ||
      data?.data?.fileName,
  };
}
