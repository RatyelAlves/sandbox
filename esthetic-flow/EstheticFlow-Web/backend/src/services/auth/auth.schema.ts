import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(120),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .max(255),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .max(128),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .max(128),
});
