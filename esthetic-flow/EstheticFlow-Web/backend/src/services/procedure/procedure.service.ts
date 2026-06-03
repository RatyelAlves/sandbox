import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

import type { z } from "zod";

import type {
  createProcedureSchema,
  listProceduresQuerySchema,
  updateProcedureSchema,
} from "./procedure.schema";

type CreateInput =
  z.infer<typeof createProcedureSchema>;

type UpdateInput =
  z.infer<typeof updateProcedureSchema>;

type ListQuery =
  z.infer<typeof listProceduresQuerySchema>;

export async function listProcedures(
  query: ListQuery = {}
) {

  const where: Prisma.ProcedureWhereInput =
    {};

  if (query.active === "true") {
    where.active = true;
  }

  if (query.active === "false") {
    where.active = false;
  }

  if (query.search) {
    where.OR = [
      {
        name: {
          contains: query.search,
          mode: "insensitive",
        },
      },

      {
        description: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return prisma.procedure.findMany({
    where,
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
}

export async function getProcedure(
  id: string
) {

  const procedure =
    await prisma.procedure.findUnique({
      where: { id },
    });

  if (!procedure) {
    throw new Error(
      "PROCEDURE_NOT_FOUND"
    );
  }

  return procedure;
}

export async function createProcedure(
  input: CreateInput
) {

  return prisma.procedure.create({
    data: input,
  });
}

export async function updateProcedure(
  id: string,
  input: UpdateInput
) {

  await getProcedure(id);

  return prisma.procedure.update({
    where: { id },
    data: input,
  });
}

export async function deleteProcedure(
  id: string
) {

  await getProcedure(id);

  await prisma.procedure.delete({
    where: { id },
  });

  return { success: true };
}

function formatPriceBrl(
  price: number
) {

  return price.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export async function getProceduresCatalogForAi() {

  const procedures =
    await listProcedures({
      active: "true",
    });

  if (!procedures.length) {
    return (
      "Nenhum procedimento cadastrado no sistema."
    );
  }

  return procedures
    .map(
      (item, index) => {
        const lines = [
          `${index + 1}. ${item.name} (${item.category})`,
          `   Preço: ${formatPriceBrl(item.price)}`,
          `   Duração: ${item.durationMin} min`,
        ];

        if (item.description) {
          lines.push(
            `   Detalhes: ${item.description}`
          );
        }

        return lines.join("\n");
      }
    )
    .join("\n\n");
}

export async function findProcedureByName(
  name: string
) {

  const normalized =
    name.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const procedures =
    await listProcedures({
      active: "true",
    });

  return (
    procedures.find(
      (item) =>
        item.name.toLowerCase() ===
        normalized
    ) ??
    procedures.find(
      (item) =>
        item.name
          .toLowerCase()
          .includes(normalized) ||
        normalized.includes(
          item.name.toLowerCase()
        )
    ) ??
    null
  );
}
