/**
 * AI Narratives Service
 * 
 * OpenAI integration for generating:
 * 1. Appraisal narratives (professional report format)
 * 2. Demand letters (formal claim letters to insurers)
 * 3. Negotiation responses (adjuster conversation coaching)
 * 
 * System prompts include state law context to ensure legally accurate responses.
 * AI is forbidden from:
 * - Hallucinating statutes or case law
 * - Claiming 17(c) is mandated in Georgia
 * - Using data sources not provided
 */

import OpenAI from "openai";
import { getSystemPromptForState, getStateLaw, getCaseLawSummary, getNegotiationAngles } from "./stateLaw";
import { type DVResult } from "./appraisalEngine";
import { type CompVehicle, type DecodedVin } from "./marketData";

// TODO: Uncomment when OPENAI_API_KEY is available
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
const openai = null as any; // Placeholder

export interface AppraisalData {
  claimantName?: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim?: string;
  vin?: string;
  mileage: number;
  state: "GA" | "FL" | "NC";
  dateOfLoss?: string;
  repairCost: number;
  insurerName?: string;
  claimNumber?: string;
  dvResult: DVResult;
  vinData?: DecodedVin;
}

export interface NegotiationContext {
  caseId: string;
  state: "GA" | "FL" | "NC";
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  dvAmount: number;
  preAccidentValue: number;
  repairCost: number;
  insurerName?: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

const APPRAISAL_SYSTEM_PROMPT = `You are a professional automotive appraiser writing a formal diminished value appraisal report. Your reports are used as evidence in insurance claims and must be:

1. PROFESSIONAL: Use formal language appropriate for insurance adjusters and attorneys
2. DETAILED: Include all relevant vehicle and valuation data
3. LEGALLY ACCURATE: Only cite the case law and statutes provided - never make up legal references
4. DATA-DRIVEN: Base all conclusions on the market data and comparable sales provided

FORMAT YOUR REPORT AS FOLLOWS:
- Header with vehicle identification
- Executive summary of diminished value conclusion
- Vehicle description and condition
- Valuation methodology explanation
- Comparable sales analysis
- Pre-accident value determination
- Post-repair value determination  
- Diminished value calculation
- Legal basis for claim (state-specific)
- Conclusion and recommendation

NEVER:
- Hallucinate case law or statutes
- Claim the 17(c) formula is valid for Georgia claims
- Use data sources not explicitly provided
- Make unfounded claims about vehicle history`;

const DEMAND_LETTER_SYSTEM_PROMPT = `You are drafting a formal demand letter for a diminished value claim. The letter should be:

1. PROFESSIONAL AND FIRM: Clear assertion of the claim
2. LEGALLY GROUNDED: Reference applicable state law
3. WELL-SUPPORTED: Cite the appraisal findings and comparable data
4. ACTIONABLE: Include specific demand amount and response deadline

FORMAT YOUR LETTER AS:
- Formal business letter format
- Clear statement of claim
- Summary of accident and repairs
- Explanation of diminished value concept
- State law support for claim
- Valuation summary and methodology
- Specific demand amount
- 30-day response deadline
- Statement that legal action may follow if no response

NEVER:
- Threaten illegal action
- Make false statements
- Cite laws or cases not provided
- In Georgia, NEVER claim 17(c) is the proper valuation method`;

const NEGOTIATION_SYSTEM_PROMPT = `You are a diminished value claim negotiation coach. Help the claimant respond to insurance adjuster tactics professionally and effectively.

YOUR ROLE:
- Provide suggested responses the claimant can use
- Explain adjuster tactics and how to counter them
- Stay factual and professional
- Reference applicable state law when relevant
- Emphasize the strength of documented evidence

COMMON ADJUSTER TACTICS TO ADDRESS:
1. "We only use 17(c)" - Counter with state DOI guidelines
2. "We don't pay diminished value" - Cite case law establishing DV as property damage
3. "Your car is fully repaired" - Explain market stigma of accident history
4. "Our formula says $X" - Emphasize no formula is mandated, actual market data matters
5. "Take it or leave it" - Explain right to pursue claim through other channels

TONE:
- Professional but firm
- Empowering to the claimant
- Never adversarial or threatening
- Focus on facts and evidence

NEVER:
- Advise illegal actions
- Make up case law or statutes
- Guarantee specific outcomes
- In Georgia, NEVER validate the 17(c) formula as proper methodology`;

/**
 * Generate a professional appraisal narrative
 * 
 * This creates a formal report document that can be used as evidence
 * in the insurance claim process.
 */
export async function generateAppraisalNarrative(
  data: AppraisalData,
  comps: CompVehicle[],
): Promise<string> {
  const stateLaw = getStateLaw(data.state);
  const caseLawSummary = getCaseLawSummary(data.state);
  
  const compsDescription = comps.map((c, i) => 
    `Comp ${i + 1}: ${c.year} ${c.make} ${c.model} ${c.trim || ""} - ${c.mileage.toLocaleString()} miles - $${c.price.toLocaleString()} - ${c.dealerName}, ${c.city || ""}, ${c.state || ""}`
  ).join("\n");

  const userPrompt = `Generate a professional diminished value appraisal report for the following:

VEHICLE INFORMATION:
- Year: ${data.vehicleYear}
- Make: ${data.vehicleMake}
- Model: ${data.vehicleModel}
- Trim: ${data.vehicleTrim || "Not specified"}
- VIN: ${data.vin || "Not provided"}
- Mileage at loss: ${data.mileage.toLocaleString()}

CLAIM INFORMATION:
- State: ${data.state} (${stateLaw.stateName})
- Date of Loss: ${data.dateOfLoss || "Not specified"}
- Insurer: ${data.insurerName || "Not specified"}
- Claim Number: ${data.claimNumber || "Not specified"}
- Total Repair Cost: $${data.repairCost.toLocaleString()}

COMPARABLE SALES DATA:
${compsDescription || "No comparable listings available"}

VALUATION RESULTS:
- Pre-Accident Fair Market Value: $${data.dvResult.preAccidentValue.toLocaleString()}
- Post-Repair Fair Market Value: $${data.dvResult.postRepairValue.toLocaleString()}
- Diminished Value: $${data.dvResult.diminishedValue.toLocaleString()}
- Methodology: ${data.dvResult.methodology}

VALUATION BREAKDOWN:
- MarketCheck Price: $${data.dvResult.breakdown.marketCheckPrice.toLocaleString()}
- Comp Median Price: $${data.dvResult.breakdown.compMedianPrice.toLocaleString()}
- Price Range: $${data.dvResult.breakdown.priceRangeLow.toLocaleString()} - $${data.dvResult.breakdown.priceRangeHigh.toLocaleString()}
- Stigma Percentage: ${data.dvResult.breakdown.stigmaPercentage.toFixed(1)}%

STATE LAW CONTEXT:
${stateLaw.dvMeasure}

KEY CASE LAW:
${caseLawSummary}

Generate a complete, professional appraisal report.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: APPRAISAL_SYSTEM_PROMPT + "\n\n" + stateLaw.systemPromptInstructions },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return response.choices[0]?.message?.content || "Unable to generate appraisal narrative.";
}

/**
 * Generate a formal demand letter
 * 
 * This creates a letter that can be sent to the at-fault insurer
 * demanding payment of the diminished value claim.
 */
export async function generateDemandLetter(
  data: AppraisalData,
): Promise<string> {
  const stateLaw = getStateLaw(data.state);
  const caseLawSummary = getCaseLawSummary(data.state);
  const negotiationAngles = getNegotiationAngles(data.state);

  const userPrompt = `Generate a formal demand letter for a diminished value claim:

CLAIMANT: ${data.claimantName || "[Claimant Name]"}

VEHICLE:
- ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel} ${data.vehicleTrim || ""}
- VIN: ${data.vin || "Not provided"}
- Mileage: ${data.mileage.toLocaleString()}

CLAIM DETAILS:
- State: ${data.state} (${stateLaw.stateName})
- Date of Loss: ${data.dateOfLoss || "[Date]"}
- Insurer: ${data.insurerName || "[Insurance Company]"}
- Claim Number: ${data.claimNumber || "[Claim Number]"}
- Repair Cost: $${data.repairCost.toLocaleString()}

VALUATION:
- Pre-Accident Value: $${data.dvResult.preAccidentValue.toLocaleString()}
- Post-Repair Value: $${data.dvResult.postRepairValue.toLocaleString()}
- DEMAND AMOUNT (Diminished Value): $${data.dvResult.diminishedValue.toLocaleString()}

STATE LAW BASIS:
${stateLaw.dvMeasure}

KEY CASE LAW:
${caseLawSummary}

NEGOTIATION POINTS TO INCLUDE:
${negotiationAngles.map(a => `- ${a}`).join("\n")}

Generate a professional demand letter with a 30-day response deadline.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: DEMAND_LETTER_SYSTEM_PROMPT + "\n\n" + stateLaw.systemPromptInstructions },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "Unable to generate demand letter.";
}

