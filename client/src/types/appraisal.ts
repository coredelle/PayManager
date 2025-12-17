export type PreAccidentValueBucket =
  | "<5000"
  | "5000-10000"
  | "10000-20000"
  | "20000-30000"
  | "30000-40000"
  | "40000-50000"
  | "50000-75000"
  | ">75000";

export type DamageLocation =
  | "front"
  | "rear"
  | "driver_side"
  | "passenger_side"
  | "multiple"
  | "not_sure";

export type RepairStatus =
  | "completed"
  | "authorized_not_completed"
  | "not_authorized";

export type ReferralSource =
  | "body_shop"
  | "friend_family"
  | "insurance_adjuster"
  | "someone_else"
  | "no_referral";

export interface AppraisalFormData {
  email: string;

  // Step 2 - vehicle
  year: number | "";
  make: string;
  model: string;
  trim?: string;
  mileage?: number | "";
  vin?: string;

  // Step 3 - accident
  accidentDate: string;
  accidentState: string;
  otherDriverAtFault: boolean;

  damageLocation: DamageLocation | "";
  repairStatus: RepairStatus | "";

  repairEstimateFileId?: string;
  repairEstimateUploaded: boolean;

  preAccidentValueBucket: PreAccidentValueBucket | "";

  referralSource: ReferralSource | "";
  referralName?: string;

  bodyShopName?: string;
  bodyShopLocation?: string;

  atFaultInsuranceCompany: string;
  claimNumber?: string;

  guaranteeEligible: boolean;
}

export const initialAppraisalFormData: AppraisalFormData = {
  email: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  mileage: "",
  vin: "",
  accidentDate: "",
  accidentState: "",
  otherDriverAtFault: true,
  damageLocation: "",
  repairStatus: "",
  repairEstimateUploaded: false,
  preAccidentValueBucket: "",
  referralSource: "",
  referralName: "",
  bodyShopName: "",
  bodyShopLocation: "",
  atFaultInsuranceCompany: "",
  claimNumber: "",
  guaranteeEligible: true,
};

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export const VALUE_BUCKET_OPTIONS = [
  { value: "<5000", label: "Less than $5,000" },
  { value: "5000-10000", label: "$5,000 to $10,000" },
  { value: "10000-20000", label: "$10,000 to $20,000" },
  { value: "20000-30000", label: "$20,000 to $30,000" },
  { value: "30000-40000", label: "$30,000 to $40,000" },
  { value: "40000-50000", label: "$40,000 to $50,000" },
  { value: "50000-75000", label: "$50,000 to $75,000" },
  { value: ">75000", label: "Greater than $75,000" },
];

export const DAMAGE_LOCATION_OPTIONS = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "driver_side", label: "Driver Side" },
  { value: "passenger_side", label: "Passenger Side" },
  { value: "multiple", label: "Multiple Areas" },
  { value: "not_sure", label: "Not Sure" },
];

export const REPAIR_STATUS_OPTIONS = [
  { value: "completed", label: "Repairs completed" },
  { value: "authorized_not_completed", label: "Authorized but not yet completed" },
  { value: "not_authorized", label: "Not yet authorized" },
];

export const REFERRAL_SOURCE_OPTIONS = [
  { value: "body_shop", label: "My body shop" },
  { value: "friend_family", label: "A friend or family member" },
  { value: "insurance_adjuster", label: "My insurance adjuster" },
  { value: "someone_else", label: "Someone else" },
  { value: "no_referral", label: "No referral" },
];
