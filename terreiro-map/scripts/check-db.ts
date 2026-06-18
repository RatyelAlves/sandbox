import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

async function main() {
  if (!connectionString) {
    console.error(
      "❌ Nenhuma URL configurada. Copie .env.example → .env e preencha DIRECT_URL.",
    );
    process.exit(1);
  }

  const masked = connectionString.replace(/:([^:@/]+)@/, ":****@");
  console.log(`Testando conexão: ${masked}`);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    const [terreiros, eventos, users] = await Promise.all([
      prisma.terreiro.count(),
      prisma.evento.count(),
      prisma.user.count(),
    ]);

    console.log("✅ Conexão com Supabase/Postgres OK");
    console.log(`   Terreiros: ${terreiros}`);
    console.log(`   Eventos:   ${eventos}`);
    console.log(`   Usuários:  ${users}`);

    if (terreiros === 0) {
      console.log("\n💡 Banco vazio. Rode: npm run db:setup");
    }
  } catch (error) {
    console.error("❌ Falha na conexão:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
