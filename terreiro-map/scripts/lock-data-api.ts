import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

const sql = readFileSync(
  resolve(__dirname, "../supabase/lock-data-api.sql"),
  "utf8",
);

const client = new Client({
  connectionString,
  ssl: connectionString.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function main() {
  await client.connect();
  await client.query(sql);

  const status = await client.query(`
    select c.relname as table,
           c.relrowsecurity as rls,
           coalesce((select count(*) from pg_policy p where p.polrelid = c.oid), 0) as policies
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  `);

  const grants = await client.query(`
    select table_name, grantee
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
    group by table_name, grantee
    order by table_name, grantee
  `);

  console.log("RLS:");
  for (const row of status.rows) {
    console.log(`  ${row.table} rls=${row.rls} policies=${row.policies}`);
  }
  console.log(
    grants.rows.length === 0
      ? "Nenhum grant restante para anon/authenticated."
      : `Ainda há grants: ${JSON.stringify(grants.rows)}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
