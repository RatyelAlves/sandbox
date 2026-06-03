import { z } from "zod";

export const createQuickReplySchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(2)
      .max(80),

    shortcut: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9-]+$/,
        "Use apenas letras minúsculas, números e hífens"
      )
      .max(40)
      .optional(),

    content: z
      .string()
      .trim()
      .min(1)
      .max(4000),

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

export const updateQuickReplySchema =
  createQuickReplySchema
    .partial()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe ao menos um campo para atualizar",
      }
    );

export const listQuickRepliesQuerySchema =
  z.object({
    active: z
      .enum(["true", "false"])
      .optional(),

    search: z
      .string()
      .trim()
      .optional(),
  });

export const quickReplyIdParamSchema =
  z.object({
    id: z.string().min(1),
  });
