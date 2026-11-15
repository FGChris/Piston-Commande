import Link from "next/link";
import { redirect } from "next/navigation";
import { CarFront, Check, ShieldCheck, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Brand } from "../components";
import { LoginForm } from "../forms";
export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");
  const params = await searchParams;
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div className="story-body">
          <span className="eyebrow">PENSÉ POUR L’ATELIER</span>
          <h1>
            Moins de recherches.
            <br />
            Plus de <em>certitude.</em>
          </h1>
          <p>
            Votre point de départ pour identifier le bon véhicule et préparer le
            travail de l’atelier.
          </p>
          <div className="story-card">
            <span className="story-icon">
              <CarFront size={32} />
            </span>
            <div>
              <span className="tiny-label">UN PARCOURS, PAS À PAS</span>
              <h2>Du véhicule à la bonne pièce.</h2>
            </div>
            <ol>
              <li>
                <span>01</span> Identifier le véhicule <Check size={16} />
              </li>
              <li>
                <span>02</span> Préciser les besoins{" "}
                <small>Lot 2 disponible</small>
              </li>
              <li>
                <span>03</span> Préparer le devis <small>Prochainement</small>
              </li>
            </ol>
          </div>
        </div>
        <p className="story-bottom">
          <ShieldCheck size={18} /> Un espace séparé pour chaque garage.
        </p>
      </section>
      <section className="login-panel">
        <div className="login-box">
          <span className="pill">
            <span className="status-dot" /> ATELIER · DÉMONSTRATION
          </span>
          <h2>Bienvenue à l’atelier.</h2>
          <p className="muted">Connectez-vous à votre espace de travail.</p>
          {params.password === "updated" && (
            <p className="need-success" role="status">
              Mot de passe modifié. Reconnectez-vous.
            </p>
          )}
          <LoginForm />
          <nav className="legal-nav" aria-label="Informations légales">
            <Link href="/legal/mentions">Mentions légales</Link>
            <Link href="/legal/confidentialite">Confidentialité</Link>
            <Link href="/legal/cookies">Cookies</Link>
            <Link href="/legal/utilisation">Conditions d’utilisation</Link>
          </nav>
          <div className="login-disclaimer">
            <ShieldCheck size={21} />
            <p>
              <strong>Un terrain d’essai, en toute clarté.</strong>
              <br />
              Les véhicules de démonstration sont fictifs. Aucun fournisseur
              réel n’est interrogé.
            </p>
          </div>
          <div className="login-bottom">
            Identification véhicule <ArrowRight size={15} /> Première étape
          </div>
        </div>
      </section>
    </main>
  );
}
