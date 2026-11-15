export type Identity = {
  vin: string | null;
  make: string | null;
  model: string | null;
  engine: string | null;
  fuel: string | null;
  gearbox: string | null;
  firstRegistration: string | null;
};
export type Identification = {
  status:
    | "identified"
    | "incomplete"
    | "ambiguous"
    | "not_found"
    | "unavailable";
  identity: Identity | null;
  source: string;
  synthetic: boolean;
  checkedAt: string;
  message: string;
};
export interface VehicleProvider {
  identify(plate: string): Promise<Identification>;
}
export function normalizePlate(input: string): string {
  const compact = input.toUpperCase().replace(/[\s-]/g, "");
  if (/^DEMO\d{3}$/.test(compact)) return `DEMO-${compact.slice(4)}`;
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(compact))
    return `${compact.slice(0, 2)}-${compact.slice(2, 5)}-${compact.slice(5)}`;
  throw new Error(
    "Saisissez une plaque au format AB-123-CD ou un identifiant DEMO.",
  );
}
export function normalizeEngineCode(value: string) {
  return value
    .toUpperCase()
    .split("_")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort()
    .join("_");
}
export function identityGaps(identity: Identity | null): string[] {
  const fields: [keyof Identity, string][] = [
    ["vin", "VIN"],
    ["make", "Marque"],
    ["model", "Modèle"],
    ["engine", "Code moteur"],
    ["fuel", "Carburant"],
    ["gearbox", "Boîte"],
    ["firstRegistration", "Première immatriculation"],
  ];
  return fields
    .filter(([key]) => !identity?.[key]?.trim())
    .map(([, label]) => label);
}
const syntheticIdentity: Identity = {
  vin: "TEST0000000000001",
  make: "Marque de test",
  model: "Véhicule école",
  engine: "MOTEUR_TEST_001",
  fuel: "Carburant de test",
  gearbox: "Boîte de test",
  firstRegistration: "2020-01-01",
};
export const simulatedProvider: VehicleProvider = {
  async identify(plate) {
    const base = {
      source: "Simulateur pédagogique",
      synthetic: true,
      checkedAt: new Date().toISOString(),
    };
    if (plate === "DEMO-001")
      return {
        ...base,
        status: "identified",
        identity: { ...syntheticIdentity },
        message:
          "Identité de test complète. Aucune compatibilité réelle n’est établie.",
      };
    if (plate === "DEMO-002")
      return {
        ...base,
        status: "incomplete",
        identity: {
          ...syntheticIdentity,
          vin: "TEST0000000000002",
          engine: null,
        },
        message: "Le code moteur manque. La sélection de pièces est bloquée.",
      };
    if (plate === "DEMO-003")
      return {
        ...base,
        status: "ambiguous",
        identity: { ...syntheticIdentity, vin: null, engine: null },
        message:
          "Plusieurs variantes de test sont possibles. Une vérification humaine est nécessaire.",
      };
    if (plate === "DEMO-404")
      return {
        ...base,
        status: "not_found",
        identity: null,
        message:
          "Aucune fiche dans ce jeu de test. Cela ne signifie pas que le véhicule réel est absent des catalogues.",
      };
    return {
      ...base,
      synthetic: plate.startsWith("DEMO-"),
      status: "unavailable",
      identity: null,
      message:
        plate === "DEMO-503"
          ? "Panne simulée du portail. Réessayez pour contrôler cet état."
          : "Aucun portail réel n’est connecté. Cette plaque ne peut pas être identifiée ici.",
    };
  },
};
