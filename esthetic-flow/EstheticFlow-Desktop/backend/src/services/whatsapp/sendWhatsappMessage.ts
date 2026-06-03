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

async function sendEvolutionText(
  number: string,
  text: string,
  quoted?: EvolutionQuoted
) {

  const body: Record<string, unknown> = {
    number,
    text,
  };

  if (quoted) {
    body.quoted = quoted;
  }

  const response = await fetch(
    `${env.evolutionApiUrl}/message/sendText/${getEvolutionInstance()}`,
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

function buildLidSendCandidates(
  lidJid: string
) {

  const local =
    lidJid.split("@")[0];

  return [
    lidJid,
    local,
    `${local}@lid`,
  ];
}

export async function sendWhatsappMessage(
  jidOrNumber: string,
  text: string,
  pushName?: string | null,
  quoted?: EvolutionQuoted
) {

  let targetJid = jidOrNumber;

  if (isLidJid(targetJid)) {
    const resolved =
      await resolvePhoneJidFromEvolution(
        targetJid,
        pushName
      );

    if (resolved) {
      targetJid = resolved;
    } else {
      console.warn(
        "LID sem número resolvido, tentando envio direto:",
        targetJid
      );

      let lastError: unknown;

      for (const candidate of buildLidSendCandidates(
        targetJid
      )) {

        try {

          const data =
            await sendEvolutionText(
              candidate,
              text,
              quoted
            );

          console.log(
            "Envio @lid direto OK:",
            candidate
          );

          return data;

        } catch (error) {

          lastError = error;

          console.warn(
            "Falha envio @lid:",
            candidate,
            error
          );
        }
      }

      throw new Error(
        lastError instanceof Error
          ? lastError.message === "Bad Request"
            ? "Contato @lid sem número WhatsApp. Vincule o telefone real do cliente no chat (banner amarelo) para enviar mensagens."
            : lastError.message
          : "Contato @lid sem número WhatsApp. Vincule o telefone real do cliente no chat."
      );
    }
  }

  const number =
    jidToEvolutionNumber(targetJid);

  const data =
    await sendEvolutionText(
      number,
      text,
      quoted
    );

  console.log(
    "EVOLUTION RESPONSE:"
  );

  console.log(
    JSON.stringify(
      data,
      null,
      2
    )
  );

  return data;
}
