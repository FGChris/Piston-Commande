"use client";
import { useActionState, useRef } from "react";
import { saveSupplier, deleteSupplier, changePassword } from "./actions";
import { providers, type Provider } from "@/lib/providers";
const initial = { error: "", success: "" };
export function SupplierForm({
  provider,
  configured,
}: {
  provider: Provider;
  configured: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (previous: typeof initial, form: FormData) => {
      const result = await saveSupplier(previous, form);
      if (result.success) ref.current?.reset();
      return result;
    },
    initial,
  );
  const [deleted, remove, removing] = useActionState(deleteSupplier, initial);
  return (
    <section className="card settings-card">
      <h2>{providers[provider]}</h2>
      <p className="state-tag">
        {configured ? "Accès enregistré · Non testé" : "Aucun accès enregistré"}
      </p>
      <p className="muted">
        Les valeurs enregistrées ne sont jamais réaffichées. Pour les remplacer,
        saisissez à nouveau les deux identifiants.
      </p>
      <form
        ref={ref}
        action={action}
        className="settings-form"
        autoComplete="off"
      >
        <input type="hidden" name="provider" value={provider} />
        <label htmlFor={`${provider}-portal`}>Adresse du portail HTTPS</label>
        <input
          id={`${provider}-portal`}
          name="portal"
          type="url"
          required
          maxLength={2048}
          placeholder="https://portail.fournisseur.fr"
        />
        <label htmlFor={`${provider}-username`}>Identifiant du compte</label>
        <input
          id={`${provider}-username`}
          name="username"
          type="password"
          required
          maxLength={254}
          autoComplete="off"
        />
        <label htmlFor={`${provider}-password`}>
          Mot de passe ou clé d’accès
        </label>
        <input
          id={`${provider}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={4096}
        />
        <label className="check-row">
          <input type="checkbox" name="authorized" required /> Je suis autorisé
          à utiliser ce compte pour mon garage.
        </label>
        {state.error && (
          <p role="alert" className="form-error">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="need-success">
            {state.success}
          </p>
        )}
        <button className="button primary" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : configured
              ? "Remplacer les accès"
              : "Enregistrer les accès"}
        </button>
      </form>
      {configured && (
        <form action={remove} className="settings-form">
          <input type="hidden" name="provider" value={provider} />
          <label className="check-row">
            <input type="checkbox" name="confirm" required /> Je confirme le
            retrait des accès {providers[provider]}.
          </label>
          <button className="button secondary" disabled={removing}>
            Supprimer les accès
          </button>
          {deleted.error && <p role="alert">{deleted.error}</p>}
        </form>
      )}
    </section>
  );
}
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <section className="card settings-card">
      <h2>Sécurité de mon compte</h2>
      <p className="muted">
        Le changement de mot de passe déconnecte toutes vos sessions.
      </p>
      <form action={action} className="settings-form">
        <label htmlFor="current">Mot de passe actuel</label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
        <label htmlFor="next">Nouveau mot de passe</label>
        <input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={15}
          maxLength={72}
          required
        />
        <label htmlFor="confirmation">Confirmer le nouveau mot de passe</label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={15}
          maxLength={72}
          required
        />
        {state.error && (
          <p role="alert" className="form-error">
            {state.error}
          </p>
        )}
        <button className="button primary" disabled={pending}>
          Changer mon mot de passe
        </button>
      </form>
    </section>
  );
}
