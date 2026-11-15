import Link from "next/link";
import {
  CarFront,
  ArrowRight,
  ArrowUpRight,
  Search,
  ShieldCheck,
  Layers3,
  CircleCheck,
  Clock3,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { withSession } from "@/lib/db";
import type { Vehicle } from "@/lib/vehicles";
import { Shell } from "./components";
import { VehicleForm } from "./forms";
export const dynamic = "force-dynamic";
const states: Record<string, string> = {
  identified: "Identifié · test",
  incomplete: "À compléter",
  ambiguous: "À vérifier",
  not_found: "Sans résultat",
  unavailable: "Source indisponible",
};
export default async function Home() {
  const session = await requireSession();
  const { garage, vehicles, total, complete, attention } = await withSession(
    session.hash,
    async (client) => {
      const g = await client.query("SELECT name FROM public.garages");
      const rows = await client.query<Vehicle>(
        "SELECT * FROM public.vehicles ORDER BY checked_at DESC LIMIT 8",
      );
      const counts = await client.query<{
        total: number;
        complete: number;
        attention: number;
      }>(
        "SELECT count(*)::int AS total,count(*) FILTER(WHERE latest_status='identified')::int AS complete,count(*) FILTER(WHERE latest_status<>'identified')::int AS attention FROM public.vehicles",
      );
      return {
        garage: g.rows[0]?.name ?? "Atelier inaccessible",
        vehicles: rows.rows,
        ...counts.rows[0],
      };
    },
  );
  return (
    <Shell session={session} garage={garage}>
      <div className="page-heading">
        <div>
          <div className="eyebrow dark">VOTRE TABLEAU DE BORD</div>
          <h1>
            Prêt pour le prochain véhicule<span className="orange"> ?</span>
          </h1>
          <p>Une identification précise. Un atelier qui avance.</p>
        </div>
        <span className="outline-tag">
          <ShieldCheck size={16} /> Espace garage privé
        </span>
      </div>
      <section className="metrics" aria-label="Votre activité de test">
        <div className="metric">
          <span className="metric-icon blue">
            <CarFront size={22} />
          </span>
          <div>
            <span>Dossiers de test</span>
            <strong>
              {total}
              <small>dans votre atelier</small>
            </strong>
          </div>
        </div>
        <div className="metric">
          <span className="metric-icon green">
            <CircleCheck size={22} />
          </span>
          <div>
            <span>Identités complètes</span>
            <strong>
              {complete}
              <small>données synthétiques</small>
            </strong>
          </div>
        </div>
        <div className="metric">
          <span className="metric-icon amber">
            <FileSearch size={22} />
          </span>
          <div>
            <span>À vérifier ou compléter</span>
            <strong>
              {attention}
              <small>aucun choix automatique</small>
            </strong>
          </div>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="card identification-card">
          <div className="section-kicker">
            <span className="number-chip">01</span> COMMENCER UNE IDENTIFICATION
          </div>
          <h2>Quel véhicule entre à l’atelier ?</h2>
          <p className="muted">
            Retrouvez sa fiche avant de rechercher la moindre pièce.
          </p>
          <VehicleForm />
          <div className="source-footer">
            <ShieldCheck size={17} />
            <span>
              Source : <strong>simulateur pédagogique</strong>
            </span>
            <span className="source-label">MODE TEST</span>
          </div>
        </section>
        <aside className="card journey-card">
          <div className="card-title">
            <span className="metric-icon small blue">
              <Layers3 size={18} />
            </span>
            <h2>La suite du parcours</h2>
          </div>
          <ol className="journey">
            <li className="current">
              <span>1</span>
              <div>
                <strong>Identifier le véhicule</strong>
                <small>Vous êtes ici</small>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Décrire les besoins</strong>
                <small>Disponible sur la fiche</small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Comparer et chiffrer</strong>
                <small>À venir</small>
              </div>
            </li>
          </ol>
          <p className="journey-note">
            Un doute sur le moteur ?<br />
            <strong>On vérifie avant d’aller plus loin.</strong>
          </p>
        </aside>
      </div>
      <section className="card dossiers" id="dossiers">
        <div className="section-heading">
          <div>
            <h2>Vos derniers dossiers</h2>
            <p className="muted">
              L’identité est revérifiée à chaque ouverture.
            </p>
          </div>
          <span className="count-tag">
            {vehicles.length} affiché{vehicles.length > 1 ? "s" : ""}
          </span>
        </div>
        {!vehicles.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <CarFront size={30} />
            </span>
            <h3>Votre premier véhicule vous attend.</h3>
            <p>
              Lancez une identification ci-dessus.
              <br />
              Sa fiche apparaîtra ici, dans votre espace garage.
            </p>
            <a href="#plate" className="text-link">
              Commencer une identification <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <div className="vehicle-list">
            {vehicles.map((vehicle) => (
              <Link
                className="vehicle-row"
                key={vehicle.id}
                href={`/vehicules/${vehicle.id}`}
              >
                <span className="vehicle-symbol">
                  <CarFront size={22} />
                </span>
                <div className="vehicle-info">
                  <strong>{vehicle.plate}</strong>
                  <small>
                    {vehicle.synthetic
                      ? "Données fictives"
                      : "Source réelle non connectée"}
                  </small>
                </div>
                <span
                  className={`state-tag ${vehicle.latest_status === "identified" ? "success" : "warning"}`}
                >
                  {states[vehicle.latest_status]}
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="test-guide" id="mode-test">
        <div className="guide-heading">
          <span className="guide-icon">
            <Search size={19} />
          </span>
          <div>
            <h2>Explorez les cas de démonstration</h2>
            <p>Aucune plaque réelle, aucune donnée fournisseur.</p>
          </div>
        </div>
        <div className="demo-cases">
          <div>
            <code>DEMO-001</code>
            <span>Identité complète</span>
          </div>
          <div>
            <code>DEMO-002</code>
            <span>Code moteur manquant</span>
          </div>
          <div>
            <code>DEMO-003</code>
            <span>Variante ambiguë</span>
          </div>
          <div>
            <code>DEMO-404</code>
            <span>Sans résultat</span>
          </div>
          <div>
            <code>DEMO-503</code>
            <span>Source en panne</span>
          </div>
        </div>
        <p className="guide-foot">
          <AlertTriangle size={14} /> Ces cas servent à tester le parcours,
          jamais à commander des pièces.
        </p>
      </section>
    </Shell>
  );
}
