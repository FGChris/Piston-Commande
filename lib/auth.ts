import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { withSession } from "./db";
export const COOKIE_NAME = "depanos_session";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export type Session = {
  hash: string;
  account_id: string;
  garage_id: string;
  display_name: string;
  role: "boss" | "seller" | "mechanic";
};
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = hashToken(token);
  return withSession(hash, async (client) => {
    const result = await client.query(
      "SELECT * FROM public.session_identity()",
    );
    return result.rowCount ? { ...result.rows[0], hash } : null;
  });
}
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session;
}
