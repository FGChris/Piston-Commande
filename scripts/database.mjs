import EmbeddedPostgres from "embedded-postgres";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

const directory = path.resolve(".local");
await mkdir(directory, { recursive: true, mode: 0o700 });
const configPath = path.join(directory, "postgres.json");
let config;
try {
  config = JSON.parse(await readFile(configPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  config = {
    user: "postgres",
    password: randomBytes(32).toString("hex"),
    port: 55432,
  };
  await writeFile(configPath, JSON.stringify(config), {
    mode: 0o600,
    flag: "wx",
  });
}
const pg = new EmbeddedPostgres({
  ...config,
  databaseDir: path.join(directory, "postgres"),
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1", "-k", directory],
  onLog: () => {},
  onError: () => {},
});
try {
  await access(path.join(directory, "postgres", "PG_VERSION"));
} catch {
  await pg.initialise();
}
await pg.start();
const client = pg.getPgClient();
await client.connect();
if (
  !(await client.query("SELECT 1 FROM pg_database WHERE datname='depanos'"))
    .rowCount
)
  await client.query("CREATE DATABASE depanos");
await client.end();
console.log(
  "PostgreSQL local prêt sur 127.0.0.1:55432. Gardez ce terminal ouvert.",
);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    await pg.stop();
    process.exit(0);
  });
setInterval(() => {}, 60_000);
