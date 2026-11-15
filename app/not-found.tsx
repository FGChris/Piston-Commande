import Link from "next/link";
import { requireSession } from "@/lib/auth";
export default async function NotFound() {
  await requireSession();
  return (
    <main className="standalone">
      <h1>Fiche inaccessible</h1>
      <p>Cette fiche n’existe pas ou n’appartient pas à votre atelier.</p>
      <Link className="button primary" href="/">
        Retour à l’atelier
      </Link>
    </main>
  );
}
