import { z } from "zod";

export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus =
  typeof appointmentStatuses[number];

export const appointmentStatusSchema =
  z.enum(appointmentStatuses);

export const createAppointmentSchema =
  z.object({
    clientId: z.string().min(1),

    procedure: z
      .string()
      .trim()
      .min(2)
      .max(120),

    date: z
      .string()
      .datetime({
        offset: true,
      }),

    durationMin: z
      .number()
      .int()
      .min(15)
      .max(480)
      .optional()
      .default(60),

    status: appointmentStatusSchema
      .optional()
      .default("scheduled"),

    notes: z
      .string()
      .trim()
      .max(500)
      .optional(),
  });

export const updateAppointmentSchema =
  createAppointmentSchema
    .partial()
    .refine(
      (data) =>
        Object.keys(data).length > 0,

      {
        message:
          "Informe ao menos um campo para atualizar",
      }
    );

export const listAppointmentsQuerySchema =
  z.object({
    status: appointmentStatusSchema
      .optional(),

    from: z
      .string()
      .datetime({
        offset: true,
      })
      .optional(),

    to: z
      .string()
      .datetime({
        offset: true,
      })
      .optional(),

    clientId: z
      .string()
      .optional(),

    search: z
      .string()
      .trim()
      .optional(),
  });

export const appointmentIdParamSchema =
  z.object({
    id: z.string().min(1),
  });
