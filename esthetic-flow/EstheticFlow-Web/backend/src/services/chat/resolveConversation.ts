import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

import {
  isLidJid,
  jidToPhone,
} from "../whatsapp/jid";

type ResolveInput = {
  clientId: string;
  remoteJid: string;
  remoteJidAlt?: string;
};

function pickPrimaryAndAlt(
  jidA: string,
  jidB?: string | null
) {

  const candidates = [jidA, jidB]
    .filter(Boolean) as string[];

  if (candidates.length === 0) {
    return {
      primary: jidA,
      alt: undefined,
    } as const;
  }

  const phoneJid = candidates.find(
    (jid) =>
      jid.endsWith("@s.whatsapp.net")
  );

  const lidJid = candidates.find(
    (jid) => isLidJid(jid)
  );

  if (phoneJid) {
    return {
      primary: phoneJid,
      alt:
        lidJid !== phoneJid
          ? lidJid
          : undefined,
    } as const;
  }

  return {
    primary: candidates[0],
    alt:
      candidates[1] !== candidates[0]
        ? candidates[1]
        : undefined,
  } as const;
}

async function mergeConversations(
  keep: { id: string },
  drop: { id: string }
) {

  if (keep.id === drop.id) {
    return;
  }

  await prisma.$transaction([
    prisma.message.updateMany({
      where: {
        conversationId: drop.id,
      },
      data: {
        conversationId: keep.id,
      },
    }),
    prisma.conversation.delete({
      where: { id: drop.id },
    }),
  ]);
}

/**
 * Encontra a conversa correta para um cliente sem criar duplicatas.
 *
 * Casos cobertos:
 *  - Primeira mensagem do cliente (cria conversa)
 *  - Mensagem chega por @lid e cliente já tem conversa por phone (ou vice-versa)
 *  - Existem 2 conversas duplicadas no banco (mescla, mantendo a mais antiga)
 *  - Conversa arquivada (desarquiva)
 */
export async function resolveOrCreateConversation(
  input: ResolveInput
) {

  const { clientId, remoteJid, remoteJidAlt } = input;

  const jidCandidates = [
    remoteJid,
    remoteJidAlt,
  ].filter(Boolean) as string[];

  const matchesByJid =
    await prisma.conversation.findMany({
      where: {
        OR: [
          {
            whatsappJid: {
              in: jidCandidates,
            },
          },
          {
            whatsappJidAlt: {
              in: jidCandidates,
            },
          },
          { clientId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (matchesByJid.length === 0) {

    const { primary, alt } =
      pickPrimaryAndAlt(
        remoteJid,
        remoteJidAlt
      );

    return prisma.conversation.create({
      data: {
        clientId,
        whatsappJid: primary,
        whatsappJidAlt: alt,
      },
    });
  }

  const [keep, ...duplicates] =
    matchesByJid;

  for (const duplicate of duplicates) {
    await mergeConversations(
      keep,
      duplicate
    );
  }

  const knownJids = new Set<string>();

  knownJids.add(keep.whatsappJid);

  if (keep.whatsappJidAlt) {
    knownJids.add(keep.whatsappJidAlt);
  }

  for (const duplicate of duplicates) {
    knownJids.add(
      duplicate.whatsappJid
    );

    if (duplicate.whatsappJidAlt) {
      knownJids.add(
        duplicate.whatsappJidAlt
      );
    }
  }

  for (const candidate of jidCandidates) {
    knownJids.add(candidate);
  }

  const { primary, alt } =
    pickPrimaryAndAlt(
      [...knownJids].find((jid) =>
        jid.endsWith("@s.whatsapp.net")
      ) || keep.whatsappJid,
      [...knownJids].find(
        (jid) => isLidJid(jid)
      )
    );

  const data: Prisma.ConversationUpdateInput = {};

  if (keep.whatsappJid !== primary) {

    const conflict =
      await prisma.conversation.findUnique({
        where: { whatsappJid: primary },
      });

    if (
      !conflict ||
      conflict.id === keep.id
    ) {
      data.whatsappJid = primary;
    }
  }

  const desiredAlt =
    alt && alt !== primary
      ? alt
      : null;

  if (
    (keep.whatsappJidAlt || null) !==
    desiredAlt
  ) {
    data.whatsappJidAlt = desiredAlt;
  }

  if (keep.archived) {
    data.archived = false;
  }

  if (
    Object.keys(data).length === 0
  ) {
    return keep;
  }

  return prisma.conversation.update({
    where: { id: keep.id },
    data,
  });
}

/**
 * Mantém o phone do client coerente com o JID de telefone disponível.
 */
export async function syncClientPhoneFromJid(
  clientId: string,
  currentPhone: string,
  remoteJidAlt?: string
) {

  if (
    !remoteJidAlt?.endsWith(
      "@s.whatsapp.net"
    )
  ) {
    return;
  }

  const phone = jidToPhone(
    remoteJidAlt
  );

  if (currentPhone === phone) {
    return;
  }

  const existing =
    await prisma.client.findFirst({
      where: {
        phone,
        NOT: { id: clientId },
      },
    });

  if (existing) {
    return;
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { phone },
  });
}
