import { z } from "zod";

export const procedureCategories = [
  "Facial",
  "Depilação",
  "Capilar",
  "Massagem",
  "Corporal",
] as const;

export const createProcedureSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(120),

    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    category: z
      .enum(procedureCategories)
      .optional()
      .default("Facial"),

    price: z
      .number()
      .min(0)
      .max(999999),

    durationMin: z
      .number()
      .int()
      .min(15)
      .max(480)
      .optional()
      .default(60),

    active: z
      .boolean()
      .optional()
      .default(true),

    sortOrder: z
      .number()
      .int()
      .min(0)
      .max(9999)
      .optional()
      .default(0),
  });

export const updateProcedureSchema =
  createProcedureSchema
    .partial()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe ao menos um campo para atualizar",
      }
    );

export const listProceduresQuerySchema =
  z.object({
    active: z
      .enum(["true", "false"])
      .optional(),

    search: z
      .string()
      .trim()
      .optional(),
  });

export const procedureIdParamSchema =
  z.object({
    id: z.string().min(1),
  });
