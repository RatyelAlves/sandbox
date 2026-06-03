import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from "@google/generative-ai";

import { env }
from "../../config/env";

import {
  appointmentToolDeclarations,
  executeAppointmentTool,
} from "./appointmentTools";

import {
  parseGeminiError,
} from "./generateClinicReply";

import {
  getAvailabilitySummary,
  getCurrentDateInClinicTimezone,
} from "../appointment/availability.service";

import {
  getProceduresCatalogForAi,
} from "../procedure/procedure.service";

type HistoryMessage = {
  content: string;
  fromMe: boolean;
};

function buildSystemInstruction(
  clientName: string,
  availabilityPreview: string,
  proceduresCatalog: string
): string {

  const now =
    getCurrentDateInClinicTimezone();

  return `
Você é a assistente virtual da clínica de estética EstheticFlow no WhatsApp.

Data e hora atuais (Brasil): ${now}

Regras:
- Responda em português do Brasil, tom acolhedor e profissional
- Mensagens curtas (estilo WhatsApp)
- SEMPRE chame list_procedures quando o paciente perguntar serviços, preços, o que a clínica oferece ou quiser escolher um procedimento
- Informe preço e duração SOMENTE com base em list_procedures ou no catálogo abaixo — nunca invente valores
- Use durationMin do procedimento escolhido ao chamar list_available_slots e create_appointment
- SEMPRE chame list_available_slots quando o paciente mencionar um dia, data ou pedir horários
- Use fromDate no formato YYYY-MM-DD (ex: dia 26 de maio de 2026 → 2026-05-26)
- Ofereça SOMENTE horários retornados pela ferramenta (campo byDay ou slots)
- Se o paciente disser "dia 26", interprete como 26 do mês atual (${now}) e consulte a ferramenta
- NUNCA diga que não há horários sem chamar list_available_slots antes
- Só chame create_appointment após confirmação explícita de procedimento e horário exato (use o iso do slot)
- OBRIGATÓRIO: chame create_appointment ANTES de dizer "agendado", "confirmado" ou "marcado" ao paciente
- PROIBIDO confirmar agendamento só com texto — sem create_appointment com success=true o agendamento NÃO existe
- Use o campo "iso" exato retornado por list_available_slots no parâmetro date do create_appointment
- Se create_appointment falhar, informe o erro ao paciente e NÃO diga que está confirmado
- Após create_appointment com success=true, confirme data, hora e procedimento ao paciente
- Não invente preços ou diagnósticos médicos
- Use no máximo 1 emoji

Prévia de horários livres (pode estar desatualizada — confirme com a ferramenta):
${availabilityPreview}

Catálogo de procedimentos da clínica (confirme com list_procedures se necessário):
${proceduresCatalog}

Cliente: ${clientName}
`.trim();
}

function historyToContents(
  history: HistoryMessage[]
): Content[] {

  return history.map(
    (message) => ({
      role: message.fromMe
        ? "model"
        : "user",

      parts: [
        {
          text: message.content,
        },
      ],
    })
  );
}

function normalizeChatHistory(
  contents: Content[]
): Content[] {

  let start = 0;

  while (
    start < contents.length &&
    contents[start].role !== "user"
  ) {
    start++;
  }

  return contents.slice(start);
}

function splitChatPrompt(
  contents: Content[]
): {
  chatHistory: Content[];
  promptParts: Part[];
} {

  const normalized =
    normalizeChatHistory(contents);

  if (!normalized.length) {
    return {
      chatHistory: [],

      promptParts: [
        {
          text: "Olá",
        },
      ],
    };
  }

  const last =
    normalized[normalized.length - 1];

  if (last.role === "user") {
    return {
      chatHistory:
        normalized.slice(0, -1),

      promptParts:
        last.parts as Part[],
    };
  }

  return {
    chatHistory: normalized,

    promptParts: [
      {
        text:
          "Responda à última mensagem do cliente com base no histórico acima.",
      },
    ],
  };
}

function getModelCandidates(): string[] {

  const primary =
    env.geminiModel.trim();

  const fallbacks =
    env.geminiFallbackModels
      .split(",")
      .map((model) =>
        model.trim()
      )
      .filter(Boolean);

  const blockedForTools = [
    "gemini-flash-latest",
  ];

  return [
    ...new Set([
      primary,
      ...fallbacks,
    ]),
  ].filter(
    (model) =>
      !blockedForTools.includes(
        model
      )
  );
}

function looksLikeAppointmentConfirmation(
  text: string
): boolean {

  const lower =
    text.toLowerCase();

  return (
    /agendad|confirmad|marcad|reservad/.test(
      lower
    ) ||
    lower.includes(
      "horário confirmado"
    ) ||
    lower.includes(
      "consulta confirmada"
    )
  );
}

