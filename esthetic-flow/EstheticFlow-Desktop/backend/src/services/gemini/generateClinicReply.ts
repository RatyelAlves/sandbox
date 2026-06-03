import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

import { env }
from "../../config/env";

type HistoryMessage = {
  content: string;
  fromMe: boolean;
};

function buildPrompt(
  clientName: string,
  history: HistoryMessage[]
): string {

  const transcript =
    history
      .map((message) => {
        const role =
          message.fromMe
            ? "Atendente da clínica"
            : clientName;

        return `${role}: ${message.content}`;
      })
      .join("\n");

  return `
Você é a assistente virtual de uma clínica de estética premium chamada EstheticFlow.

Regras:
- Responda em português do Brasil
- Tom acolhedor, profissional e elegante
- Mensagens curtas (estilo WhatsApp, até 3 parágrafos pequenos)
- Ajude com dúvidas sobre procedimentos, horários e agendamentos
- Não invente preços ou datas — se não souber, convide a agendar uma avaliação
- Não faça diagnósticos médicos
- Use emojis com moderação (no máximo 1)

Cliente: ${clientName}

Histórico recente:
${transcript}

Responda apenas com a mensagem que será enviada ao cliente, sem prefixos ou aspas.
`.trim();
}

export function parseGeminiError(
  error: unknown
): string {

  const raw =
    error instanceof Error
      ? error.message
      : String(error);

  const lower =
    raw.toLowerCase();

  if (
    lower.includes("quota") ||
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  ) {
    return (
      "Cota da API Gemini esgotada neste modelo. Aguarde o reset diário, use GEMINI_MODEL=gemini-2.5-flash-lite no .env ou ative billing em https://aistudio.google.com/apikey"
    );
  }

  if (
    lower.includes("api key") ||
    lower.includes("invalid") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return (
      "Chave GEMINI_API_KEY inválida ou sem permissão. Gere uma nova em https://aistudio.google.com/apikey"
    );
  }

  if (
    lower.includes("not found") ||
    lower.includes("404")
  ) {
    return (
      `Modelo "${env.geminiModel}" não disponível nesta chave API. Use gemini-2.0-flash-lite ou gemini-2.0-flash no .env`
    );
  }

  return raw || "Erro desconhecido na API Gemini";
}

function shouldTryNextModel(
  error: unknown
): boolean {

  const message =
    parseGeminiError(error);

  if (
    message.includes(
      "Chave GEMINI_API_KEY"
    )
  ) {
    return false;
  }

  return true;
}

function getModelCandidates(): string[] {

  const primary =
    env.geminiModel.trim();

  const fallbacks =
    env.geminiFallbackModels
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

  return [
    ...new Set([
      primary,
      ...fallbacks,
    ]),
  ];
}

async function generateWithModel(
  modelName: string,
  prompt: string
): Promise<string> {

  const genAI =
    new GoogleGenerativeAI(
      env.geminiApiKey
    );

  const model =
    genAI.getGenerativeModel({
      model: modelName,
    });

  const result =
    await model.generateContent(
      prompt
    );

  const text =
    result.response
      .text()
      .trim();

  if (!text) {
    throw new Error(
      "Gemini retornou resposta vazia"
    );
  }

  return text;
}

export async function generateClinicReply(
  clientName: string,
  history: HistoryMessage[]
): Promise<string> {

  if (!env.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no backend/.env"
    );
  }

  const prompt =
    buildPrompt(
      clientName,
      history
    );

  const models =
    getModelCandidates();

  let lastError: unknown;

  for (const modelName of models) {

    try {

      console.log(
        "GEMINI:",
        modelName
      );

      return await generateWithModel(
        modelName,
        prompt
      );

    } catch (error) {

      lastError = error;

      console.error(
        `GEMINI falhou (${modelName}):`,
        error
      );

      const message =
        parseGeminiError(error);

      if (!shouldTryNextModel(error)) {
        throw new Error(message);
      }
    }
  }

  throw new Error(
    `Nenhum modelo Gemini disponível. Tente no .env: GEMINI_MODEL=gemini-2.0-flash-lite. Erro: ${parseGeminiError(lastError)}`
  );
}
