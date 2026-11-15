"use client";
import { useActionState } from "react";
import { ArrowRight, Search, LoaderCircle, LockKeyhole } from "lucide-react";
import { identifyVehicle, login } from "./actions";
export function VehicleForm() {
  const [state, action, pending] = useActionState(identifyVehicle, {
    error: "",
  });
  return (
    <form action={action} className="vehicle-form">
      <label htmlFor="plate">Immatriculation ou identifiant de test</label>
      <div className="search-row">
        <div className="plate-input">
          <span aria-hidden="true">F</span>
          <input
            id="plate"
            name="plate"
            placeholder="DEMO-001"
            maxLength={20}
            required
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={state.error ? "plate-error" : "plate-hint"}
            aria-invalid={!!state.error}
          />
        </div>
        <button className="button primary" disabled={pending}>
          {pending ? (
            <LoaderCircle className="spin" size={19} />
          ) : (
            <Search size={19} />
          )}{" "}
          {pending ? "Recherche…" : "Identifier le véhicule"}
          <ArrowRight size={18} />
        </button>
      </div>
      <p id="plate-hint" className="field-hint">
        Pour commencer, essayez <strong>DEMO-001</strong>. Une plaque réelle
        nécessite une source connectée.
      </p>
      {state.error && (
        <p id="plate-error" role="alert" className="form-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="login-form">
      <label htmlFor="email">Adresse e-mail</label>
      <input
        id="email"
        type="email"
        name="email"
        autoComplete="username"
        required
        maxLength={254}
      />
      <label htmlFor="password">Mot de passe</label>
      <input
        id="password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        maxLength={200}
      />
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <LockKeyhole size={18} />
        )}{" "}
        {pending ? "Connexion…" : "Ouvrir mon atelier"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
