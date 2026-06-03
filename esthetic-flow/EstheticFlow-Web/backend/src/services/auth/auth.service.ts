import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

const SALT_ROUNDS = 10;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  approved: boolean;
  createdAt: Date;
};

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  approved: boolean;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    approved: user.approved,
    createdAt: user.createdAt,
  };
}

export function signAccessToken(
  user: Pick<
    PublicUser,
    "id" | "email" | "role"
  >
) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn:
        env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    }
  );
}

export function verifyAccessToken(
  token: string
) {
  const payload = jwt.verify(
    token,
    env.jwtSecret
  ) as jwt.JwtPayload;

  const userId =
    typeof payload.sub === "string"
      ? payload.sub
      : "";

  if (!userId) {
    throw new Error(
      "INVALID_TOKEN"
    );
  }

  return {
    userId,
    email:
      typeof payload.email ===
      "string"
        ? payload.email
        : "",
    role:
      typeof payload.role ===
      "string"
        ? payload.role
        : "staff",
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase();

  const existing =
    await prisma.user.findUnique({
      where: { email },
    });

  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const userCount =
    await prisma.user.count();

  if (userCount === 0) {
    throw new Error(
      "REGISTRATION_CLOSED"
    );
  }

  const passwordHash =
    await bcrypt.hash(
      input.password,
      SALT_ROUNDS
    );

  const user =
    await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        role: "staff",
        approved: false,
        active: true,
      },
    });

  return {
    success: true,
    pending: true,
    message:
      "Cadastro enviado! Aguarde a aprovação do administrador para acessar o sistema.",
    user: toPublicUser(user),
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: { email },
    });

  if (!user) {
    throw new Error(
      "INVALID_CREDENTIALS"
    );
  }

  const valid =
    await bcrypt.compare(
      input.password,
      user.passwordHash
    );

  if (!valid) {
    throw new Error(
      "INVALID_CREDENTIALS"
    );
  }

  if (!user.approved) {
    throw new Error(
      "PENDING_APPROVAL"
    );
  }

  if (!user.active) {
    throw new Error(
      "USER_INACTIVE"
    );
  }

  const publicUser =
    toPublicUser(user);

  return {
    user: publicUser,
    token: signAccessToken(
      publicUser
    ),
  };
}

export async function getUserById(
  userId: string
) {
  const user =
    await prisma.user.findUnique({
      where: { id: userId },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  return toPublicUser(user);
}

export async function ensureDefaultAdmin() {
  const userCount =
    await prisma.user.count();

  if (userCount > 0) {
    return;
  }

  if (
    !env.adminEmail ||
    !env.adminPassword
  ) {
    return;
  }

  const passwordHash =
    await bcrypt.hash(
      env.adminPassword,
      SALT_ROUNDS
    );

  await prisma.user.create({
    data: {
      name: "Administrador",
      email:
        env.adminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
    },
  });

  console.log(
    `Usuário admin criado: ${env.adminEmail}`
  );
}
