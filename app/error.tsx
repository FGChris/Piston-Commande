"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>L’atelier est momentanément indisponible.</h1>
      <p>Vos données n’ont pas été remplacées. Réessayez dans un instant.</p>
      <button className="button primary" onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
