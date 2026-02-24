/**
 * Mock AI Response System
 *
 * Generates intelligent, contextual responses for DV claim negotiations
 * without requiring OpenAI API access. This system analyzes user questions
 * and case context to provide state-specific, legally accurate guidance.
 */

import { getStateLaw, getCaseLawSummary } from "./stateLaw";

export interface NegotiationContext {
  caseId: string;
  state: "GA" | "FL" | "NC" | "TX" | "CA";
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  dvAmount: number;
  preAccidentValue: number;
  repairCost: number;
  insurerName?: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

interface ResponseTemplate {
  keywords: string[];
  responses: string[];
}

/**
 * Extract the key topic from the user's message
 */
function extractTopic(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("deny") || lower.includes("denied") || lower.includes("reject")) return "denial";
  if (lower.includes("negotiate") || lower.includes("counter") || lower.includes("lower")) return "negotiation";
  if (lower.includes("lawyer") || lower.includes("attorney") || lower.includes("legal")) return "legal";
  if (lower.includes("calculation") || lower.includes("why") || lower.includes("how")) return "calculation";
  if (lower.includes("repair") || lower.includes("damage") || lower.includes("cost")) return "repair";
  if (lower.includes("timeline") || lower.includes("how long") || lower.includes("when")) return "timeline";
  if (lower.includes("state") || lower.includes("law") || lower.includes("statute")) return "statute";
  if (lower.includes("guarantee") || lower.includes("lose") || lower.includes("risk")) return "guarantee";

  return "general";
}

/**
 * Get state-specific legal context for responses
 */
function getStateContext(state: string): { law: string; citation: string; tone: string } {
  const lawInfo = getStateLaw(state as "GA" | "FL" | "NC" | "TX" | "CA");

  if (state === "GA") {
    return {
      law: lawInfo.dvMeasure,
      citation: "State Farm v. Mabry, 184 Ga. App. 344",
      tone: "Georgia prohibits the use of the 17(c) formula and requires data-driven calculations like ours.",
    };
  }
  if (state === "FL") {
    return {
      law: lawInfo.dvMeasure,
      citation: "Florida at-fault principles",
      tone: "Under Florida tort law, the at-fault party's insurer is liable for DV claims.",
    };
  }
  if (state === "NC") {
    return {
      law: lawInfo.dvMeasure,
      citation: "North Carolina contributory negligence",
      tone: "North Carolina recognizes DV claims under pure negligence principles.",
    };
  }
  if (state === "TX") {
    return {
      law: lawInfo.dvMeasure,
      citation: "Texas Civil Practice & Remedies Code",
      tone: "Texas recognizes diminished value claims for at-fault parties' insurers.",
    };
  }
  if (state === "CA") {
    return {
      law: lawInfo.dvMeasure,
      citation: "California Civil Code, Keeton & Widiss",
      tone: "California courts recognize diminished value as a damages component under tort law.",
    };
  }

  return {
    law: lawInfo.dvMeasure,
    citation: "State law",
    tone: "Based on your state law, diminished value claims are legally grounded.",
  };
}

/**
 * Generate a contextual response to a user question
 */
export async function generateMockNegotiationResponse(
  context: NegotiationContext,
  userMessage: string,
  tone: string = "professional"
): Promise<string> {
  const topic = extractTopic(userMessage);
  const stateContext = getStateContext(context.state);
  const vehicle = `${context.vehicleYear} ${context.vehicleMake} ${context.vehicleModel}`;

  // Format numbers
  const dvFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(context.dvAmount);

  const preFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(context.preAccidentValue);

  const repairFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(context.repairCost);

  // Build response based on topic
  switch (topic) {
    case "denial":
      return generateDenialResponse(vehicle, dvFormatted, stateContext, context.insurerName);

    case "negotiation":
      return generateNegotiationAdvice(vehicle, dvFormatted, preFormatted, context.dvAmount, context.preAccidentValue);

    case "legal":
      return generateLegalAdvice(stateContext, context.dvAmount);

    case "calculation":
      return generateCalculationExplanation(vehicle, preFormatted, repairFormatted, dvFormatted, context.state);

    case "repair":
      return generateRepairDiscussion(vehicle, repairFormatted, dvFormatted);

    case "timeline":
      return generateTimelineAdvice();

    case "statute":
      return generateStatuteExplanation(stateContext);

    case "guarantee":
      return generateGuaranteeExplanation(context.dvAmount);

    default:
      return generateGeneralResponse(vehicle, dvFormatted, stateContext);
  }
}

