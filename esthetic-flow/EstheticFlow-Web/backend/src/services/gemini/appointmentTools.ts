import {
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";

import {
  createAppointment,
} from "../appointment/appointment.service";

import {
  listAvailableSlotsDetailed,
} from "../appointment/availability.service";

import {
  findProcedureByName,
  listProcedures,
} from "../procedure/procedure.service";

export const appointmentToolDeclarations: FunctionDeclaration[] =
  [
    {
      name: "list_procedures",

      description:
        "Lista procedimentos/serviços ativos da clínica com preço, duração e descrição. Use quando o paciente perguntar o que a clínica oferece, preços ou quiser escolher um procedimento.",

      parameters: {
        type: SchemaType.OBJECT,

        properties: {
          search: {
            type: SchemaType.STRING,
            description:
              "Filtro opcional por nome ou palavra-chave.",
          },
        },
      },
    },

    {
      name: "list_available_slots",

      description:
        "Consulta horários realmente livres na agenda da clínica (banco + Google Calendar). Use antes de sugerir datas ao paciente.",

      parameters: {
        type: SchemaType.OBJECT,

        properties: {
          fromDate: {
            type: SchemaType.STRING,
            description:
              "Data inicial no formato YYYY-MM-DD (ex: 2026-05-26 para 26 de maio). Opcional.",
          },

          days: {
            type: SchemaType.NUMBER,
            description:
              "Quantos dias à frente buscar a partir de fromDate. Use 3 a 14. Padrão: 7.",
          },

          durationMin: {
            type: SchemaType.NUMBER,
            description:
              "Duração do procedimento em minutos. Padrão: 60.",
          },
        },
      },
    },

    {
      name: "create_appointment",

      description:
        "Registra agendamento confirmado no banco de dados E Google Calendar. OBRIGATÓRIO chamar antes de dizer ao paciente que está agendado/confirmado. Use o campo iso do slot retornado por list_available_slots.",

      parameters: {
        type: SchemaType.OBJECT,

        properties: {
          procedure: {
            type: SchemaType.STRING,
            description:
              "Nome exato do procedimento conforme list_procedures (catálogo da clínica).",
          },

          date: {
            type: SchemaType.STRING,
            description:
              "Data e hora confirmadas em ISO 8601.",
          },

          durationMin: {
            type: SchemaType.NUMBER,
            description:
              "Duração em minutos. Padrão: 60.",
          },

          notes: {
            type: SchemaType.STRING,
            description:
              "Observações opcionais.",
          },
        },

        required: [
          "procedure",
          "date",
        ],
      },
    },
  ];

type ToolCallArgs = Record<
  string,
  unknown
>;

export async function executeAppointmentTool(
  name: string,
  args: ToolCallArgs,
  clientId: string
) {

  if (
    name === "list_procedures"
  ) {

    const search =
      typeof args.search === "string"
        ? args.search.trim()
        : "";

    const procedures =
      await listProcedures({
        active: "true",
        search: search || undefined,
      });

    return {
      procedures: procedures.map(
        (item) => ({
          name: item.name,
          category: item.category,
          price: item.price,
          priceFormatted:
            item.price.toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL",
              }
            ),
          durationMin:
            item.durationMin,
          description:
            item.description,
        })
      ),
    };
  }

  if (
    name === "list_available_slots"
  ) {

    const days =
      typeof args.days === "number"
        ? Math.max(
            args.days,
            1
          )
        : 7;

    return listAvailableSlotsDetailed({
      fromDate:
        typeof args.fromDate ===
        "string"
          ? args.fromDate
          : undefined,

      days,

      durationMin:
        typeof args.durationMin ===
        "number"
          ? args.durationMin
          : undefined,
    });
  }

  if (
    name === "create_appointment"
  ) {

    const procedure =
      typeof args.procedure ===
      "string"
        ? args.procedure.trim()
        : "";

    const date =
      typeof args.date === "string"
        ? args.date
        : "";

    if (
      !procedure ||
      !date
    ) {
      return {
        success: false,
        error:
          "procedure e date são obrigatórios",
      };
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return {
        success: false,
        error: "Data inválida",
      };
    }

    const matchedProcedure =
      await findProcedureByName(
        procedure
      );

    const durationMin =
      typeof args.durationMin ===
      "number"
        ? args.durationMin
        : matchedProcedure?.durationMin ??
          60;

    const procedureName =
      matchedProcedure?.name ??
      procedure;

    const appointment =
      await createAppointment({
        clientId,
        procedure: procedureName,
        date: parsedDate.toISOString(),
        durationMin,
        status: "confirmed",
        notes:
          typeof args.notes ===
          "string"
            ? args.notes
            : undefined,
      });

    return {
      success: true,

      appointmentId:
        appointment.id,

      googleSynced: Boolean(
        appointment.googleEventId
      ),

      date: appointment.date,

      procedure:
        appointment.procedure,

      price:
        matchedProcedure?.price ??
        null,

      durationMin,
    };
  }

  return {
    error: `Ferramenta desconhecida: ${name}`,
  };
}
