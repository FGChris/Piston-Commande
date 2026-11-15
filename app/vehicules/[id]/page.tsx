import Link from "next/link";
import { randomUUID } from "node:crypto";
import { NeedsWorkspace } from "@/app/needs-workspace";
import type { NeedRow } from "@/lib/needs";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  LockKeyhole,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { withSession } from "@/lib/db";
import { identityGaps, simulatedProvider } from "@/lib/vehicle";
import { recordObservation, type Vehicle } from "@/lib/vehicles";
import { Shell } from "@/app/components";
export const dynamic = "force-dynamic";
export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
  )
    notFound();
  const vehicle = await withSession(
    session.hash,
    async (client) =>
      (
        await client.query<Vehicle>(
          "SELECT * FROM public.vehicles WHERE id=$1",
          [id],
        )
      ).rows[0],
  );
  if (!vehicle) notFound();
  const result = await simulatedProvider.identify(vehicle.plate);
  const { garage, observations, needs, eventCount } = await withSession(
    session.hash,
    async (client) => {
      await recordObservation(client, vehicle.plate, result);
      const g = await client.query("SELECT name FROM public.garages");
      const history = await client.query(
        "SELECT checked_at,result FROM public.observations WHERE vehicle_id=$1 ORDER BY checked_at DESC LIMIT 5",
        [id],
      );
      const needs = await client.query<NeedRow>(
        "SELECT id,vehicle_id,family,label,quantity,axle,side,notes,version,active FROM public.vehicle_needs WHERE vehicle_id=$1 AND active ORDER BY created_at,id",
        [id],
      );
      const events = await client.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM public.need_events e JOIN public.vehicle_needs n ON n.id=e.need_id AND n.garage_id=e.garage_id WHERE n.vehicle_id=$1",
        [id],
      );
      return {
        needs: needs.rows,
        eventCount: events.rows[0].count,
        garage: g.rows[0]?.name ?? "Atelier inaccessible",
        observations: history.rows,
      };
    },
  );
  const gaps = identityGaps(result.identity);
  const complete = result.status === "identified" && gaps.length === 0;
  const fields = [
    ["VIN", result.identity?.vin],
    ["Marque", result.identity?.make],
    ["Modèle", result.identity?.model],
    ["Code moteur", result.identity?.engine],
    ["Carburant", result.identity?.fuel],
    ["Boîte de vitesses", result.identity?.gearbox],
    ["Première immatriculation", result.identity?.firstRegistration],
  ];
  return (
    <Shell session={session} garage={garage}>
      <Link href="/" className="back-link">
        <ArrowLeft size={17} /> Retour à l’atelier
      </Link>
      <div className="page-heading vehicle-heading">
        <div>
          <div className="eyebrow dark">
            FICHE VÉHICULE ·{" "}
            {vehicle.synthetic ? "TEST SYNTHÉTIQUE" : "SOURCE NON CONNECTÉE"}
          </div>
          <h1>{vehicle.plate}</h1>
          <p>Une identité sourcée, avant toute recherche de pièce.</p>
        </div>
        <span className="vehicle-hero-icon">
          <CarFront size={40} />
        </span>
      </div>
      <div
        className={`identity-banner ${complete ? "complete" : "blocked"}`}
        role="status"
      >
        {complete ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
        <div>
          <h2>
            {complete
              ? "Identité de test complète"
              : "Identification à vérifier"}
          </h2>
          <p>{result.message}</p>
        </div>
      </div>
      <div className="detail-grid">
        <section className="card identity-card">
          <div className="section-heading">
            <h2>Les informations du véhicule</h2>
            <span className="source-label">
              {result.synthetic ? "FICTIF" : "NON VÉRIFIÉ"}
            </span>
          </div>
          <dl className="identity-fields">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={value ? "" : "missing"}>
                  {value || "Non renseigné"}
                </dd>
              </div>
            ))}
          </dl>
          <div className="detail-source">
            <ShieldCheck size={18} />
            <div>
              <strong>{result.source}</strong>
              <span>
                Vérification :{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "medium",
                  timeZone: "Europe/Paris",
                }).format(new Date(result.checkedAt))}{" "}
                · heure de Paris
              </span>
            </div>
          </div>
        </section>
        <aside className="card next-step">
          <span className="metric-icon amber">
            <LockKeyhole size={23} />
          </span>
          <h2>
            {complete
              ? "Une première étape franchie."
              : "On ne devine pas une identité."}
          </h2>
          <p>
            {complete
              ? "Cette fiche valide le parcours de démonstration. Elle ne permet aucune sélection ou commande réelle."
              : "La recherche de pièces reste bloquée tant que l’identité n’est pas complète et vérifiée."}
          </p>
          {gaps.length > 0 && result.identity && (
            <div className="missing-box">
              <strong>À compléter</strong>
              <ul>
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
          {complete ? (
            <a className="button primary" href="#besoins">
              <CarFront size={17} /> Décrire les besoins
            </a>
          ) : (
            <button className="button disabled" disabled>
              <LockKeyhole size={17} /> Besoins en pièces bloqués
            </button>
          )}
          <Link
            className="button secondary"
            href={`/vehicules/${id}`}
            prefetch={false}
          >
            <RotateCw size={17} /> Revérifier la fiche
          </Link>
        </aside>
      </div>
      <NeedsWorkspace
        vehicleId={id}
        creationId={randomUUID()}
        needs={needs}
        canEdit={complete}
        eventCount={eventCount}
      />
      <section className="card history">
        <div className="section-heading">
          <div>
            <h2>Dernières vérifications</h2>
            <p className="muted">
              Chaque observation conserve sa source et son état.
            </p>
          </div>
        </div>
        <ol>
          {observations.map((observation, index) => (
            <li key={index}>
              <span className="status-dot" />
              <div>
                <strong>{observation.result.source}</strong>
                <small>{observation.result.message}</small>
              </div>
              <time dateTime={new Date(observation.checked_at).toISOString()}>
                {new Intl.DateTimeFormat("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: "Europe/Paris",
                }).format(new Date(observation.checked_at))}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