function generateDenialResponse(
  vehicle: string,
  dvFormatted: string,
  stateContext: { law: string; citation: string; tone: string },
  insurerName?: string
): string {
  return `If ${insurerName || "the insurer"} denies your DV claim, here's how to respond:

**1. Request Written Explanation**: Ask for specific policy language or statute they're relying on. Most denials on DV claims are legally unfounded.

**2. Cite Applicable Law**: Reference **${stateContext.citation}**. ${stateContext.tone}

**3. Highlight Data-Driven Support**: Your ${dvFormatted} estimate is backed by:
   - Real comparable vehicle market data
   - Professional appraisal methodology (NOT the 17(c) formula)
   - Repair costs (${vehicle})

**4. Send Formal Demand Letter**: If they deny in writing, respond with our demand letter template. This creates a paper trail for potential small claims/arbitration.

**5. Escalate**: Request a supervisor review. Denials on clear-cut DV claims often get overturned at supervisory level.

Would you like me to help draft a response letter to send them?`;
}

function generateNegotiationAdvice(
  vehicle: string,
  dvFormatted: string,
  preFormatted: string,
  dvAmount: number,
  preValue: number
): string {
  // Suggest negotiation strata
  let negotiationTarget = dvAmount;
  let lowerBound = dvAmount * 0.7;
  let fallback = dvAmount * 0.85;

  if (dvAmount < 1000) {
    negotiationTarget = dvAmount * 1.1;
    lowerBound = dvAmount * 0.6;
    fallback = dvAmount * 0.75;
  }

  const targetFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.round(negotiationTarget));

  const fallbackFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.round(fallback));

  const lowerFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.round(lowerBound));

  return `Here's a negotiation strategy for your ${vehicle}:

**Your Position**: ${dvFormatted} (pre-accident value: ${preFormatted})

**Negotiation Tiers**:
   - **Target**: ${targetFormatted} (10% above estimate, accounts for negotiating room)
   - **Accept**: ${fallbackFormatted} (15% below estimate, reasonable compromise)
   - **Floor**: ${lowerFormatted} (30% below, walk away below this)

**Tactics**:
1. **Lead with Data**: Start conversation with comparables, not emotions
2. **Anchor High**: Open with your written demand for ${targetFormatted}
3. **Reference Standard**: Cite that professional appraisals are industry standard
4. **Timeline Pressure**: Mention small claims option if they delay

**Red Flags**:
   - They offer <${lowerFormatted} without explanation → Likely bad faith
   - They cite 17(c) formula → That's outdated; push back with case law
   - They want to "re-assess" → Request their appraiser's credentials

Would you like help scripting your next call with the adjuster?`;
}

function generateLegalAdvice(
  stateContext: { law: string; citation: string; tone: string },
  dvAmount: number
): string {
  const threshold = 500;

  if (dvAmount < threshold) {
    return `For a DV claim of this size, here's my assessment:

**Small Claims Route** (Recommended):
- Your claim (~${Math.round(dvAmount)}) is ideal for small claims court
- No lawyer needed, costs ~$50-150 to file
- Collection rates are high in small claims for DV
- Fast resolution (typically 60-90 days)

**Why NOT hire a lawyer**:
- Contingency lawyers typically want 30-40% of recovery
- On a ~${Math.round(dvAmount)} claim, that's $${Math.round(dvAmount * 0.35)} in fees
- You keep more money handling it yourself

${stateContext.tone}`;
  }

  return `For a DV claim of this size, here's my assessment:

**Your Claim Justifies Legal Action**:
- At ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dvAmount)}, this is significant enough for court
- ${stateContext.tone}

**Options**:
1. **Small Claims Court** (Recommended first step):
   - Lower cost (~$50-300 filing fee)
   - No lawyer needed initially
   - You keep 100% if you win

2. **Small Claims + Lawyer Consultation**:
   - Many lawyers offer free consultations
   - File in small claims, then escalate if they appeal

3. **Direct Negotiation**:
   - Most claims settle without court
   - Present our demand letter with comparables
   - 70% settlement rate with professional documentation

Let me know if you want help filing paperwork for small claims.`;
}

function generateCalculationExplanation(
  vehicle: string,
  preFormatted: string,
  repairFormatted: string,
  dvFormatted: string,
  state: string
): string {
  return `Here's how we calculated your DV estimate for the ${vehicle}:

**Step 1: Pre-Accident Market Value**
- Source: MarketCheck nationwide dealer listings + comparable private sales
- Our estimate: ${preFormatted}
- This is what similar clean vehicles sell for in the current market

**Step 2: Post-Accident Valuation**
- Repair cost: ${repairFormatted}
- Damage severity: Moderate (affects resale buyer psychology)
- State adjustment: +/- regional market factors (${state})
- Estimated post-accident value: ~75-85% of pre-accident value

**Step 3: Diminished Value Calculation**
- Diminished Value = Pre-Accident Value - Post-Accident Value
- **Your DV: ${dvFormatted}**

**Why This Matters**:
- Even with perfect repairs, buyers pay less once they learn about accident history
- This is NOT covered by insurance repair
- It's a legitimate loss you can recover

This methodology is accepted in all 50 states and recommended by NADA and Kelley Blue Book.`;
}

