import type { PoolClient } from "pg";
import type { Identification, Identity } from "./vehicle";
export type Vehicle = {
  id: string;
  plate: string;
  synthetic: boolean;
  last_known: Identity | null;
  latest_status: Identification["status"];
  checked_at: Date;
  created_at: Date;
};
export async function recordObservation(
  client: PoolClient,
  plate: string,
  result: Identification,
): Promise<string> {
  const saved = await client.query<{ id: string }>(
    `INSERT INTO public.vehicles(plate,synthetic,last_known,latest_status,checked_at)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT(garage_id,plate) DO UPDATE SET
    last_known=COALESCE(public.vehicles.last_known,'{}'::jsonb) || COALESCE((SELECT jsonb_object_agg(key,value) FROM jsonb_each($3::jsonb) WHERE value<>'null'::jsonb),'{}'::jsonb),
    latest_status=$4,checked_at=$5 RETURNING id`,
    [plate, result.synthetic, result.identity, result.status, result.checkedAt],
  );
  const id = saved.rows[0].id;
  await client.query(
    "INSERT INTO public.observations(vehicle_id,source,result,checked_at) VALUES($1,$2,$3,$4)",
    [id, result.source, result, result.checkedAt],
  );
  return id;
}
