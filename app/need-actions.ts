"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { withSession } from "@/lib/db";
import { needSchema } from "@/lib/needs";
import { NeedError, saveNeed, removeNeed } from "@/lib/need-store";
export type NeedState = { error: string; success: string };
const ids = z.object({ vehicleId: z.uuid(), id: z.uuid() });
export async function saveVehicleNeed(
  _state: NeedState,
  form: FormData,
): Promise<NeedState> {
  const session = await requireSession();
  const keys = ids.safeParse({
    vehicleId: form.get("vehicleId"),
    id: form.get("id"),
  });
  const input = needSchema.safeParse(
    Object.fromEntries(
      ["family", "label", "quantity", "axle", "side", "notes"].map((key) => [
        key,
        form.get(key),
      ]),
    ),
  );
  const version = form.get("version");
  const parsedVersion =
    version === ""
      ? null
      : z
          .string()
          .regex(/^[1-9][0-9]{0,8}$/)
          .safeParse(version);
  if (
    !keys.success ||
    !input.success ||
    (parsedVersion !== null && !parsedVersion.success)
  )
    return {
      error:
        "Vérifiez la famille, le libellé, la quantité entière et les deux positions. Les notes sont limitées à 1 000 caractères.",
      success: "",
    };
  try {
    const domainError = await withSession(session.hash, async (client) => {
      try {
        await saveNeed(
          client,
          keys.data.vehicleId,
          keys.data.id,
          input.data,
          parsedVersion === null ? null : Number(parsedVersion.data),
        );
        return null;
      } catch (error) {
        // Une vérification fraîche et son état bloquant doivent rester enregistrés.
        if (error instanceof NeedError) return error.message;
        throw error;
      }
    });
    if (domainError) {
      revalidatePath(`/vehicules/${keys.data.vehicleId}`);
      return { error: domainError, success: "" };
    }
  } catch (error) {
    return {
      error:
        error instanceof NeedError
          ? error.message
          : "Le besoin n’a pas pu être enregistré. Réessayez.",
      success: "",
    };
  }
  revalidatePath(`/vehicules/${keys.data.vehicleId}`);
  return {
    error: "",
    success:
      parsedVersion === null
        ? "Besoin ajouté au dossier."
        : "Besoin mis à jour.",
  };
}
export async function removeVehicleNeed(
  _state: NeedState,
  form: FormData,
): Promise<NeedState> {
  const session = await requireSession();
  const parsed = ids
    .extend({ version: z.string().regex(/^[1-9][0-9]{0,8}$/) })
    .safeParse({
      vehicleId: form.get("vehicleId"),
      id: form.get("id"),
      version: form.get("version"),
    });
  if (!parsed.success)
    return {
      error: "Le formulaire est invalide. Rechargez la fiche.",
      success: "",
    };
  try {
    await withSession(session.hash, (client) =>
      removeNeed(
        client,
        parsed.data.vehicleId,
        parsed.data.id,
        Number(parsed.data.version),
      ),
    );
  } catch (error) {
    return {
      error:
        error instanceof NeedError
          ? error.message
          : "Le retrait n’a pas pu être enregistré. Réessayez.",
      success: "",
    };
  }
  revalidatePath(`/vehicules/${parsed.data.vehicleId}`);
  return { error: "", success: "Besoin retiré. Son historique est conservé." };
}
