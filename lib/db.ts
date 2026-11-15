import { Pool, type PoolClient } from "pg";
const globalDb = globalThis as unknown as { depanosPool?: Pool };
export function database(): Pool {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL manquant : exécuter la préparation locale.");
  return (globalDb.depanosPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
  }));
}
export async function withSession<T>(
  hash: string,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.session_hash',$1,true)", [hash]);
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
