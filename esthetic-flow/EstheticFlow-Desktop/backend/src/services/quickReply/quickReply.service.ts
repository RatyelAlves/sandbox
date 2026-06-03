import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

import type { z } from "zod";

import type {
  createQuickReplySchema,
  listQuickRepliesQuerySchema,
  updateQuickReplySchema,
} from "./quickReply.schema";

type CreateInput =
  z.infer<typeof createQuickReplySchema>;

type UpdateInput =
  z.infer<typeof updateQuickReplySchema>;

type ListQuery =
  z.infer<typeof listQuickRepliesQuerySchema>;

const DEFAULT_QUICK_REPLIES: CreateInput[] = [
  {
    title: "Boas-vindas",
    shortcut: "boas-vindas",
    content:
      "Olá! Seja bem-vinda(o) à nossa clínica de estética. Como posso ajudar você hoje?",
    sortOrder: 1,
  },
  {
    title: "Confirmar agendamento",
    shortcut: "confirmar",
    content:
      "Seu agendamento está confirmado! Aguardamos você no horário combinado. Qualquer dúvida, estamos à disposição.",
    sortOrder: 2,
  },
  {
    title: "Lembrete 24h",
    shortcut: "lembrete",
    content:
      "Olá! Passando para lembrar do seu agendamento amanhã. Confirma presença?",
    sortOrder: 3,
  },
  {
    title: "Cancelamento",
    shortcut: "cancelamento",
    content:
      "Seu agendamento foi cancelado conforme solicitado. Quando quiser remarcar, é só nos avisar.",
    sortOrder: 4,
  },
  {
    title: "Agradecimento",
    shortcut: "obrigado",
    content:
      "Obrigada pela preferência! Foi um prazer atender você. Até a próxima!",
    sortOrder: 5,
  },
  {
    title: "Horários disponíveis",
    shortcut: "horarios",
    content:
      "Temos horários disponíveis esta semana. Qual dia e período prefere: manhã ou tarde?",
    sortOrder: 6,
  },
  {
    title: "Cuidados pós-procedimento",
    shortcut: "pos-procedimento",
    content:
      "Após o procedimento, evite sol direto por 48h, use protetor solar e hidrate a pele. Em caso de dúvida, entre em contato.",
    sortOrder: 7,
  },
  {
    title: "Promoção",
    shortcut: "promocao",
    content:
      "Temos uma promoção especial este mês! Entre em contato para saber mais sobre nossos pacotes.",
    sortOrder: 8,
  },
];

export async function ensureDefaultQuickReplies() {
  const count =
    await prisma.quickReply.count();

  if (count > 0) {
    return;
  }

  await prisma.quickReply.createMany({
    data: DEFAULT_QUICK_REPLIES,
  });
}

export async function listQuickReplies(
  query: ListQuery = {}
) {

  await ensureDefaultQuickReplies();

  const where: Prisma.QuickReplyWhereInput =
    {};

  if (query.active === "true") {
    where.active = true;
  }

  if (query.active === "false") {
    where.active = false;
  }

  if (query.search) {
    where.OR = [
      {
        title: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        shortcut: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return prisma.quickReply.findMany({
    where,
    orderBy: [
      { sortOrder: "asc" },
      { title: "asc" },
    ],
  });
}

export async function getQuickReply(
  id: string
) {

  const quickReply =
    await prisma.quickReply.findUnique({
      where: { id },
    });

  if (!quickReply) {
    throw new Error(
      "QUICK_REPLY_NOT_FOUND"
    );
  }

  return quickReply;
}

export async function createQuickReply(
  input: CreateInput
) {

  return prisma.quickReply.create({
    data: input,
  });
}

export async function updateQuickReply(
  id: string,
  input: UpdateInput
) {

  await getQuickReply(id);

  return prisma.quickReply.update({
    where: { id },
    data: input,
  });
}

export async function deleteQuickReply(
  id: string
) {

  await getQuickReply(id);

  await prisma.quickReply.delete({
    where: { id },
  });

  return { success: true };
}
