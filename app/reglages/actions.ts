"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, COOKIE_NAME } from "@/lib/auth";
import { withSession } from "@/lib/db";
import { encryptionKey, seal } from "@/lib/secrets";
export type SettingsState = { error: string; success: string };
const providerSchema = z.enum([
  "dasir",
  "pavi",
  "partslink24",
  "yacco",
  "henrri",
]);
export async function saveSupplier(
  _state: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  if (session.role !== "boss")
    return { error: "Accès réservé au responsable.", success: "" };
  const parsed = z
    .object({
      provider: providerSchema,
      username: z.string().trim().min(1).max(254),
      password: z.string().min(1).max(4096),
      portal: z
        .url()
        .max(2048)
        .refine((value) => {
          const u = new URL(value);
          return (
            u.protocol === "https:" &&
            !u.username &&
            !u.password &&
            !u.search &&
            !u.hash
          );
        }),
    })
    .safeParse(
      Object.fromEntries(
        ["provider", "username", "password", "portal"].map((k) => [
          k,
          form.get(k),
        ]),
      ),
    );
  if (!parsed.success)
    return {
      error:
        "Renseignez les deux identifiants et une adresse HTTPS sans identifiant, paramètres ou fragment.",
      success: "",
    };
  if (form.get("authorized") !== "on")
    return {
      error: "Confirmez que ce compte est autorisé pour votre garage.",
      success: "",
    };
  try {
    const { provider, ...credentials } = parsed.data;
    const encrypted = seal(
      JSON.stringify(credentials),
      `${session.garage_id}:${provider}`,
      await encryptionKey(),
    );
    await withSession(session.hash, async (c) => {
      const saved = await c.query(
        "INSERT INTO public.supplier_credentials(provider,sealed_value) VALUES($1,$2) ON CONFLICT(garage_id,provider) DO UPDATE SET sealed_value=$2,updated_at=now() RETURNING provider",
        [provider, encrypted],
      );
      if (!saved.rowCount) throw new Error("Écriture refusée");
    });
  } catch {
    return {
      error:
        "Enregistrement indisponible. Vérifiez la préparation du coffre côté serveur.",
      success: "",
    };
  }
  revalidatePath("/reglages");
  return {
    error: "",
    success:
      "Accès chiffré enregistré. La connexion au fournisseur n’a pas été testée.",
  };
}
export async function deleteSupplier(
  _state: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  if (session.role !== "boss")
    return { error: "Accès réservé au responsable.", success: "" };
  const provider = providerSchema.safeParse(form.get("provider"));
  if (!provider.success || form.get("confirm") !== "on")
    return { error: "Confirmez la suppression de cet accès.", success: "" };
  try {
    await withSession(session.hash, (c) =>
      c.query("DELETE FROM public.supplier_credentials WHERE provider=$1", [
        provider.data,
      ]),
    );
  } catch {
    return { error: "Suppression indisponible. Réessayez.", success: "" };
  }
  revalidatePath("/reglages");
  return {
    error: "",
    success:
      "Accès supprimé du coffre actif. Les sauvegardes suivent leur propre politique de conservation.",
  };
}
export async function changePassword(
  _state: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  const current = form.get("current");
  const next = form.get("next");
  if (
    typeof current !== "string" ||
    typeof next !== "string" ||
    next.length < 15 ||
    Buffer.byteLength(next) > 72 ||
    Buffer.byteLength(current) > 72 ||
    next !== form.get("confirmation")
  )
    return {
      error:
        "Utilisez au moins 15 caractères (72 octets maximum) et confirmez le nouveau mot de passe.",
      success: "",
    };
  try {
    const ok = await withSession(
      session.hash,
      async (c) =>
        (
          await c.query("SELECT public.change_password($1,$2) AS ok", [
            current,
            next,
          ])
        ).rows[0].ok,
    );
    if (!ok)
      return {
        error:
          "Mot de passe actuel incorrect, nouveau mot de passe identique ou trop d’essais. Après cinq échecs, attendez 15 minutes.",
        success: "",
      };
  } catch {
    return { error: "Modification indisponible. Réessayez.", success: "" };
  }
  (await cookies()).delete(COOKIE_NAME);
  redirect("/connexion?password=updated");
}
