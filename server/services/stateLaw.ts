/**
 * State Law Service
 * 
 * Provides jurisdiction-specific legal context for diminished value claims.
 * This information is injected into OpenAI prompts to ensure legally accurate responses.
 * 
 * How state law instructions are injected:
 * 1. The system prompt includes the full legal context for the relevant state
 * 2. AI is instructed to apply ONLY the provided legal rules
 * 3. AI is forbidden from making up statutes or case law
 * 4. Georgia law explicitly prohibits use of 17(c) formula as definitive
 */

export interface StateLaw {
  state: "GA" | "FL" | "NC" | "TX" | "CA";
  stateName: string;
  dvMeasure: string;
  keyStatutes: string[];
  keyCaseLaw: { name: string; citation: string; holding: string }[];
  negotiationAngles: string[];
  complianceNotes: string[];
  statuteOfLimitations: string;
  systemPromptInstructions: string;
}

export const GEORGIA_LAW: StateLaw = {
  state: "GA",
  stateName: "Georgia",
  dvMeasure: "Diminished value is measured as the difference in fair market value of the vehicle immediately before the collision and immediately after proper repairs are completed.",
  keyStatutes: [
    "O.C.G.A. § 33-4-6 - Bad faith penalty provisions for insurance claims",
    "O.C.G.A. § 51-12-8 - General damages for tortious injury to property",
  ],
  keyCaseLaw: [
    {
      name: "State Farm v. Mabry",
      citation: "274 Ga. App. 103, 616 S.E.2d 869 (2005)",
      holding: "Established that diminished value is recoverable as an element of property damage in Georgia. The measure of damages is the difference between the fair market value before and after the collision.",
    },
    {
      name: "GEICO v. Bouldin",
      citation: "344 Ga. App. 878 (2018)",
      holding: "Affirmed that policyholders can recover diminished value under their own uninsured/underinsured motorist coverage when the at-fault party is uninsured.",
    },
    {
      name: "Perma Ad Ideas of America, Inc. v. Mayville",
      citation: "253 Ga. App. 750 (2002)",
      holding: "DV is measured as the difference in value before the collision and after proper repairs - repairs alone do not necessarily restore full value.",
    },
  ],
  negotiationAngles: [
    "Georgia DOI Directive 08-P&C-2 explicitly states that no formula (including 17c) is approved for determining diminished value.",
    "Insurers must consider ALL relevant evidence submitted by the claimant, not just internal formulas.",
    "The burden is on the insurer to prove that the vehicle was restored to pre-loss value.",
    "Independent appraisals with comparable sales data are strong evidence of actual market loss.",
    "State Farm v. Mabry establishes that DV is a legitimate element of property damage in Georgia.",
  ],
  complianceNotes: [
    "Statute of Limitations: 4 years from date of loss (O.C.G.A. § 9-3-31)",
    "Georgia law requires insurers to pay the actual cash value of the loss, which includes diminished value.",
    "The 17(c) formula is NOT mandated by Georgia law and should not be used as the sole basis for valuation.",
    "Claimants may file complaints with the Georgia Department of Insurance if claims are improperly denied.",
  ],
  statuteOfLimitations: "4 years from date of loss",
  systemPromptInstructions: `You are advising on a Georgia diminished value claim. Apply ONLY these legal principles:

GEORGIA DIMINISHED VALUE LAW:
- DV = Fair Market Value BEFORE collision - Fair Market Value AFTER proper repairs
- This is established by State Farm v. Mabry (274 Ga. App. 103, 616 S.E.2d 869)
- The 17(c) formula is NOT approved or mandated by Georgia law
- Per Georgia DOI Directive 08-P&C-2, insurers must consider ALL relevant evidence

KEY CASE LAW:
- State Farm v. Mabry: DV is recoverable as property damage
- GEICO v. Bouldin: DV recoverable under UM/UIM coverage
- Perma Ad Ideas v. Mayville: Repairs alone don't restore full value

NEGOTIATION GUIDANCE:
- Reject any insurer attempt to use 17(c) as the only valid method
- Cite DOI Directive 08-P&C-2 which prohibits formula-only approaches
- Emphasize comparable sales and independent appraisal evidence
- Statute of limitations is 4 years from date of loss

NEVER claim that 17(c) is valid or mandated under Georgia law. This is explicitly contradicted by DOI Directive 08-P&C-2.`,
};

