import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { withSession } from "@/lib/db";
import { providers, type Provider } from "@/lib/providers";
import { Shell } from "@/app/components";
import { SupplierForm, PasswordForm } from "./forms";
export const dynamic = "force-dynamic";
export default async function Settings() {
  const session = await requireSession();
  const data = await withSession(session.hash, async (c) => {
    const garage = (await c.query("SELECT name FROM public.garages")).rows[0]
      .name;
    const configured =
      session.role === "boss"
        ? (
            await c.query<{ provider: Provider }>(
              "SELECT provider FROM public.supplier_credentials",
            )
          ).rows
        : [];
    return { garage, configured };
  });
  return (
    <Shell session={session} garage={data.garage}>
      <div className="page-heading">
        <div>
          <div className="eyebrow dark">VOTRE ESPACE PRIVÉ</div>
          <h1>Réglages et accès</h1>
          <p>Les accès fournisseurs sont réservés au responsable du garage.</p>
        </div>
      </div>
      <PasswordForm />
      {session.role === "boss" ? (
        <>
          <section className="identity-banner blocked">
            <div>
              <h2>Préparer les comptes fournisseurs</h2>
              <p>
                Ce coffre conserve vos accès chiffrés. Aucun connecteur n’est
                encore actif : enregistrer un compte ne lance ni connexion, ni
                recherche, ni commande. Saisissez des accès réels uniquement sur
                une installation de confiance en HTTPS.
              </p>
            </div>
          </section>
          <div className="settings-grid">
            {(Object.keys(providers) as Provider[]).map((p) => (
              <SupplierForm
                key={p}
                provider={p}
                configured={data.configured.some((x) => x.provider === p)}
              />
            ))}
          </div>
          <section className="card settings-card">
            <h2>Second cerveau · Obsidian</h2>
            <p>
              Votre coffre existant sera conservé. Le kit DEPANOS est prêt à
              être importé dans un sous-dossier dédié, avec modèles de
              références, preuves, décisions et règles de validation.
            </p>
            <p>
              <strong>Statut : en attente du chemin de votre coffre.</strong>{" "}
              Aucune synchronisation ni copie de données métier n’est active.
            </p>
            <p>
              Les accès fournisseurs, mots de passe, plaques et VIN ne doivent
              pas être copiés dans les notes. Une note ne remplace jamais la
              vérification auprès du portail.
            </p>
          </section>
          <section className="card settings-card">
            <h2>Informations légales à compléter en V2</h2>
            <p>
              Identité de l’éditeur, contacts, hébergeur, conservation et
              prestataires restent à renseigner avant une utilisation publique
              avec des clients.
            </p>
            <Link className="text-link" href="/legal/mentions">
              Consulter les brouillons des pages légales
            </Link>
          </section>
        </>
      ) : (
        <p className="identity-banner">
          Votre rôle permet la gestion de votre mot de passe. Les comptes
          fournisseurs sont réservés au responsable.
        </p>
      )}
    </Shell>
  );
}
