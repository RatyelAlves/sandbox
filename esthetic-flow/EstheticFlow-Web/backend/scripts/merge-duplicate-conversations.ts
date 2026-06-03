/**
 * Mescla conversas duplicadas que apontam para o mesmo Client.
 *
 * Quando o cliente envia mensagens primeiro de `@lid` e depois direto
 * do `@s.whatsapp.net` (ou vice-versa) o webhook acabava criando duas
 * Conversation pra o mesmo cliente. Este script:
 *
 *  1. Encontra todos os Clients com mais de uma conversa
 *  2. Mantém a conversa mais antiga (que recebeu o primeiro contato)
 *  3. Move todas as mensagens das duplicatas para a "principal"
 *  4. Atualiza `whatsappJid` para o JID de telefone quando existir,
 *     e mantém o `@lid` como `whatsappJidAlt`
 *  5. Apaga as conversas duplicadas
 *
 * Rodar: `npx tsx scripts/merge-duplicate-conversations.ts`
 */

import { prisma } from "../src/lib/prisma";

import { isLidJid } from "../src/services/whatsapp/jid";

type ConversationLite = {
  id: string;
  whatsappJid: string;
  whatsappJidAlt: string | null;
  unreadCount: number;
  lastReadAt: Date | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function pickPrimaryAndAlt(
  conversations: ConversationLite[]
) {

  const jids = new Set<string>();

  for (const conv of conversations) {
    jids.add(conv.whatsappJid);

    if (conv.whatsappJidAlt) {
      jids.add(conv.whatsappJidAlt);
    }
  }

  const list = [...jids];

  const phoneJid = list.find(
    (jid) =>
      jid.endsWith("@s.whatsapp.net")
  );

  const lidJid = list.find(
    (jid) => isLidJid(jid)
  );

  const primary =
    phoneJid || list[0];

  const alt =
    lidJid && lidJid !== primary
      ? lidJid
      : list.find(
          (jid) => jid !== primary
        );

  return { primary, alt };
}

async function mergeForClient(
  clientId: string,
  conversations: ConversationLite[]
) {

  const sorted = [...conversations]
    .sort((a, b) =>
      a.createdAt.getTime() -
      b.createdAt.getTime()
    );

  const [keep, ...duplicates] = sorted;

  const totalUnread = conversations.reduce(
    (sum, conv) =>
      sum + (conv.unreadCount || 0),
    0
  );

  const { primary, alt } =
    pickPrimaryAndAlt(conversations);

  for (const duplicate of duplicates) {

    console.log(
      `  mesclar ${duplicate.id} (jid=${duplicate.whatsappJid}) → ${keep.id}`
    );

    await prisma.message.updateMany({
      where: {
        conversationId:
          duplicate.id,
      },
      data: {
        conversationId: keep.id,
      },
    });

    await prisma.conversation.delete({
      where: { id: duplicate.id },
    });
  }

  const updateData: {
    whatsappJid?: string;
    whatsappJidAlt?: string | null;
    unreadCount?: number;
    archived?: boolean;
  } = {};

  if (
    primary &&
    keep.whatsappJid !== primary
  ) {
    updateData.whatsappJid = primary;
  }

  const desiredAlt =
    alt && alt !== primary
      ? alt
      : null;

  if (
    (keep.whatsappJidAlt || null) !==
    desiredAlt
  ) {
    updateData.whatsappJidAlt = desiredAlt;
  }

  if (
    totalUnread !==
    (keep.unreadCount || 0)
  ) {
    updateData.unreadCount =
      totalUnread;
  }

  if (
    conversations.some(
      (conv) => !conv.archived
    ) &&
    keep.archived
  ) {
    updateData.archived = false;
  }

  if (
    Object.keys(updateData).length > 0
  ) {
    await prisma.conversation.update({
      where: { id: keep.id },
      data: updateData,
    });
  }

  console.log(
    `  client ${clientId} consolidado em ${keep.id} (jid=${
      updateData.whatsappJid || keep.whatsappJid
    } / alt=${
      updateData.whatsappJidAlt ??
      keep.whatsappJidAlt ??
      "-"
    })`
  );
}

async function main() {

  console.log(
    "Procurando conversas duplicadas..."
  );

  const clientsWithMany =
    await prisma.client.findMany({
      where: {
        conversations: {
          some: {},
        },
      },
      include: {
        conversations: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  const targets = clientsWithMany.filter(
    (client) =>
      client.conversations.length > 1
  );

  if (targets.length === 0) {
    console.log(
      "Nenhuma duplicata encontrada."
    );

    await prisma.$disconnect();
    return;
  }

  console.log(
    `Clientes com conversas duplicadas: ${targets.length}`
  );

  for (const client of targets) {
    console.log(
      `Client ${client.id} (${client.name} / ${client.phone}) com ${client.conversations.length} conversas:`
    );

    await mergeForClient(
      client.id,
      client.conversations.map(
        (conv) => ({
          id: conv.id,
          whatsappJid:
            conv.whatsappJid,
          whatsappJidAlt:
            conv.whatsappJidAlt,
          unreadCount:
            conv.unreadCount,
          lastReadAt:
            conv.lastReadAt,
          archived: conv.archived,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        })
      )
    );
  }

  console.log("Concluído.");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
