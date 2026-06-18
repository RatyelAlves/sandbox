import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function getUserByAuthId(authId: string) {
  return prisma.user.findUnique({ where: { authId } });
}

export async function linkUserAuthId(userId: string, authId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { authId },
  });
}

export async function createAppUser(input: {
  id: string;
  authId: string;
  email: string;
  role: UserRole;
  terreiroId?: string;
}) {
  return prisma.user.create({
    data: {
      id: input.id,
      authId: input.authId,
      email: input.email.trim().toLowerCase(),
      passwordHash: "",
      role: input.role,
      terreiroId: input.terreiroId,
    },
  });
}
