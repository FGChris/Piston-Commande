import { z } from "zod";
export const familyLabels = {
  filtration: "Filtration et huile",
  braking: "Freinage",
  timing: "Distribution",
  suspension: "Suspension",
  steering: "Direction",
  transmission: "Transmission",
  ignition: "Allumage",
} as const;
export const axleLabels = {
  front: "Avant",
  rear: "Arrière",
  not_applicable: "Sans essieu",
  unknown: "Essieu à préciser",
} as const;
export const sideLabels = {
  left: "Gauche",
  right: "Droite",
  both: "Gauche et droite",
  not_applicable: "Sans côté",
  unknown: "Côté à préciser",
} as const;
export const needSchema = z.object({
  family: z.enum([
    "filtration",
    "braking",
    "timing",
    "suspension",
    "steering",
    "transmission",
    "ignition",
  ]),
  label: z.string().trim().min(1).max(120),
  quantity: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(9999)),
  axle: z.enum(["front", "rear", "not_applicable", "unknown"]),
  side: z.enum(["left", "right", "both", "not_applicable", "unknown"]),
  notes: z.string().trim().max(1000),
});
export type NeedInput = z.output<typeof needSchema>;
export type NeedRow = NeedInput & {
  id: string;
  vehicle_id: string;
  version: number;
  active: boolean;
};
export function needsClarification(need: { axle: string; side: string }) {
  return need.axle === "unknown" || need.side === "unknown";
}
export function positionLabel(
  axle: keyof typeof axleLabels,
  side: keyof typeof sideLabels,
) {
  return `${axleLabels[axle]} · ${sideLabels[side]}`;
}
