import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  LOGGED_TERREIRO_ID,
  MOCK_CAMPANHAS,
  MOCK_EVENTOS,
  MOCK_TERREIROS,
} from "../src/lib/mock-data";
import {
  SEED_TERREIRO_USER_ID,
  SEED_USUARIO_USER_ID,
} from "../src/lib/db/constants";

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DIRECT_URL ou DATABASE_URL não configurada para o seed.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.favoritoEvento.deleteMany();
  await prisma.favoritoTerreiro.deleteMany();
  await prisma.propostaCampanha.deleteMany();
  await prisma.campanha.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.user.deleteMany();
  await prisma.terreiro.deleteMany();

  for (const terreiro of MOCK_TERREIROS) {
    await prisma.terreiro.create({
      data: {
        id: terreiro.id,
        nome: terreiro.nome,
        categoria: terreiro.categoria,
        descricao: terreiro.descricao,
        dataFundacao: terreiro.dataFundacao,
        liderReligioso: terreiro.liderReligioso,
        fundador: terreiro.fundador,
        nacaoFundador: terreiro.nacaoFundador,
        uf: terreiro.uf,
        cidade: terreiro.cidade,
        bairro: terreiro.bairro,
        rua: terreiro.rua,
        numero: terreiro.numero,
        horarioAbertura: terreiro.horarioAbertura,
        horarioFechamento: terreiro.horarioFechamento,
        giras: terreiro.giras ? (terreiro.giras as object) : undefined,
        telefone: terreiro.telefone,
        email: terreiro.email,
        site: terreiro.site,
        instagram: terreiro.instagram,
        facebook: terreiro.facebook,
        whatsapp: terreiro.whatsapp,
        lat: terreiro.lat,
        lng: terreiro.lng,
        fotos: terreiro.fotos,
      },
    });
  }

  await prisma.user.createMany({
    data: [
      {
        id: SEED_USUARIO_USER_ID,
        email: "usuario@teste.com",
        passwordHash,
        role: "USUARIO",
      },
      {
        id: SEED_TERREIRO_USER_ID,
        email: "terreiro@teste.com",
        passwordHash,
        role: "TERREIRO",
        terreiroId: LOGGED_TERREIRO_ID,
      },
    ],
  });

  for (const evento of MOCK_EVENTOS) {
    await prisma.evento.create({
      data: {
        id: evento.id,
        terreiroId: evento.terreiroId,
        titulo: evento.titulo,
        categoria: evento.categoria,
        data: evento.data,
        horario: evento.horario,
        local: evento.local,
        descricao: evento.descricao,
        linkIngresso: evento.linkIngresso,
        status: "ATIVO",
      },
    });
  }

  for (const campanha of MOCK_CAMPANHAS) {
    if (campanha.metaTipo === "monetaria") {
      await prisma.campanha.create({
        data: {
          id: campanha.id,
          terreiroId: campanha.terreiroId,
          parceiroTerreiroId: campanha.parceiroTerreiroId,
          titulo: campanha.titulo,
          descricao: campanha.descricao,
          dataInicio: campanha.dataInicio,
          dataFim: campanha.dataFim,
          status:
            campanha.status === "ativa"
              ? "ATIVA"
              : campanha.status === "encerrada"
                ? "ENCERRADA"
                : "RASCUNHO",
          metaTipo: "MONETARIA",
          metaArrecadacao: campanha.metaArrecadacao,
          valorArrecadado: campanha.valorArrecadado,
        },
      });
      continue;
    }

    await prisma.campanha.create({
      data: {
        id: campanha.id,
        terreiroId: campanha.terreiroId,
        parceiroTerreiroId: campanha.parceiroTerreiroId,
        titulo: campanha.titulo,
        descricao: campanha.descricao,
        dataInicio: campanha.dataInicio,
        dataFim: campanha.dataFim,
        status:
          campanha.status === "ativa"
            ? "ATIVA"
            : campanha.status === "encerrada"
              ? "ENCERRADA"
              : "RASCUNHO",
        metaTipo: "ITENS",
        itemDescricao: campanha.itemDescricao,
        metaQuantidade: campanha.metaQuantidade,
        quantidadeArrecadada: campanha.quantidadeArrecadada,
        unidade: campanha.unidade,
      },
    });
  }

  await prisma.propostaCampanha.create({
    data: {
      id: "proposta-demo-1",
      deTerreiroId: "3",
      paraTerreiroId: LOGGED_TERREIRO_ID,
      titulo: "Campanha conjunta — giras de Betim e Sarandi",
      descricao:
        "Proposta do Ylê Axé Orixá Xangô (Betim) para arrecadação conjunta de mantimentos e transporte compartilhado entre as giras semanais dos dois terreiros.",
      metaTipo: "ITENS",
      itemDescricao: "Mantimentos para feijoada comunitária",
      metaQuantidade: 200,
      unidade: "itens",
      dataInicio: "2026-06-01",
      dataFim: "2026-09-30",
      status: "PENDENTE",
    },
  });

  const defaultUsuarioFavoritos = MOCK_TERREIROS.slice(0, 3).map((t) => t.id);
  await prisma.favoritoTerreiro.createMany({
    data: defaultUsuarioFavoritos.map((terreiroId) => ({
      userId: SEED_USUARIO_USER_ID,
      terreiroId,
    })),
  });

  await prisma.favoritoEvento.createMany({
    data: MOCK_EVENTOS.map((evento) => ({
      userId: SEED_TERREIRO_USER_ID,
      eventoId: evento.id,
    })),
  });

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
