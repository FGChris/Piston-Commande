import Link from "next/link";
import {
  CircleHelp,
  LayoutDashboard,
  CarFront,
  ClipboardList,
  Package,
  Settings2,
  LogOut,
  ArrowUpRight,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { logout } from "./actions";
import type { Session } from "@/lib/auth";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="DEPANOS, accueil">
      <span className="brand-mark">
        <Wrench size={23} strokeWidth={2.4} />
      </span>
      <span>
        DEPANOS<span className="brand-dot">.</span>
        <small>AUTOMOTIVE WORKSPACE</small>
      </span>
    </Link>
  );
}
export function Shell({
  session,
  garage,
  children,
}: {
  session: Session;
  garage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">VOTRE ESPACE</div>
        <nav aria-label="Navigation principale">
          <Link href="/" className="nav-item active">
            <LayoutDashboard size={19} /> Vue d’ensemble
          </Link>
          <Link href="/#dossiers" className="nav-item">
            <CarFront size={19} /> Véhicules
          </Link>
          <span className="nav-item unavailable" aria-disabled="true">
            <ClipboardList size={19} /> Devis <small>À venir</small>
          </span>
          <span className="nav-item unavailable" aria-disabled="true">
            <Package size={19} /> Stock <small>À venir</small>
          </span>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-label">UN BON DÉPART</span>
            <h3>La bonne pièce commence par le bon véhicule.</h3>
            <p>Chaque identification mérite une vérification.</p>
            <ShieldCheck size={25} />
          </div>
          <Link className="nav-item" href="/reglages">
            <Settings2 size={18} /> Réglages
          </Link>
          <Link className="nav-item" href="/#mode-test">
            <CircleHelp size={18} /> Guide de démonstration{" "}
            <ArrowUpRight size={15} />
          </Link>
          <div className="sidebar-footer">
            <span className="status-dot" /> Lots 1–2 · Environnement de test
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="breadcrumb">
            Espace atelier <span>/</span> <strong>Vue d’ensemble</strong>
          </div>
          <div className="account">
            <span className="avatar">{session.display_name.slice(0, 1)}</span>
            <div>
              <strong>{garage}</strong>
              <small>
                {session.role === "boss"
                  ? "Responsable"
                  : session.role === "seller"
                    ? "Vendeur"
                    : "Mécanicien"}{" "}
                · Test
              </small>
            </div>
            <Link
              className="icon-button"
              href="/reglages"
              aria-label="Réglages"
            >
              <Settings2 size={19} />
            </Link>
            <form action={logout}>
              <button
                className="icon-button"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut size={19} />
              </button>
            </form>
          </div>
        </header>
        <div className="environment-strip">
          <span className="status-dot" />
          <strong>Démonstration</strong>
          <span>Données fictives · Aucun portail fournisseur connecté</span>
        </div>
        <main id="contenu">{children}</main>
        <footer className="page-footer">
          <span>
            DEPANOS · <Link href="/legal/mentions">Mentions légales</Link> ·{" "}
            <Link href="/legal/confidentialite">Confidentialité</Link> ·{" "}
            <Link href="/legal/cookies">Cookies</Link> ·{" "}
            <Link href="/legal/utilisation">Conditions</Link>
          </span>
          <span>
            Vos données restent dans votre espace garage{" "}
            <ShieldCheck size={14} />
          </span>
        </footer>
      </div>
    </div>
  );
}
