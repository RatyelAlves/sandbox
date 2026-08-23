import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PASSWORD = "BrosTeste123";
const KEEP = new Set(["cotrax", "c0tr4x"]);
const TEST_EMAILS = [
  "teste.lago@bros.dev",
  "teste.nimbo@bros.dev",
  "teste.vale@bros.dev",
  "teste.puma@bros.dev",
  "teste.echo@bros.dev",
  "teste.rio@bros.dev",
];

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function wipeOwnData(supabase, userId) {
  const { data: photos } = await supabase
    .from("photos")
    .select("id, path")
    .eq("user_id", userId);
  const photoPaths = (photos ?? []).map((row) => row.path).filter(Boolean);
  if (photoPaths.length) {
    await supabase.storage.from("photos").remove(photoPaths);
  }
  await supabase.from("photos").delete().eq("user_id", userId);

  const { data: chatFiles } = await supabase.storage.from("chat").list(userId, {
    limit: 200,
  });
  if (chatFiles?.length) {
    await supabase.storage
      .from("chat")
      .remove(chatFiles.map((file) => `${userId}/${file.name}`));
  }

  await supabase.from("photo_grants").delete().eq("owner_id", userId);
  await supabase.from("photo_requests").delete().eq("owner_id", userId);
  await supabase.from("likes").delete().eq("from_id", userId);
  await supabase.from("blocks").delete().eq("blocker_id", userId);
}

async function deleteOwnAccount(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "sem sessão" };
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  });
  if (res.ok) return { error: null };
  return { error: `${res.status} ${await res.text()}` };
}

async function main() {
  loadEnv();
  const probe = client();
  let listed = [];
  for (const email of TEST_EMAILS) {
    const { data, error } = await probe.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });
    if (error || !data.user) continue;
    const { data: rows } = await probe
      .from("profiles")
      .select("id, alias, city");
    listed = rows ?? [];
    await probe.auth.signOut();
    break;
  }

  console.log("Perfis agora:");
  for (const row of listed) {
    console.log(`  ${row.alias}  ${row.city}  ${row.id}`);
  }

  const keep = listed.filter((row) => KEEP.has(row.alias.toLowerCase()));
  if (!keep.length) {
    console.log("\nCotrax não apareceu na lista (pode estar só no auth). Sigo apagando os @bros.dev.");
  } else {
    console.log(`\nMantendo: ${keep.map((row) => row.alias).join(", ")}`);
  }

  for (const email of TEST_EMAILS) {
    const supabase = client();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });
    if (error || !data.user) {
      console.log(`pula ${email}: ${error?.message ?? "sem usuário"}`);
      continue;
    }
    const alias =
      listed.find((row) => row.id === data.user.id)?.alias ?? email;
    if (KEEP.has(String(alias).toLowerCase())) {
      console.log(`mantém ${alias}`);
      await supabase.auth.signOut();
      continue;
    }
    await wipeOwnData(supabase, data.user.id);
    const removed = await deleteOwnAccount(supabase);
    if (removed.error) {
      console.log(`dados limpos, conta ficou: ${alias} (${removed.error})`);
    } else {
      console.log(`apagou ${alias}  ${email}`);
    }
    await supabase.auth.signOut().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