async function generateWithTools(
  modelName: string,
  clientId: string,
  clientName: string,
  history: HistoryMessage[]
): Promise<string> {

  const genAI =
    new GoogleGenerativeAI(
      env.geminiApiKey
    );

  const availabilityPreview =
    await getAvailabilitySummary(7);

  const proceduresCatalog =
    await getProceduresCatalogForAi();

  const model =
    genAI.getGenerativeModel({
      model: modelName,

      systemInstruction:
        buildSystemInstruction(
          clientName,
          availabilityPreview,
          proceduresCatalog
        ),

      tools: [
        {
          functionDeclarations:
            appointmentToolDeclarations,
        },
      ],
    });

  const contents =
    historyToContents(history);

  const {
    chatHistory,
    promptParts,
  } = splitChatPrompt(contents);

  const chat =
    model.startChat({
      history: chatHistory,
    });

  let response =
    await chat.sendMessage(
      promptParts
    );

  let appointmentCreated = false;

  for (
    let step = 0;
    step < 8;
    step++
  ) {

    const modelParts =
      response.response
        .candidates?.[0]
        ?.content?.parts ?? [];

    const functionCallParts =
      modelParts.filter(
        (part) =>
          Boolean(
            (
              part as {
                functionCall?: unknown;
              }
            ).functionCall
          )
      );

    if (
      !functionCallParts.length
    ) {
      break;
    }

    const functionResponseParts: Part[] =
      [];

    for (const part of functionCallParts) {

      const functionCall = (
        part as {
          functionCall: {
            name: string;
            args: Record<
              string,
              unknown
            >;
            id?: string;
          };
        }
      ).functionCall;

      const result =
        await executeAppointmentTool(
          functionCall.name,

          functionCall.args,

          clientId
        );

      console.log(
        "GEMINI TOOL:",
        functionCall.name,
        JSON.stringify(result)
      );

      if (
        functionCall.name ===
          "create_appointment" &&
        (
          result as {
            success?: boolean;
          }
        ).success
      ) {
        appointmentCreated = true;
      }

      functionResponseParts.push({
        functionResponse: {
          name:
            functionCall.name,

          response: result,

          ...(functionCall.id
            ? {
                id: functionCall.id,
              }
            : {}),
        },
      } as Part);
    }

    response =
      await chat.sendMessage(
        functionResponseParts
      );
  }

  let text =
    response.response
      .text()
      .trim();

  if (
    !appointmentCreated &&
    looksLikeAppointmentConfirmation(
      text
    )
  ) {

    console.warn(
      "GEMINI confirmou agendamento sem create_appointment — forçando nova tentativa"
    );

    response =
      await chat.sendMessage(
        "ERRO INTERNO: você confirmou agendamento mas não chamou create_appointment. Chame create_appointment AGORA com procedure, date (ISO exato do slot) e só então responda ao paciente."
      );

    for (
      let step = 0;
      step < 4;
      step++
    ) {

      const modelParts =
        response.response
          .candidates?.[0]
          ?.content?.parts ?? [];

      const functionCallParts =
        modelParts.filter(
          (part) =>
            Boolean(
              (
                part as {
                  functionCall?: unknown;
                }
              ).functionCall
            )
        );

      if (
        !functionCallParts.length
      ) {
        break;
      }

      const functionResponseParts: Part[] =
        [];

      for (const part of functionCallParts) {

        const functionCall = (
          part as {
            functionCall: {
              name: string;
              args: Record<
                string,
                unknown
              >;
              id?: string;
            };
          }
        ).functionCall;

        const result =
          await executeAppointmentTool(
            functionCall.name,
            functionCall.args,
            clientId
          );

        console.log(
          "GEMINI TOOL (retry):",
          functionCall.name,
          JSON.stringify(result)
        );

        if (
          functionCall.name ===
            "create_appointment" &&
          (
            result as {
              success?: boolean;
            }
          ).success
        ) {
          appointmentCreated = true;
        }

        functionResponseParts.push({
          functionResponse: {
            name:
              functionCall.name,
            response: result,
            ...(functionCall.id
              ? { id: functionCall.id }
              : {}),
          },
        } as Part);
      }

      response =
        await chat.sendMessage(
          functionResponseParts
        );
    }

    text =
      response.response
        .text()
        .trim();
  }

  if (
    !appointmentCreated &&
    looksLikeAppointmentConfirmation(
      text
    )
  ) {

    throw new Error(
      "A IA confirmou o agendamento mas não registrou no sistema. Tente novamente ou agende manualmente em Agendamentos."
    );
  }

  if (!text) {
    throw new Error(
      "Gemini retornou resposta vazia"
    );
  }

  return text;
}

export async function generateClinicReplyWithTools(
  clientId: string,
  clientName: string,
  history: HistoryMessage[]
): Promise<string> {

  if (!env.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no backend/.env"
    );
  }

  const models =
    getModelCandidates();

  let lastError: unknown;

  for (const modelName of models) {

    try {

      console.log(
        "GEMINI+TOOLS:",
        modelName
      );

      return await generateWithTools(
        modelName,
        clientId,
        clientName,
        history
      );

    } catch (error) {

      lastError = error;

      console.error(
        `GEMINI+TOOLS falhou (${modelName}):`,
        error
      );

      const message =
        parseGeminiError(error);

      if (
        message.includes(
          "Chave GEMINI_API_KEY"
        )
      ) {
        throw new Error(message);
      }
    }
  }

  throw new Error(
    parseGeminiError(lastError) ||
      "Nenhum modelo Gemini disponível. Configure GEMINI_MODEL=gemini-2.5-flash no .env"
  );
}
