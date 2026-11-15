"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME, getSession, requireSession, hashToken } from "@/lib/auth";
import { database, withSession } from "@/lib/db";
import { normalizePlate, simulatedProvider } from "@/lib/vehicle";
import { recordObservation } from "@/lib/vehicles";
export type FormState = { error: string };

export async function login(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const existing = await getSession();
  if (existing) redirect("/");
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(200) })
    .safeParse({
      email: String(form.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password: form.get("password"),
    });
  if (parsed.success && Buffer.byteLength(parsed.data.password, "utf8") > 72)
    return { error: "Le mot de passe dépasse la longueur autorisée." };
  if (!parsed.success)
    return {
      error: "Renseignez une adresse e-mail valide et votre mot de passe.",
    };
  const token = randomBytes(32).toString("hex");
  try {
    const result = await database().query(
      "SELECT public.open_session($1,$2,$3) AS accepted",
      [parsed.data.email, parsed.data.password, hashToken(token)],
    );
    if (!result.rows[0].accepted)
      return {
        error:
          "Connexion refusée. Vérifiez vos identifiants. Après plusieurs essais, patientez 15 minutes.",
      };
  } catch {
    return {
      error:
        "La connexion à l’atelier est momentanément indisponible. Réessayez.",
    };
  }
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  redirect("/");
}
export async function logout() {
  const session = await requireSession();
  await withSession(session.hash, async (client) => {
    await client.query("SELECT public.close_session()");
  });
  (await cookies()).delete(COOKIE_NAME);
  redirect("/connexion");
}
export async function identifyVehicle(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const session = await requireSession();
  let plate: string;
  try {
    plate = normalizePlate(String(form.get("plate") ?? "").slice(0, 40));
  } catch {
    return {
      error:
        "Saisissez une plaque au format AB-123-CD ou un identifiant de test DEMO-001.",
    };
  }
  let id: string;
  try {
    const result = await simulatedProvider.identify(plate);
    id = await withSession(session.hash, (client) =>
      recordObservation(client, plate, result),
    );
  } catch {
    return {
      error: "La fiche n’a pas pu être enregistrée. Réessayez dans un instant.",
    };
  }
  redirect(`/vehicules/${id}`);
}
