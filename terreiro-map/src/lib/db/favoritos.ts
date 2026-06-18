import {
  SEED_TERREIRO_USER_ID,
  SEED_USUARIO_USER_ID,
} from "@/lib/db/constants";
import { prisma } from "@/lib/prisma";

export async function listFavoriteTerreiroIds(userId: string) {
  const rows = await prisma.favoritoTerreiro.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.terreiroId);
}

export async function listFavoriteEventoIds(userId: string) {
  const rows = await prisma.favoritoEvento.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.eventoId);
}

export async function toggleFavoriteTerreiro(userId: string, terreiroId: string) {
  const existing = await prisma.favoritoTerreiro.findUnique({
    where: { userId_terreiroId: { userId, terreiroId } },
  });

  if (existing) {
    await prisma.favoritoTerreiro.delete({
      where: { userId_terreiroId: { userId, terreiroId } },
    });
    return false;
  }

  await prisma.favoritoTerreiro.create({ data: { userId, terreiroId } });
  return true;
}

export async function addFavoriteTerreiro(userId: string, terreiroId: string) {
  await prisma.favoritoTerreiro.upsert({
    where: { userId_terreiroId: { userId, terreiroId } },
    create: { userId, terreiroId },
    update: {},
  });
}

export async function removeFavoriteTerreiro(userId: string, terreiroId: string) {
  await prisma.favoritoTerreiro.deleteMany({ where: { userId, terreiroId } });
}

export async function removeFavoriteEvento(userId: string, eventoId: string) {
  await prisma.favoritoEvento.deleteMany({ where: { userId, eventoId } });
}

export async function setFavoriteTerreiros(userId: string, terreiroIds: string[]) {
  await prisma.$transaction([
    prisma.favoritoTerreiro.deleteMany({ where: { userId } }),
    prisma.favoritoTerreiro.createMany({
      data: terreiroIds.map((terreiroId) => ({ userId, terreiroId })),
      skipDuplicates: true,
    }),
  ]);
}

export async function setFavoriteEventos(userId: string, eventoIds: string[]) {
  await prisma.$transaction([
    prisma.favoritoEvento.deleteMany({ where: { userId } }),
    prisma.favoritoEvento.createMany({
      data: eventoIds.map((eventoId) => ({ userId, eventoId })),
      skipDuplicates: true,
    }),
  ]);
}

/** Compatibilidade com seed/demo sem sessão autenticada. */
export function fallbackUserIdForScope(scope: "usuario" | "terreiro") {
  return scope === "usuario" ? SEED_USUARIO_USER_ID : SEED_TERREIRO_USER_ID;
}
