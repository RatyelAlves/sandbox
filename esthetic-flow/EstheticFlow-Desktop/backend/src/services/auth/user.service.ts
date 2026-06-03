import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

import {
  getUserById,
  type PublicUser,
} from "./auth.service";

const SALT_ROUNDS = 10;

async function countAdmins() {
  return prisma.user.count({
    where: {
      role: "admin",
      active: true,
      approved: true,
    },
  });
}

export async function countPendingUsers() {
  return prisma.user.count({
    where: {
      approved: false,
    },
  });
}

export async function createUserByAdmin(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
  active?: boolean;
}): Promise<PublicUser> {

  const email = input.email.toLowerCase();

  const existing =
    await prisma.user.findUnique({
      where: { email },
    });

  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const passwordHash =
    await bcrypt.hash(
      input.password,
      SALT_ROUNDS
    );

  try {
    const user =
      await prisma.user.create({
        data: {
          name: input.name,
          email,
          passwordHash,
          role: input.role ?? "staff",
          active: input.active ?? true,
          approved: true,
        },
      });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      approved: user.approved,
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        throw new Error(
          "EMAIL_IN_USE"
        );
      }
    }

    throw error;
  }
}

export async function listUsers() {
  const users =
    await prisma.user.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    approved: user.approved,
    createdAt: user.createdAt,
  }));
}

export async function updateUserByAdmin(input: {
  actorUserId: string;
  targetUserId: string;
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  active?: boolean;
}): Promise<PublicUser> {

  const target =
    await prisma.user.findUnique({
      where: {
        id: input.targetUserId,
      },
    });

  if (!target) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  const data: Prisma.UserUpdateInput =
    {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.email !== undefined) {
    data.email =
      input.email.toLowerCase();
  }

  if (input.role !== undefined) {
    if (
      target.role === "admin" &&
      input.role !== "admin"
    ) {
      const admins =
        await countAdmins();

      if (admins <= 1) {
        throw new Error(
          "LAST_ADMIN"
        );
      }
    }

    data.role = input.role;
  }

  if (input.active !== undefined) {
    if (
      input.actorUserId ===
      input.targetUserId &&
      !input.active
    ) {
      throw new Error(
        "CANNOT_BLOCK_SELF"
      );
    }

    if (
      target.role === "admin" &&
      !input.active
    ) {
      const admins =
        await countAdmins();

      if (admins <= 1) {
        throw new Error(
          "LAST_ADMIN"
        );
      }
    }

    data.active = input.active;
  }

  if (input.password) {
    data.passwordHash =
      await bcrypt.hash(
        input.password,
        SALT_ROUNDS
      );
  }

  try {
    const updated =
      await prisma.user.update({
        where: {
          id: input.targetUserId,
        },
        data,
      });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active,
      approved: updated.approved,
      createdAt: updated.createdAt,
    };
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        throw new Error(
          "EMAIL_IN_USE"
        );
      }
    }

    throw error;
  }
}

export async function approveUserByAdmin(input: {
  actorUserId: string;
  targetUserId: string;
}): Promise<PublicUser> {

  const target =
    await prisma.user.findUnique({
      where: {
        id: input.targetUserId,
      },
    });

  if (!target) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  if (target.approved) {
    throw new Error(
      "ALREADY_APPROVED"
    );
  }

  const updated =
    await prisma.user.update({
      where: {
        id: input.targetUserId,
      },
      data: {
        approved: true,
        active: true,
      },
    });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    active: updated.active,
    approved: updated.approved,
    createdAt: updated.createdAt,
  };
}

export async function toggleUserActiveByAdmin(input: {
  actorUserId: string;
  targetUserId: string;
  active: boolean;
}) {

  return updateUserByAdmin({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    active: input.active,
  });
}

export async function deleteUserByAdmin(input: {
  actorUserId: string;
  targetUserId: string;
}) {

  if (
    input.actorUserId ===
    input.targetUserId
  ) {
    throw new Error(
      "CANNOT_DELETE_SELF"
    );
  }

  const target =
    await prisma.user.findUnique({
      where: {
        id: input.targetUserId,
      },
    });

  if (!target) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  if (target.role === "admin") {
    const admins =
      await countAdmins();

    if (admins <= 1) {
      throw new Error(
        "LAST_ADMIN"
      );
    }
  }

  await prisma.user.delete({
    where: {
      id: input.targetUserId,
    },
  });

  return getUserById(
    input.actorUserId
  ).catch(() => null);
}
