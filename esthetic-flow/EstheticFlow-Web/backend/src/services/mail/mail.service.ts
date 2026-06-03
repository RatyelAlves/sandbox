import nodemailer from "nodemailer";

import { env } from "../../config/env";

export function isSmtpConfigured() {
  return Boolean(
    env.smtpHost &&
      env.smtpUser &&
      env.smtpPass &&
      env.smtpFrom
  );
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {

  if (!isSmtpConfigured()) {
    console.log(
      "[SMTP não configurado] E-mail não enviado:",
      input.to,
      input.subject
    );

    return false;
  }

  const transporter =
    nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });

  await transporter.sendMail({
    from: env.smtpFrom,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return true;
}
