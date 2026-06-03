import crypto from "crypto";

import bcrypt from "bcryptjs";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

import {
  sendMail,
  isSmtpConfigured,
} from "../mail/mail.service";

const SALT_ROUNDS = 10;

export async function requestPasswordReset(
  email: string
) {

  const normalized =
    email.toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email: normalized,
      },
    });

  if (!user || !user.active) {
    return {
      message:
        "Se o e-mail existir, enviaremos instruções para redefinir a senha.",
    };
  }

  await prisma.passwordResetToken.updateMany(
    {
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    }
  );

  const token = crypto
    .randomBytes(32)
    .toString("hex");

  const expiresAt = new Date(
    Date.now() +
      env.passwordResetExpiresMin *
        60 *
        1000
  );

  await prisma.passwordResetToken.create(
    {
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    }
  );

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;

  const sent = await sendMail({
    to: user.email,
    subject:
      "EstheticFlow — Redefinir senha",
    text: `Olá ${user.name},\n\nPara redefinir sua senha, acesse:\n${resetUrl}\n\nEste link expira em ${env.passwordResetExpiresMin} minutos.\n\nSe você não solicitou, ignore este e-mail.`,
    html: `
      <p>Olá <strong>${user.name}</strong>,</p>
      <p>Para redefinir sua senha, clique no link abaixo:</p>
      <p><a href="${resetUrl}">Redefinir senha</a></p>
      <p>Este link expira em ${env.passwordResetExpiresMin} minutos.</p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `,
  });

  if (!sent) {
    console.log(
      "Link de redefinição de senha:",
      resetUrl
    );
  }

  return {
    message:
      "Se o e-mail existir, enviaremos instruções para redefinir a senha.",
    smtpConfigured: isSmtpConfigured(),
  };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}) {

  const record =
    await prisma.passwordResetToken.findUnique(
      {
        where: {
          token: input.token,
        },
        include: {
          user: true,
        },
      }
    );

  if (
    !record ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    throw new Error(
      "INVALID_RESET_TOKEN"
    );
  }

  if (!record.user.active) {
    throw new Error(
      "USER_INACTIVE"
    );
  }

  const passwordHash =
    await bcrypt.hash(
      input.password,
      SALT_ROUNDS
    );

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: record.userId,
      },
      data: {
        passwordHash,
      },
    }),

    prisma.passwordResetToken.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),

    prisma.passwordResetToken.updateMany(
      {
        where: {
          userId: record.userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }
    ),
  ]);
}
