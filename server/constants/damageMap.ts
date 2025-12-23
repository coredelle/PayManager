import type { DamageCode } from "@shared/types/appraisal";

export interface DamagePoint {
  code: DamageCode;
  label: string;
  x: number;
  y: number;
}

export const DAMAGE_POINTS: DamagePoint[] = [
  { code: "front_bumper", label: "Front Bumper", x: 0.5, y: 0.08 },
  { code: "hood", label: "Hood", x: 0.5, y: 0.22 },
  { code: "windshield", label: "Windshield", x: 0.5, y: 0.35 },
  { code: "roof", label: "Roof", x: 0.5, y: 0.5 },
  { code: "rear_glass", label: "Rear Glass", x: 0.5, y: 0.65 },
  { code: "trunk", label: "Trunk/Liftgate", x: 0.5, y: 0.78 },
  { code: "rear_bumper", label: "Rear Bumper", x: 0.5, y: 0.92 },
  { code: "left_front_fender", label: "Left Front Fender", x: 0.15, y: 0.2 },
  { code: "right_front_fender", label: "Right Front Fender", x: 0.85, y: 0.2 },
  { code: "left_door", label: "Left Door(s)", x: 0.12, y: 0.5 },
  { code: "right_door", label: "Right Door(s)", x: 0.88, y: 0.5 },
  { code: "left_rear_quarter", label: "Left Rear Quarter", x: 0.15, y: 0.8 },
  { code: "right_rear_quarter", label: "Right Rear Quarter", x: 0.85, y: 0.8 },
];

export const DAMAGE_CODE_LABELS: Record<DamageCode, string> = {
  front_bumper: "Front Bumper",
  rear_bumper: "Rear Bumper",
  left_front_fender: "Left Front Fender",
  right_front_fender: "Right Front Fender",
  left_rear_quarter: "Left Rear Quarter Panel",
  right_rear_quarter: "Right Rear Quarter Panel",
  hood: "Hood",
  trunk: "Trunk/Liftgate",
  roof: "Roof",
  left_door: "Left Door(s)",
  right_door: "Right Door(s)",
  windshield: "Windshield",
  rear_glass: "Rear Glass",
};

export function getDamagePointsForCodes(codes: DamageCode[]): DamagePoint[] {
  return DAMAGE_POINTS.filter(p => codes.includes(p.code));
}

export function formatDamageAreas(codes: DamageCode[]): string {
  return codes.map(code => DAMAGE_CODE_LABELS[code] || code).join(", ");
}
