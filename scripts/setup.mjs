import { readFile, writeFile, readdir } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
import pg from "pg";
const config = JSON.parse(await readFile(".local/postgres.json", "utf8"));
const admin = new pg.Client({
  host: "127.0.0.1",
  port: config.port,
  user: config.user,
  password: config.password,
  database: "depanos",
});
await admin.connect();
try {
  let local;
  try {
    local = JSON.parse(await readFile(".local/accounts.json", "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    local = {
      databasePassword: randomBytes(32).toString("hex"),
      accounts: [
        {
          email: "boss@atelier-a.test",
          password: randomBytes(18).toString("base64url"),
          name: "Boss de test A",
          garage: "Atelier de test A",
          garageId: "11111111-1111-4111-8111-111111111111",
        },
        {
          email: "boss@atelier-b.test",
          password: randomBytes(18).toString("base64url"),
          name: "Boss de test B",
          garage: "Atelier de test B",
          garageId: "22222222-2222-4222-8222-222222222222",
        },
      ],
    };
    await writeFile(".local/accounts.json", JSON.stringify(local, null, 2), {
      mode: 0o600,
      flag: "wx",
    });
  }
  // Generated password is hex, never a user-supplied SQL fragment.
  if (
    !(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='depanos_app'"))
      .rowCount
  )
    await admin.query(
      `CREATE ROLE depanos_app LOGIN PASSWORD '${local.databasePassword}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`,
    );
  await admin.query(
    "CREATE TABLE IF NOT EXISTS public.schema_migrations(name text PRIMARY KEY, checksum text NOT NULL)",
  );
  for (const file of (await readdir("database"))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const name = file.replace(/\.sql$/, "");
    const sql = await readFile(`database/${file}`, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const old = await admin.query(
      "SELECT checksum FROM public.schema_migrations WHERE name=$1",
      [name],
    );
    if (old.rowCount && old.rows[0].checksum !== checksum)
      throw new Error(
        `Migration ${name} déjà appliquée mais modifiée : créer une nouvelle migration.`,
      );
    if (!old.rowCount) {
      await admin.query("BEGIN");
      try {
        await admin.query(sql);
        await admin.query(
          "INSERT INTO public.schema_migrations VALUES($1,$2)",
          [name, checksum],
        );
        await admin.query("COMMIT");
      } catch (error) {
        await admin.query("ROLLBACK");
        throw error;
      }
    }
  }
  for (const account of local.accounts) {
    await admin.query(
      "INSERT INTO public.garages(id,name,synthetic) VALUES($1,$2,true) ON CONFLICT DO NOTHING",
      [account.garageId, account.garage],
    );
    await admin.query(
      "INSERT INTO private.accounts(garage_id,email,display_name,password_hash,role) VALUES($1,$2,$3,extensions.crypt($4,extensions.gen_salt('bf',12)),'boss') ON CONFLICT(email) DO NOTHING",
      [account.garageId, account.email, account.name, account.password],
    );
  }
  const env = `DATABASE_URL=postgresql://depanos_app:${local.databasePassword}@127.0.0.1:${config.port}/depanos\nCOOKIE_SECURE=false\n`;
  try {
    await writeFile(".env.local", env, { mode: 0o600, flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    console.log(".env.local existant conservé.");
  }
  console.log(
    "Schéma et deux garages de test prêts. Identifiants dans .local/accounts.json (fichier privé ignoré par Git).",
  );
} finally {
  await admin.end();
}

// Idempotent : ne remplace jamais une clé existante.
await import("./init-secrets.mjs");
