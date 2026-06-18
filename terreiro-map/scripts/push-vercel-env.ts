import "dotenv/config";
import { execSync } from "node:child_process";

const KEYS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

function pushEnv(name: string, value: string) {
  execSync(
    `npx vercel env add ${name} production --force --yes --value ${JSON.stringify(value)}`,
    {
      stdio: "inherit",
      cwd: process.cwd(),
    },
  );
  console.log(`✓ ${name}`);
}

for (const key of KEYS) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.warn(`⚠ ${key} ausente no .env — pulando`);
    continue;
  }
  pushEnv(key, value);
}

console.log("\nPronto. Rode: npx vercel --prod");
