import { z } from "zod";

export const createUserSchema = z.object({
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
    .min(
      6,
      "Senha deve ter ao menos 6 caracteres"
    )
    .max(128),
  role: z
    .enum(["admin", "staff"])
    .default("staff"),
  active: z.boolean().default(true),
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome deve ter ao menos 2 caracteres")
      .max(120)
      .optional(),
    email: z
      .string()
      .trim()
      .email("E-mail inválido")
      .max(255)
      .optional(),
    role: z
      .enum(["admin", "staff"])
      .optional(),
    active: z.boolean().optional(),
    password: z
      .string()
      .min(
        6,
        "Senha deve ter ao menos 6 caracteres"
      )
      .max(128)
      .optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some(
        (value) => value !== undefined
      ),
    {
      message:
        "Informe ao menos um campo para atualizar",
    }
  );

export const userIdParamSchema = z.object({
  userId: z.string().min(1),
});
