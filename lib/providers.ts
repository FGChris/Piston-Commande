export const providers = {
  dasir: "DASIR",
  pavi: "PAVI",
  partslink24: "Partslink24",
  yacco: "YACCO",
  henrri: "Henrri",
} as const;
export type Provider = keyof typeof providers;
