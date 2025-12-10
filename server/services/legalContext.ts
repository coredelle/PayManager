export interface StateContext {
  state: string;
  stateName: string;
  dvStatutesSummary: string;
  keyCases: {
    name: string;
    holdingSummary: string;
  }[];
  negotiationAngles: string[];
  complianceNotes: string[];
}

const stateContexts: Record<string, StateContext> = {
  GA: {
    state: "GA",
    stateName: "Georgia",
    dvStatutesSummary:
      "Georgia recognizes inherent diminished value as a recoverable damage. The landmark case State Farm v. Mabry established that even after proper repairs, a vehicle's market value is reduced due to its accident history. Insurers cannot rely solely on rigid formulas like the 17(c) formula when actual market evidence contradicts it.",
    keyCases: [
      {
        name: "State Farm v. Mabry (Georgia Supreme Court)",
        holdingSummary:
          "Established that diminished value is owed even after quality repairs. A vehicle with an accident history is worth less in the market than an identical vehicle without such history.",
      },
      {
        name: "GEICO v. Bouldin",
        holdingSummary:
          "Reinforced that insurers must pay for inherent diminished value as part of property damage claims.",
      },
    ],
    negotiationAngles: [
      "Insurer cannot rely on a rigid 17(c) formula where it conflicts with actual market evidence.",
      "Georgia recognizes inherent diminished value separate from repair quality.",
      "Market data from dealer listings demonstrates the actual reduction in value.",
      "The Mabry decision requires insurers to pay DV regardless of repair quality.",
    ],
    complianceNotes: [
      "Statute of limitations: 4 years from date of loss for property damage claims.",
      "DV claim must be filed against the at-fault party's insurer.",
      "Georgia law favors claimants when supported by market evidence.",
    ],
  },
  FL: {
    state: "FL",
    stateName: "Florida",
    dvStatutesSummary:
      "Florida allows recovery of diminished value, though claims are typically pursued through the at-fault party's property damage liability coverage. Florida is a no-fault state for personal injury, but property damage claims follow traditional tort rules.",
    keyCases: [
      {
        name: "General diminished value case law",
        holdingSummary:
          "Florida courts have recognized that properly repaired vehicles still suffer inherent diminished value due to accident history disclosure requirements.",
      },
    ],
    negotiationAngles: [
      "Florida requires accident history disclosure when selling a vehicle.",
      "Market studies show buyers pay less for vehicles with accident history.",
      "Comparable vehicle analysis demonstrates actual market value reduction.",
      "Even perfect repairs cannot eliminate the stigma of an accident record.",
    ],
    complianceNotes: [
      "Statute of limitations: 4 years for property damage claims.",
      "Claim against at-fault party's liability coverage.",
      "Document all communications with the insurance adjuster.",
    ],
  },
  NC: {
    state: "NC",
    stateName: "North Carolina",
    dvStatutesSummary:
      "North Carolina recognizes diminished value as a compensable element of property damage. Claimants can recover the difference between the vehicle's pre-accident value and its post-repair value.",
    keyCases: [
      {
        name: "General DV precedent",
        holdingSummary:
          "North Carolina courts have consistently held that vehicle owners are entitled to compensation for the reduction in market value caused by accident history.",
      },
    ],
    negotiationAngles: [
      "North Carolina law supports recovery of inherent diminished value.",
      "Market evidence shows consistent price reduction for accident-history vehicles.",
      "Carfax and similar services create permanent record affecting resale value.",
      "Independent appraisal provides objective basis for claim amount.",
    ],
    complianceNotes: [
      "Statute of limitations: 3 years for property damage claims.",
      "Contributory negligence state - must be 100% not at fault.",
      "Thorough documentation of the accident and fault determination is critical.",
    ],
  },
};

export function getStateContext(stateCode: string): StateContext | null {
  return stateContexts[stateCode] || null;
}

export function getComplianceNotes(stateCode: string): string[] {
  const context = stateContexts[stateCode];
  return context?.complianceNotes || [];
}

export function getNegotiationAngles(stateCode: string): string[] {
  const context = stateContexts[stateCode];
  return context?.negotiationAngles || [];
}
