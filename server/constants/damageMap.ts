import type { DamageCode } from "@shared/types/appraisal";

export interface DamagePoint {
  code: DamageCode;
  label: string;
  x: number;
  y: number;
}

export interface MultiViewDamagePoint {
  code: DamageCode;
  label: string;
  views: {
    top?: { x: number; y: number };
    front?: { x: number; y: number };
    side?: { x: number; y: number };
    rear?: { x: number; y: number };
  };
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

export const MULTI_VIEW_DAMAGE_POINTS: MultiViewDamagePoint[] = [
  { 
    code: "front_bumper", 
    label: "Front Bumper",
    views: { 
      top: { x: 0.5, y: 0.08 },
      front: { x: 0.5, y: 0.85 }
    }
  },
  { 
    code: "hood", 
    label: "Hood",
    views: { 
      top: { x: 0.5, y: 0.20 },
      front: { x: 0.5, y: 0.35 },
      side: { x: 0.25, y: 0.35 }
    }
  },
  { 
    code: "windshield", 
    label: "Windshield",
    views: { 
      top: { x: 0.5, y: 0.28 },
      front: { x: 0.5, y: 0.30 },
      side: { x: 0.38, y: 0.30 }
    }
  },
  { 
    code: "roof", 
    label: "Roof",
    views: { 
      top: { x: 0.5, y: 0.50 },
      side: { x: 0.50, y: 0.30 }
    }
  },
  { 
    code: "rear_glass", 
    label: "Rear Glass",
    views: { 
      top: { x: 0.5, y: 0.72 },
      rear: { x: 0.5, y: 0.30 },
      side: { x: 0.65, y: 0.30 }
    }
  },
  { 
    code: "trunk", 
    label: "Trunk/Liftgate",
    views: { 
      top: { x: 0.5, y: 0.82 },
      rear: { x: 0.5, y: 0.50 },
      side: { x: 0.78, y: 0.45 }
    }
  },
  { 
    code: "rear_bumper", 
    label: "Rear Bumper",
    views: { 
      top: { x: 0.5, y: 0.92 },
      rear: { x: 0.5, y: 0.85 }
    }
  },
  { 
    code: "left_front_fender", 
    label: "Left Front Fender",
    views: { 
      top: { x: 0.18, y: 0.22 },
      side: { x: 0.20, y: 0.55 }
    }
  },
  { 
    code: "right_front_fender", 
    label: "Right Front Fender",
    views: { 
      top: { x: 0.82, y: 0.22 }
    }
  },
  { 
    code: "left_door", 
    label: "Left Door(s)",
    views: { 
      top: { x: 0.15, y: 0.50 },
      side: { x: 0.42, y: 0.55 }
    }
  },
  { 
    code: "right_door", 
    label: "Right Door(s)",
    views: { 
      top: { x: 0.85, y: 0.50 }
    }
  },
  { 
    code: "left_rear_quarter", 
    label: "Left Rear Quarter",
    views: { 
      top: { x: 0.18, y: 0.78 },
      side: { x: 0.70, y: 0.55 }
    }
  },
  { 
    code: "right_rear_quarter", 
    label: "Right Rear Quarter",
    views: { 
      top: { x: 0.82, y: 0.78 }
    }
  },
];

export function getMultiViewDamagePoints(codes: DamageCode[]): MultiViewDamagePoint[] {
  return MULTI_VIEW_DAMAGE_POINTS.filter(p => codes.includes(p.code));
}

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
