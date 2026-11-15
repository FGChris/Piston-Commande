import type { PoolClient } from "pg";
import { identityGaps, simulatedProvider } from "./vehicle";
import { recordObservation } from "./vehicles";
import type { NeedInput } from "./needs";
export class NeedError extends Error {}
export async function verifyVehicleForNeeds(
  client: PoolClient,
  vehicleId: string,
) {
  const row = (
    await client.query(
      "SELECT plate FROM public.vehicles WHERE id=$1 FOR UPDATE",
      [vehicleId],
    )
  ).rows[0];
  if (!row)
    throw new NeedError("Cette fiche est inaccessible dans votre atelier.");
  const result = await simulatedProvider.identify(row.plate);
  await recordObservation(client, row.plate, result);
  if (result.status !== "identified" || identityGaps(result.identity).length)
    throw new NeedError(
      "L’identité doit être complète et revérifiée avant de décrire les besoins.",
    );
}
export async function saveNeed(
  client: PoolClient,
  vehicleId: string,
  id: string,
  input: NeedInput,
  version: number | null,
) {
  await verifyVehicleForNeeds(client, vehicleId);
  const values = [
    input.family,
    input.label,
    input.quantity,
    input.axle,
    input.side,
    input.notes,
  ];
  if (version === null) {
    const saved = await client.query(
      "INSERT INTO public.vehicle_needs(id,vehicle_id,family,label,quantity,axle,side,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING RETURNING id",
      [id, vehicleId, ...values],
    );
    if (!saved.rowCount) {
      const existing = (
        await client.query(
          "SELECT * FROM public.vehicle_needs WHERE id=$1 AND vehicle_id=$2 AND active",
          [id, vehicleId],
        )
      ).rows[0];
      if (
        !existing ||
        values.some(
          (value, index) =>
            value !==
            existing[
              ["family", "label", "quantity", "axle", "side", "notes"][index]
            ],
        )
      )
        throw new NeedError(
          "Ce formulaire a déjà été utilisé. Rechargez la fiche avant de continuer.",
        );
    }
  } else {
    const changed = await client.query(
      "UPDATE public.vehicle_needs SET family=$1,label=$2,quantity=$3,axle=$4,side=$5,notes=$6 WHERE id=$7 AND vehicle_id=$8 AND version=$9 AND active RETURNING id",
      [...values, id, vehicleId, version],
    );
    if (!changed.rowCount)
      throw new NeedError(
        "Ce besoin a changé depuis son ouverture. Rechargez la fiche avant de recommencer.",
      );
  }
}
export async function removeNeed(
  client: PoolClient,
  vehicleId: string,
  id: string,
  version: number,
) {
  const changed = await client.query(
    "UPDATE public.vehicle_needs SET active=false WHERE id=$1 AND vehicle_id=$2 AND version=$3 AND active RETURNING id",
    [id, vehicleId, version],
  );
  if (!changed.rowCount)
    throw new NeedError(
      "Ce besoin a changé ou n’est plus accessible. Rechargez la fiche.",
    );
}