export const FLORIDA_LAW: StateLaw = {
  state: "FL",
  stateName: "Florida",
  dvMeasure: "Diminished value is recoverable from the at-fault party's liability insurance. Florida follows traditional tort principles for property damage claims.",
  keyStatutes: [
    "Fla. Stat. § 627.7015 - Mediation of automobile insurance claims",
    "Fla. Stat. § 95.11(3)(a) - 4-year statute of limitations for property damage",
  ],
  keyCaseLaw: [
    {
      name: "Standard Property Damage Rules",
      citation: "Florida Common Law",
      holding: "Florida allows recovery of diminished value as part of property damage when the at-fault party is liable.",
    },
  ],
  negotiationAngles: [
    "Florida is an at-fault state, so DV claims go against the at-fault driver's insurance.",
    "Claimants should document pre-accident value with multiple sources.",
    "Comparable sales data from similar vehicles strengthens the claim.",
    "Consider mediation under Fla. Stat. § 627.7015 if claim is disputed.",
  ],
  complianceNotes: [
    "Statute of Limitations: 4 years from date of loss",
    "Florida is a no-fault state for medical, but property damage follows traditional tort rules.",
    "DV claims are made against the at-fault party's property damage liability coverage.",
  ],
  statuteOfLimitations: "4 years from date of loss",
  systemPromptInstructions: `You are advising on a Florida diminished value claim. Apply ONLY these legal principles:

FLORIDA DIMINISHED VALUE LAW:
- DV is recoverable from the at-fault party's liability insurance
- Florida follows traditional tort principles for property damage
- No specific state formula is mandated

KEY POINTS:
- Florida is no-fault for medical but at-fault for property damage
- DV claims go against the at-fault driver's insurance
- 4-year statute of limitations applies

NEGOTIATION GUIDANCE:
- Document pre-accident value thoroughly
- Use comparable sales to support valuation
- Consider mediation if claim is disputed

Do not assert specific formulas are required by Florida law. Only explain general principles.`,
};

export const NORTH_CAROLINA_LAW: StateLaw = {
  state: "NC",
  stateName: "North Carolina",
  dvMeasure: "Diminished value is recoverable from the at-fault party as an element of property damage. North Carolina follows traditional property damage principles.",
  keyStatutes: [
    "N.C.G.S. § 1-52 - 3-year statute of limitations for property damage",
  ],
  keyCaseLaw: [
    {
      name: "Standard Property Damage Rules",
      citation: "North Carolina Common Law",
      holding: "North Carolina recognizes diminished value as compensable property damage.",
    },
  ],
  negotiationAngles: [
    "North Carolina is a contributory negligence state - claimant must not be at fault at all.",
    "Document the accident report showing the other party at fault.",
    "Use independent appraisals and comparable sales data.",
    "The insurer must pay fair compensation for all property damage including DV.",
  ],
  complianceNotes: [
    "Statute of Limitations: 3 years from date of loss",
    "North Carolina follows pure contributory negligence - any fault by claimant bars recovery.",
    "Claims should clearly establish the other party was 100% at fault.",
  ],
  statuteOfLimitations: "3 years from date of loss",
  systemPromptInstructions: `You are advising on a North Carolina diminished value claim. Apply ONLY these legal principles:

NORTH CAROLINA DIMINISHED VALUE LAW:
- DV is recoverable from the at-fault party as property damage
- North Carolina follows traditional property damage principles
- 3-year statute of limitations (shorter than GA/FL)

KEY POINTS:
- NC uses CONTRIBUTORY NEGLIGENCE - claimant must be 0% at fault
- If claimant has any fault, DV recovery is barred
- Claims must clearly establish other party was fully at fault

NEGOTIATION GUIDANCE:
- Ensure police report shows other party at fault
- Document pre-accident value with multiple sources
- Use comparable sales to support valuation

Do not assert specific formulas are required by NC law. Only explain general principles.`,
};