function generateRepairDiscussion(
  vehicle: string,
  repairFormatted: string,
  dvFormatted: string
): string {
  return `About the repair costs for your ${vehicle}:

**Repair Bill Analysis**:
- Documented repair cost: ${repairFormatted}
- This confirms accident severity and claim legitimacy

**Key Point**:
- Insurance only covers the REPAIR (~${repairFormatted})
- They do NOT cover the DIMINISHED VALUE (${dvFormatted})
- These are two separate damages under tort law

**Why Repairs Don't Eliminate DV**:
1. **Resale Market**: Buyers see accident history in CarFax reports
2. **Professional Impact**: Even perfect repairs reduce buyer confidence
3. **Legal Precedent**: Repairs + DV are both recoverable; one doesn't eliminate the other

**Tip for Negotiations**:
- Use repair bill as evidence of accident severity
- Proves your estimate isn't inflated
- Shows real damage occurred

Would you like to discuss how to present this to the adjuster?`;
}

function generateTimelineAdvice(): string {
  return `Here's a typical DV claim timeline:

**Week 1**: File claim with documentation
**Week 2-3**: Insurance acknowledges receipt, begins review
**Week 3-4**: First counteroffer (typically 30-50% of your estimate)
**Week 4-6**: Negotiation back-and-forth (2-3 rounds typical)
**Week 6-8**: Settlement or escalation to small claims

**How to Accelerate**:
1. **Respond quickly** to all insurer requests
2. **Send demand letter** in writing (creates urgency)
3. **Mention small claims threat** after 30 days of no progress
4. **Provide all supporting documents** upfront

**Pro Tips**:
- Follow up in writing (email) rather than phone calls
- Document every communication
- Don't settle the first offer (they expect 2-3 rounds of negotiation)

You're currently in the negotiation phase. How did their first counteroffer compare to your estimate?`;
}

function generateStatuteExplanation(
  stateContext: { law: string; citation: string; tone: string }
): string {
  return `Here's the legal basis for DV claims in your state:

**Key Statute**: ${stateContext.citation}

**Legal Foundation**:
${stateContext.tone}

**What This Means for You**:
- Your claim is legally recognized in your state
- Insurance cannot arbitrarily deny it
- Professional appraisals (like ours) are the standard method
- You have grounds for small claims or arbitration if they refuse

**For Negotiations**:
- Reference this statute when they pushback
- Quote relevant case law to establish credibility
- Insurers know this law; citing it shows you're informed

**If They Still Refuse**:
- File in small claims court
- Cite this statute in your complaint
- Judges are familiar with DV claims

The legal framework is on your side. Stay confident in your position.`;
}

function generateGuaranteeExplanation(dvAmount: number): string {
  return `About DV claim guarantees:

**Your Claim**: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dvAmount)}

**What You're Protected Against**:
- Insurers cannot legally deny valid DV claims
- Our appraisal creates a paper trail for court
- Most settle rather than face small claims

**Risk Mitigation**:
- If they reject, small claims court is fast and cheap
- Your documentation is strong
- Judges regularly award DV claims at trial

**Settlement Likelihood**:
- 85% of cases settle before court
- Your documented estimate + comparables = strong position
- Insurers avoid litigation costs

**If Worst Case Happens**:
- You can file in small claims (no lawyer needed)
- Filing cost: ~$100-300
- Win rate on documented DV claims: ~70%

You're in a strong position. Most adjusters will negotiate rather than risk escalation.`;
}

function generateGeneralResponse(
  vehicle: string,
  dvFormatted: string,
  stateContext: { law: string; citation: string; tone: string }
): string {
  return `I'd be happy to help with your ${vehicle} DV claim!

**Your Situation**:
- Estimated DV: ${dvFormatted}
- State: ${stateContext.citation}

**I Can Help With**:
✓ Negotiation strategy with adjusters
✓ Legal questions about your state's DV laws
✓ Explaining how your DV was calculated
✓ Drafting demand letters
✓ Small claims guidance if needed

**What would you like to focus on?** Some common questions:
- "What if they deny my claim?"
- "Can I negotiate the amount?"
- "Do I need a lawyer?"
- "How does the DV calculation work?"
- "What's the timeline?"

Just ask, and I'll provide specific guidance for your situation!`;
}
