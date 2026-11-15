import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { legalPages } from "@/lib/legal";
export const dynamic = "force-dynamic";
export default async function Legal({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  await getSession();
  const { page } = await params;
  if (!Object.hasOwn(legalPages, page)) notFound();
  const entry = legalPages[page as keyof typeof legalPages];
  return (
    <main className="legal-page">
      <Link className="back-link" href="/connexion">
        ← Connexion DEPANOS
      </Link>
      <nav className="legal-nav" aria-label="Informations légales">
        {Object.entries(legalPages).map(([key, value]) => (
          <Link key={key} href={`/legal/${key}`}>
            {value.title}
          </Link>
        ))}
      </nav>
      <div className="eyebrow dark">VERSION DE TRAVAIL · 14 NOVEMBRE 2026</div>
      <h1>{entry.title}</h1>
      <div className="identity-banner blocked">
        <p>
          <strong>Brouillon — informations à compléter en V2.</strong>{" "}
          L’identité de l’entreprise, l’hébergement et les politiques
          opérationnelles restent à renseigner. La conformité juridique et la
          jurisprudence applicables au déploiement n’ont pas été validées.
        </p>
      </div>
      {entry.sections.map(([title, text]) => (
        <section className="card settings-card" key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <section className="card settings-card">
        <h2>Références à vérifier avant publication</h2>
        <ul>
          <li>
            <a
              href="https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr"
              rel="noreferrer"
            >
              RGPD : notamment articles 5, 6, 12–22, 28, 32 et 44 et suivants
            </a>
          </li>
          <li>
            <a
              href="https://www.cnil.fr/fr/les-mentions-dinformation"
              rel="noreferrer"
            >
              CNIL : information des personnes
            </a>
          </li>
          <li>
            <a
              href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi"
              rel="noreferrer"
            >
              CNIL : cookies et article 82
            </a>
          </li>
          <li>
            <a
              href="https://entreprendre.service-public.fr/vosdroits/F31228"
              rel="noreferrer"
            >
              Service Public : obligations d’un site professionnel
            </a>
          </li>
        </ul>
        <p className="muted">
          Les consultations de ces sources ont été bloquées par le réseau lors
          de cette préparation. Aucun arrêt de jurisprudence récent n’a été
          vérifié. Ces liens sont des références à contrôler, pas une
          certification.
        </p>
      </section>
    </main>
  );
}