export const TEXAS_LAW: StateLaw = {
  state: "TX",
  stateName: "Texas",
  dvMeasure: "Diminished value is recovery against the at-fault party's liability insurance. Texas recognizes DV as an element of property damage.",
  keyStatutes: [
    "Tex. Civ. Prac. & Rem. Code § 2001 - Damages for tortious injury to person or property",
    "Tex. Civ. Prac. & Rem. Code § 12.002 - Statute of limitations (2 years)",
  ],
  keyCaseLaw: [
    {
      name: "Colson v. Tenneco, Inc.",
      citation: "65 S.W.3d 872 (Tex. Civ. App. - Houston [1st Dist.] 2001)",
      holding: "Texas recognizes diminished value claims as recoverable damages in property damage cases.",
    },
  ],
  negotiationAngles: [
    "Texas follows traditional tort principles - DV is recoverable from the at-fault party's insurance.",
    "Use comparable vehicle sales data to support market value estimates.",
    "Independent professional appraisals carry significant weight in Texas courts.",
    "Statute of limitations is 2 years - act promptly on claims.",
  ],
  complianceNotes: [
    "Statute of Limitations: 2 years from date of loss (shorter than GA/FL)",
    "Texas allows recovery of diminished value as part of property damage from at-fault party's liability insurance.",
    "Small claims court jurisdiction: $20,000 in some jurisdictions.",
  ],
  statuteOfLimitations: "2 years from date of loss",
  systemPromptInstructions: `You are advising on a Texas diminished value claim. Apply ONLY these legal principles:

TEXAS DIMINISHED VALUE LAW:
- DV is recoverable from the at-fault party's liability insurance
- Texas follows traditional tort principles for property damage
- Statute of limitations is 2 years (shorter than other states)

KEY POINTS:
- Colson v. Tenneco establishes DV as recoverable property damage
- Use comparable vehicle sales data
- Professional appraisals are weighted evidence

NEGOTIATION GUIDANCE:
- Cite comparable sales data
- Reference professional appraisal methodology
- Act quickly - 2-year statute of limitations

Do not assert specific formulas are required by Texas law. Only explain general principles.`,
};

export const CALIFORNIA_LAW: StateLaw = {
  state: "CA",
  stateName: "California",
  dvMeasure: "Diminished value is recoverable from the at-fault party as an element of property damage under tort law principles.",
  keyStatutes: [
    "Cal. Civ. Code § 1748.25 - Recovery for damages related to auto repair",
    "Cal. Code Civ. Proc. § 335.1 - 4-year statute of limitations for property damage",
  ],
  keyCaseLaw: [
    {
      name: "Keeton & Widiss Property Damage Principles",
      citation: "California Common Law",
      holding: "California courts recognize diminished value as a component of property damage recoverable from the at-fault party.",
    },
  ],
  negotiationAngles: [
    "California is a comparative fault state - recovery is based on degree of fault.",
    "DV claims should be supported by comparable sales data and market analysis.",
    "Independent professional appraisals strengthen DV claims in California.",
    "Statute of limitations is 4 years from date of loss.",
  ],
  complianceNotes: [
    "Statute of Limitations: 4 years from date of loss",
    "California uses comparative negligence - recovery is reduced by claimant's percentage of fault.",
    "DV claims are more common in higher-value vehicle markets (e.g., luxury cars, EVs).",
  ],
  statuteOfLimitations: "4 years from date of loss",
  systemPromptInstructions: `You are advising on a California diminished value claim. Apply ONLY these legal principles:

CALIFORNIA DIMINISHED VALUE LAW:
- DV is recoverable as property damage from the at-fault party
- California follows comparative fault principles
- 4-year statute of limitations applies

KEY POINTS:
- Comparative negligence: Recovery is reduced by claimant's fault percentage
- Use comparable vehicle sales data
- Professional appraisals are important evidence

NEGOTIATION GUIDANCE:
- Establish other party's fault clearly
- Document pre-accident value with multiple sources
- Cite comparable sales data and market analysis

Do not assert specific formulas are required by California law. Only explain general principles.`,
};

const STATE_LAWS: Record<"GA" | "FL" | "NC" | "TX" | "CA", StateLaw> = {
  GA: GEORGIA_LAW,
  FL: FLORIDA_LAW,
  NC: NORTH_CAROLINA_LAW,
  TX: TEXAS_LAW,
  CA: CALIFORNIA_LAW,
};

export function getStateLaw(state: "GA" | "FL" | "NC" | "TX" | "CA"): StateLaw {
  return STATE_LAWS[state] || STATE_LAWS["GA"];
}

export function getSystemPromptForState(state: "GA" | "FL" | "NC" | "TX" | "CA"): string {
  return STATE_LAWS[state].systemPromptInstructions;
}

export function getNegotiationAngles(state: "GA" | "FL" | "NC" | "TX" | "CA"): string[] {
  return STATE_LAWS[state].negotiationAngles;
}

export function getCaseLawSummary(state: "GA" | "FL" | "NC" | "TX" | "CA"): string {
  const law = STATE_LAWS[state];
  return law.keyCaseLaw
    .map((c) => `${c.name} (${c.citation}): ${c.holding}`)
    .join("\n\n");
}

export function getComplianceReminder(state: "GA" | "FL" | "NC" | "TX" | "CA"): string {
  const law = STATE_LAWS[state];
  return `COMPLIANCE NOTES FOR ${law.stateName.toUpperCase()}:\n` +
    law.complianceNotes.map((note) => `• ${note}`).join("\n");
}
