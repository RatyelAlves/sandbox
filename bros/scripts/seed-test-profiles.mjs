import { createClient } from "@supabase/supabase-js";
import { deflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PASSWORD = "BrosTeste123";
const CITY = "Belo Horizonte, MG";

const PEOPLE = [
  {
    email: "teste.lago@bros.dev",
    alias: "Lago",
    age: 24,
    city: CITY,
    looking_for: "encontros",
    discreet_mode: false,
    bio: "Curto bar baixo e sair sem plateia.",
    height_cm: 178,
    weight_kg: 74,
    body_type: "atlético",
    position: "ativo",
    photos: [
      { kind: "body", is_private: false, rgb: [52, 52, 52] },
      { kind: "other", is_private: false, rgb: [90, 72, 48] },
    ],
  },
  {
    email: "teste.nimbo@bros.dev",
    alias: "Nimbo",
    age: 31,
    city: CITY,
    looking_for: "amizade",
    discreet_mode: true,
    bio: "Discreto. Conversa primeiro.",
    height_cm: 172,
    weight_kg: 68,
    body_type: "magro",
    position: "versátil",
    photos: [
      { kind: "body", is_private: false, rgb: [36, 36, 40] },
      { kind: "face", is_private: true, rgb: [120, 96, 80] },
    ],
  },
  {
    email: "teste.vale@bros.dev",
    alias: "Vale",
    age: 28,
    city: CITY,
    looking_for: "relacionamento",
    discreet_mode: false,
    bio: "Procuro algo com calma. Sem pressa de se expor.",
    height_cm: 183,
    weight_kg: 86,
    body_type: "grande",
    position: "passivo",
    photos: [
      { kind: "body", is_private: false, rgb: [28, 32, 28] },
      { kind: "other", is_private: true, rgb: [64, 48, 40] },
    ],
  },
  {
    email: "teste.puma@bros.dev",
    alias: "Puma",
    age: 22,
    city: CITY,
    looking_for: "sem_pressa",
    discreet_mode: false,
    bio: "",
    height_cm: 169,
    weight_kg: 63,
    body_type: "médio",
    position: "versátil",
    photos: [{ kind: "body", is_private: false, rgb: [48, 40, 36] }],
  },
  {
    email: "teste.echo@bros.dev",
    alias: "Echo",
    age: 35,
    city: CITY,
    looking_for: "encontros",
    discreet_mode: true,
    bio: "Tudo privado. Pede as fotos se rolar.",
    height_cm: 176,
    weight_kg: 79,
    body_type: "musculoso",
    position: "ativo",
    photos: [
      { kind: "body", is_private: true, rgb: [24, 24, 24] },
      { kind: "other", is_private: true, rgb: [40, 28, 28] },
    ],
  },
  {
    email: "teste.rio@bros.dev",
    alias: "Rio",
    age: 27,
    city: "São Paulo, SP",
    looking_for: "encontros",
    discreet_mode: false,
    bio: "Estou em outra cidade. Só aparece se filtrar SP.",
    height_cm: 180,
    weight_kg: 77,
    body_type: "atlético",
    position: "versátil",
    photos: [{ kind: "body", is_private: false, rgb: [32, 44, 56] }],
  },
];

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const payload = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([length, payload, crc]);
}

function makePng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const start = y * (width * 3 + 1);
    raw[start] = 0;
    for (let x = 0; x < width; x += 1) {
      raw[start + 1 + x * 3] = rgb[0];
      raw[start + 2 + x * 3] = rgb[1];
      raw[start + 3 + x * 3] = rgb[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureUser(supabase, person) {
  const signedIn = await supabase.auth.signInWithPassword({
    email: person.email,
    password: PASSWORD,
  });
  if (signedIn.data.user) return signedIn.data.user;

  const created = await supabase.auth.signUp({
    email: person.email,
    password: PASSWORD,
  });
  if (created.data.user && created.data.session) return created.data.user;
  if (created.error?.message?.toLowerCase().includes("already")) {
    const again = await supabase.auth.signInWithPassword({
      email: person.email,
      password: PASSWORD,
    });
    if (again.data.user) return again.data.user;
  }
  throw new Error(
    created.error?.message ||
      signedIn.error?.message ||
      "Sem sessão. Desative Confirm email no Supabase Auth.",
  );
}

async function upsertProfile(supabase, userId, person) {
  const full = {
    id: userId,
    alias: person.alias,
    bio: person.bio,
    city: person.city,
    age: person.age,
    looking_for: person.looking_for,
    discreet_mode: person.discreet_mode,
    height_cm: person.height_cm,
    weight_kg: person.weight_kg,
    body_type: person.body_type,
    position: person.position,
  };
  const { error } = await supabase.from("profiles").upsert(full);
  if (!error) return;
  const { error: basicError } = await supabase.from("profiles").upsert({
    id: userId,
    alias: person.alias,
    bio: person.bio,
    city: person.city,
    age: person.age,
    looking_for: person.looking_for,
    discreet_mode: person.discreet_mode,
  });
  if (basicError) throw new Error(basicError.message);
}

async function ensurePhotos(supabase, userId, person) {
  const { data: existing } = await supabase
    .from("photos")
    .select("id")
    .eq("user_id", userId);
  if ((existing ?? []).length) return;

  let avatarId = null;
  for (const photo of person.photos) {
    const id = crypto.randomUUID();
    const path = `${userId}/${id}.png`;
    const bytes = makePng(480, 600, photo.rgb);
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (uploadError) {
      console.warn(`  foto ${person.alias}: ${uploadError.message}`);
      continue;
    }
    const { error: insertError } = await supabase.from("photos").insert({
      id,
      user_id: userId,
      kind: photo.kind,
      is_private: photo.is_private,
      path,
    });
    if (insertError) {
      console.warn(`  foto meta ${person.alias}: ${insertError.message}`);
      continue;
    }
    if (!avatarId && !photo.is_private && photo.kind !== "face") avatarId = id;
  }
  if (avatarId) {
    await supabase.from("profiles").update({ avatar_photo_id: avatarId }).eq("id", userId);
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient(url, key);
  console.log("Criando perfis de teste…\n");

  for (const person of PEOPLE) {
    try {
      const user = await ensureUser(supabase, person);
      await upsertProfile(supabase, user.id, person);
      await ensurePhotos(supabase, user.id, person);
      await supabase.auth.signOut();
      console.log(`ok  ${person.alias.padEnd(8)}  ${person.city}  ${person.email}`);
      await sleep(400);
    } catch (error) {
      console.error(`erro ${person.alias}: ${error.message}`);
      await supabase.auth.signOut().catch(() => {});
    }
  }

  console.log("\nSenha de todos: " + PASSWORD);
  console.log("No Explorar, filtre por Belo Horizonte, MG para ver 5 deles.");
  console.log("Rio só aparece em São Paulo, SP.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
