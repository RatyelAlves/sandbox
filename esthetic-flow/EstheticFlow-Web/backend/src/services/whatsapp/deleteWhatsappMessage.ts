import { env } from "../../config/env";

import {
  getEvolutionApiKey,
  getEvolutionInstance,
} from "./evolutionApi";

type DeleteMessageKey = {
  remoteJid: string;
  fromMe: boolean;
  id: string;
};

export async function deleteWhatsappMessageForEveryone(
  key: DeleteMessageKey
) {

  const response = await fetch(
    `${env.evolutionApiUrl}/chat/deleteMessageForEveryone/${getEvolutionInstance()}`,
    {
      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json",
        apikey:
          getEvolutionApiKey(),
      },

      body: JSON.stringify({
        remoteJid: key.remoteJid,
        fromMe: key.fromMe,
        id: key.id,
      }),
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