/**
 * Generate a negotiation response
 * 
 * This provides coaching for responding to insurance adjuster
 * communications during the claims process.
 */
export async function generateNegotiationResponse(
  context: NegotiationContext,
  userMessage: string,
  tone: "professional" | "firm" | "conciliatory" = "professional"
): Promise<string> {
  const stateLaw = getStateLaw(context.state);
  const negotiationAngles = getNegotiationAngles(context.state);

  const toneInstructions = {
    professional: "Respond in a balanced, professional manner that maintains good rapport while firmly asserting the claim.",
    firm: "Respond firmly and assertively, emphasizing the strength of the legal position and evidence.",
    conciliatory: "Respond in a cooperative tone that seeks common ground while still advocating for fair value.",
  };

  const conversationContext = context.conversationHistory
    .map(m => `${m.role === "user" ? "Claimant" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const userPrompt = `You are coaching a claimant on their diminished value negotiation with an insurance adjuster.

CLAIM CONTEXT:
- Vehicle: ${context.vehicleYear} ${context.vehicleMake} ${context.vehicleModel}
- State: ${context.state}
- Insurer: ${context.insurerName || "Unknown"}
- Pre-Accident Value: $${context.preAccidentValue.toLocaleString()}
- Repair Cost: $${context.repairCost.toLocaleString()}
- Diminished Value Claim: $${context.dvAmount.toLocaleString()}

STATE LAW CONTEXT:
${stateLaw.dvMeasure}

KEY NEGOTIATION ANGLES:
${negotiationAngles.map(a => `- ${a}`).join("\n")}

TONE: ${toneInstructions[tone]}

${conversationContext ? `PREVIOUS CONVERSATION:\n${conversationContext}\n\n` : ""}

CLAIMANT'S CURRENT MESSAGE/QUESTION:
"${userMessage}"

Provide a helpful coaching response that:
1. Addresses their specific question or situation
2. Suggests what they could say to the adjuster
3. Explains the reasoning behind your advice
4. References applicable state law if relevant`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: NEGOTIATION_SYSTEM_PROMPT + "\n\n" + stateLaw.systemPromptInstructions },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || "Unable to generate response.";
}
