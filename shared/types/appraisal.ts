export type AccidentHistoryFlag = "clean" | "prior_damage" | "unknown";

export type DamageCode =
  | "front_bumper"
  | "rear_bumper"
  | "left_front_fender"
  | "right_front_fender"
  | "left_rear_quarter"
  | "right_rear_quarter"
  | "hood"
  | "trunk"
  | "roof"
  | "left_door"
  | "right_door"
  | "windshield"
  | "rear_glass";

export interface AppraisalInput {
  id: string;
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;

  year: number;
  make: string;
  model: string;
  trim: string;
  vin: string;
  licensePlate?: string;
  stateOfRegistration: string;
  mileage: number;
  accidentHistory: AccidentHistoryFlag;

  isLeased: boolean;

  insuranceCompany: string;
  claimNumber: string;
  adjusterName?: string;
  adjusterEmail?: string;
  adjusterPhone?: string;
  dateOfLoss: string;

  repairCenterName?: string;
  repairCenterPhone?: string;
  repairCenterAddress?: string;
  repairDropOffDate?: string;
  repairPickupDate?: string;
  totalRepairCost?: number;

  damageDescription?: string;
  keyImpactAreas?: DamageCode[];

  stateOfLoss: "GA";
}

export interface ThirdPartyValuations {
  cleanRetailPreAccident: number;
  roughRetailPostAccident: number;
  source: string;
  retrievedAt: Date;
}

export interface ComparableListing {
  sourceDealerName: string;
  sourceDealerPhone?: string;
  sourceDealerAddress?: string;
  sourceDealerCity?: string;
  sourceDealerState?: string;

  year: number;
  make: string;
  model: string;
  trim: string;
  vin: string;
  mileage: number;
  listedPrice: number;
  listingUrl?: string;

  accidentHistory: AccidentHistoryFlag;
  distanceMiles?: number;
}

export interface AppraisalComputationResult {
  appraisalId: string;

  thirdParty: ThirdPartyValuations;
  comparables: ComparableListing[];

  comparablesAvgRetail: number;
  finalPreAccidentValue: number;
  postAccidentValue: number;
  diminishedValue: number;

  mileageBandDescription: string;
  comparableFilterNotes: string;
  createdAt: Date;
}

export interface GeorgiaAppraisalCreate {
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;

  year: number;
  make: string;
  model: string;
  trim: string;
  vin: string;
  licensePlate?: string;
  stateOfRegistration: string;
  mileage: number;
  accidentHistory: AccidentHistoryFlag;

  isLeased: boolean;

  insuranceCompany: string;
  claimNumber: string;
  adjusterName?: string;
  adjusterEmail?: string;
  adjusterPhone?: string;
  dateOfLoss: string;

  repairCenterName?: string;
  repairCenterPhone?: string;
  repairCenterAddress?: string;
  repairDropOffDate?: string;
  repairPickupDate?: string;
  totalRepairCost?: number;

  damageDescription?: string;
  keyImpactAreas?: DamageCode[];
}
