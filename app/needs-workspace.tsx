"use client";
import { useActionState, useState } from "react";
import {
  Plus,
  Check,
  ClipboardList,
  Pencil,
  Trash2,
  AlertTriangle,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import {
  familyLabels,
  axleLabels,
  sideLabels,
  positionLabel,
  needsClarification,
  type NeedRow,
} from "@/lib/needs";
import { saveVehicleNeed, removeVehicleNeed } from "./need-actions";

function NeedForm({
  vehicleId,
  creationId,
  need,
  onSaved,
  onCancel,
}: {
  vehicleId: string;
  creationId: string;
  need?: NeedRow;
  onSaved?: (message: string) => void;
  onCancel?: () => void;
}) {
  const empty = {
    family: "",
    label: "",
    quantity: "",
    axle: "",
    side: "",
    notes: "",
  };
  const [fields, setFields] = useState(
    need
      ? {
          family: need.family,
          label: need.label,
          quantity: String(need.quantity),
          axle: need.axle,
          side: need.side,
          notes: need.notes,
        }
      : empty,
  );
  const [state, action, pending] = useActionState(
    async (previous: { error: string; success: string }, form: FormData) => {
      const result = await saveVehicleNeed(previous, form);
      if (result.success) {
        if (!need) setFields(empty);
        onSaved?.(result.success);
      }
      return result;
    },
    { error: "", success: "" },
  );
  const key = need?.id ?? "new";
  const control = (name: keyof typeof fields) => ({
    id: `${key}-${name}`,
    name,
    value: fields[name],
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setFields((old) => ({ ...old, [name]: event.target.value })),
  });
  return (
    <form
      action={action}
      className="need-form"
      aria-label={need ? "Modifier le besoin" : "Ajouter un besoin"}
    >
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="id" value={need?.id ?? creationId} />
      <input type="hidden" name="version" value={need?.version ?? ""} />
      <div className="need-form-grid">
        <div className="need-control">
          <label htmlFor={`${key}-family`}>Famille de pièces</label>
          <select {...control("family")} required>
            <option value="">Choisir une famille</option>
            {Object.entries(familyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="need-control">
          <label htmlFor={`${key}-label`}>Pièce ou besoin</label>
          <input
            {...control("label")}
            required
            maxLength={120}
            placeholder="Ex. : plaquettes de frein"
          />
        </div>
        <div className="need-control">
          <label htmlFor={`${key}-quantity`}>Quantité</label>
          <input
            {...control("quantity")}
            type="number"
            min={1}
            max={9999}
            step={1}
            inputMode="numeric"
            required
            placeholder="À renseigner"
          />
        </div>
        <div className="need-control">
          <label htmlFor={`${key}-axle`}>Essieu</label>
          <select {...control("axle")} required>
            <option value="">Choisir l’essieu</option>
            {Object.entries(axleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="need-control">
          <label htmlFor={`${key}-side`}>Côté</label>
          <select {...control("side")} required>
            <option value="">Choisir le côté</option>
            {Object.entries(sideLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="need-control note-control">
          <label htmlFor={`${key}-notes`}>
            Observations <span>facultatif</span>
          </label>
          <textarea
            {...control("notes")}
            rows={3}
            maxLength={1000}
            placeholder="Précisez ce que vous avez constaté, sans déduire une référence."
          />
        </div>
      </div>
      <p className="need-hint">
        Un doute ? Choisissez « à préciser ». Un besoin décrit n’est pas une
        preuve de compatibilité.
      </p>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="need-form-actions">
        {onCancel && (
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Annuler
          </button>
        )}
        <button className="button primary" disabled={pending}>
          {pending ? (
            <LoaderCircle size={18} className="spin" />
          ) : need ? (
            <Check size={18} />
          ) : (
            <Plus size={18} />
          )}{" "}
          {pending
            ? "Enregistrement…"
            : need
              ? "Enregistrer les modifications"
              : "Ajouter ce besoin"}
        </button>
      </div>
    </form>
  );
}
function RemoveForm({
  vehicleId,
  need,
  onCancel,
  onSaved,
}: {
  vehicleId: string;
  need: NeedRow;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(
    async (previous: { error: string; success: string }, form: FormData) => {
      const result = await removeVehicleNeed(previous, form);
      if (result.success) onSaved(result.success);
      return result;
    },
    { error: "", success: "" },
  );
  return (
    <form action={action} className="remove-confirm">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="id" value={need.id} />
      <input type="hidden" name="version" value={need.version} />
      <p>
        <strong>Retirer ce besoin ?</strong> Il restera dans l’historique du
        dossier.
      </p>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <div className="need-form-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Annuler
        </button>
        <button className="button danger" disabled={pending}>
          {pending ? "Retrait…" : "Confirmer le retrait"}
        </button>
      </div>
    </form>
  );
}
export function NeedsWorkspace({
  vehicleId,
  creationId,
  needs,
  canEdit,
  eventCount,
}: {
  vehicleId: string;
  creationId: string;
  needs: NeedRow[];
  canEdit: boolean;
  eventCount: number;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const attention = needs.filter(needsClarification).length;
  const saved = (text: string) => {
    setMessage(text);
    setEditing(null);
    setRemoving(null);
  };
  return (
    <section id="besoins" className="needs-workspace">
      <div className="needs-heading">
        <div>
          <div className="eyebrow dark">ÉTAPE 02 · TOUR DU VÉHICULE</div>
          <h2>De quoi ce véhicule a-t-il besoin ?</h2>
          <p>
            Décrivez les pièces à remplacer. Les références et le chiffrage
            viendront ensuite.
          </p>
        </div>
        <span className="count-tag">
          {needs.length} besoin{needs.length > 1 ? "s" : ""}
        </span>
      </div>
      {message && (
        <p className="need-success" role="status">
          <Check size={17} />
          {message}
        </p>
      )}
      {!canEdit && (
        <div className="identity-banner blocked">
          <LockKeyhole size={22} />
          <p>
            L’identité est incomplète ou incertaine. Les besoins existants
            restent visibles ; leur ajout et leur modification sont bloqués.
          </p>
        </div>
      )}
      <div className="needs-columns">
        <section className="card add-need-card">
          <div className="section-heading">
            <h3>
              <Plus size={18} /> Ajouter un besoin
            </h3>
          </div>
          {canEdit ? (
            <NeedForm
              vehicleId={vehicleId}
              creationId={creationId}
              onSaved={saved}
            />
          ) : (
            <div className="needs-blocked">
              <LockKeyhole size={25} />
              <p>
                Complétez et revérifiez l’identité du véhicule avant de
                continuer.
              </p>
            </div>
          )}
        </section>
        <section className="card needs-list-card">
          <div className="section-heading">
            <h3>
              <ClipboardList size={18} /> Besoins du dossier
            </h3>
            {attention > 0 && (
              <span className="state-tag warning">{attention} à préciser</span>
            )}
          </div>
          {!needs.length ? (
            <div className="empty-state">
              <span className="empty-icon">
                <ClipboardList size={27} />
              </span>
              <h3>Le tour du véhicule commence ici.</h3>
              <p>Aucun besoin enregistré pour cette fiche.</p>
            </div>
          ) : (
            <div className="need-list">
              {needs.map((need) => (
                <article
                  className="need-item"
                  key={need.id}
                  aria-label={need.label}
                >
                  <div className="need-item-top">
                    <span className="need-family">
                      {familyLabels[need.family]}
                    </span>
                    <span className="quantity-badge">Qté {need.quantity}</span>
                  </div>
                  <h4>{need.label}</h4>
                  <p className="need-position">
                    {positionLabel(need.axle, need.side)}
                  </p>
                  {needsClarification(need) && (
                    <span className="need-uncertainty">
                      <AlertTriangle size={14} /> Position à préciser avant
                      toute sélection
                    </span>
                  )}
                  {need.notes && <p className="need-note">{need.notes}</p>}
                  <div className="need-row-actions">
                    <button
                      type="button"
                      className="text-button"
                      disabled={!canEdit}
                      onClick={() => {
                        setEditing(editing === need.id ? null : need.id);
                        setRemoving(null);
                        setMessage("");
                      }}
                    >
                      <Pencil size={15} /> Modifier
                    </button>
                    <button
                      type="button"
                      className="text-button remove-button"
                      onClick={() => {
                        setRemoving(removing === need.id ? null : need.id);
                        setEditing(null);
                        setMessage("");
                      }}
                    >
                      <Trash2 size={15} /> Retirer
                    </button>
                  </div>
                  {editing === need.id && canEdit && (
                    <NeedForm
                      key={`${need.id}-${need.version}`}
                      vehicleId={vehicleId}
                      creationId={creationId}
                      need={need}
                      onSaved={saved}
                      onCancel={() => setEditing(null)}
                    />
                  )}{" "}
                  {removing === need.id && (
                    <RemoveForm
                      vehicleId={vehicleId}
                      need={need}
                      onSaved={saved}
                      onCancel={() => setRemoving(null)}
                    />
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="needs-audit-note">
            {eventCount} événement{eventCount > 1 ? "s" : ""} conservé
            {eventCount > 1 ? "s" : ""} dans l’historique · Aucun devis ni
            commande
          </div>
        </section>
      </div>
    </section>
  );
}
