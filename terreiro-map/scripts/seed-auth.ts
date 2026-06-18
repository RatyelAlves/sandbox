import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  LOGGED_TERREIRO_ID,
  MOCK_EVENTOS,
  MOCK_TERREIROS,
} from "../src/lib/mock-data";
import {
  SEED_TERREIRO_USER_ID,
  SEED_USUARIO_USER_ID,
} from "../src/lib/db/constants";
import { linkUserAuthId } from "../src/lib/db/users";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "../src/lib/supabase/env";

const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USERS = [
  {
    prismaId: SEED_USUARIO_USER_ID,
    email: "usuario@teste.com",
    password: "123456",
    accountType: "usuario" as const,
  },
  {
    prismaId: SEED_TERREIRO_USER_ID,
    email: "terreiro@teste.com",
    password: "123456",
    accountType: "terreiro" as const,
  },
];

async function ensureAuthUser(user: (typeof TEST_USERS)[number]) {
  const email = user.email.toLowerCase();

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) throw listError;

  const existing = listed.users.find(
    (item) => item.email?.toLowerCase() === email,
  );

  if (existing) {
    await linkUserAuthId(user.prismaId, existing.id);
    console.log(`✓ ${email} já existe no Supabase Auth`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      accountType: user.accountType,
      terreiroId: user.accountType === "terreiro" ? LOGGED_TERREIRO_ID : null,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Falha ao criar ${email}`);
  }

  await linkUserAuthId(user.prismaId, data.user.id);
  console.log(`✓ ${email} criado no Supabase Auth`);
  return data.user.id;
}

async function main() {
  console.log("Sincronizando contas de teste com Supabase Auth...");

  for (const user of TEST_USERS) {
    await ensureAuthUser(user);
  }

  console.log("\nContas prontas:");
  for (const user of TEST_USERS) {
    console.log(`  ${user.email} / ${user.password} (${user.accountType})`);
  }

  console.log(
    `\nFavoritos seed: usuário → ${MOCK_TERREIROS.slice(0, 3).length} terreiros, terreiro → ${MOCK_EVENTOS.length} eventos`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
