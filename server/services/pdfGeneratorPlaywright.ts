/**
 * Professional PDF Generator using Playwright
 * 
 * Generates IACP-certified Georgia Diminished Value Appraisal Reports
 * with proper legal citations, comparable vehicle tables, and transparent calculations.
 */

import { chromium, Browser, Page } from "playwright";
import type { ComparableListing, ValuationResult, VINDataReport } from "./marketcheckClient";
import { POST_ACCIDENT_FACTOR } from "./marketcheckClient";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

export interface AppraisalPdfInput {
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  ownershipType: "owner" | "lessee";

  year: number;
  make: string;
  model: string;
  trim: string;
  vin: string;
  mileage: number;
  licensePlate?: string;
  stateOfRegistration: string;

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
  keyImpactAreas?: string;

  valuationResult: ValuationResult;
}

const CERTIFICATION_NUMBER = "GA-DV-2024-PLACEHOLDER";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getHistoryBadge(comp: ComparableListing): string {
  if (!comp.vinDataReport) return '<span class="badge badge-gray">No Data</span>';
  
  const clean = !comp.vinDataReport.hasJunkSalvageRecord && 
                !comp.vinDataReport.hasTotalLossRecord && 
                comp.vinDataReport.titleBrands.length === 0;
  
  if (clean) {
    return '<span class="badge badge-green">Clean Title</span>';
  }
  
  const issues: string[] = [];
  if (comp.vinDataReport.hasJunkSalvageRecord) issues.push("Salvage");
  if (comp.vinDataReport.hasTotalLossRecord) issues.push("Total Loss");
  if (comp.vinDataReport.titleBrands.length > 0) issues.push(comp.vinDataReport.titleBrands.join(", "));
  
  return `<span class="badge badge-yellow">${issues.join(", ")}</span>`;
}

function generateHtml(input: AppraisalPdfInput): string {
  const { valuationResult } = input;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  
  const includePermaAdIdeas = input.ownershipType === "lessee";
  
  const compsTableRows = valuationResult.selectedComps.map((comp, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${comp.year} ${comp.make} ${comp.model} ${comp.trim || ""}</td>
      <td>${comp.vin}</td>
      <td>${comp.mileage.toLocaleString()}</td>
      <td class="price">${formatCurrency(comp.price)}</td>
      <td>${comp.dealerName}<br><small>${comp.dealerCity || ""}, ${comp.dealerState || ""}</small></td>
      <td>${getHistoryBadge(comp)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Diminished Value Appraisal Report</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: "Georgia", "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
    }
    
    .page {
      page-break-after: always;
      min-height: calc(11in - 1.5in);
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(11in - 1.5in);
    }
    
    .cover-title {
      font-size: 28pt;
      font-weight: bold;
      color: #1e3a5f;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .cover-subtitle {
      font-size: 18pt;
      color: #333;
      margin-bottom: 40px;
    }
    
    .cover-vehicle {
      font-size: 22pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .cover-vin {
      font-size: 14pt;
      color: #666;
      margin-bottom: 40px;
      font-family: "Courier New", monospace;
    }
    
    .cover-date {
      font-size: 14pt;
      margin-top: 60px;
    }
    
    .cover-badge {
      margin-top: 40px;
      padding: 15px 30px;
      border: 3px solid #1e3a5f;
      font-size: 12pt;
      font-weight: bold;
      color: #1e3a5f;
    }
    
    /* Section Headers */
    h2 {
      font-size: 14pt;
      color: #1e3a5f;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 5px;
      margin: 25px 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    h3 {
      font-size: 12pt;
      color: #333;
      margin: 15px 0 10px 0;
    }
    
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 30px;
      margin-bottom: 15px;
    }
    
    .info-item {
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      width: 140px;
      flex-shrink: 0;
    }
    
    .info-value {
      color: #333;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1px solid #ccc;
      padding: 8px 10px;
      text-align: left;
    }
    
    th {
      background: #1e3a5f;
      color: white;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9pt;
    }
    
    tr:nth-child(even) {
      background: #f8f8f8;
    }
    
    .price {
      text-align: right;
      font-weight: bold;
    }
    
    /* Calculation Box */
    .calculation-box {
      background: #f5f7fa;
      border: 2px solid #1e3a5f;
      padding: 20px;
      margin: 20px 0;
      font-family: "Courier New", monospace;
    }
    
    .calculation-box h3 {
      font-family: "Georgia", serif;
      margin-bottom: 15px;
      color: #1e3a5f;
    }
    
    .calc-line {
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
    }
    
    .calc-line.total {
      border-top: 2px solid #1e3a5f;
      padding-top: 10px;
      margin-top: 15px;
      font-weight: bold;
      font-size: 12pt;
    }
    
    .calc-line.result {
      background: #1e3a5f;
      color: white;
      padding: 10px;
      margin: 10px -20px -20px -20px;
      font-size: 14pt;
    }
    
    /* Legal Citation */
    .legal-citation {
      background: #fff8e6;
      border-left: 4px solid #d4a900;
      padding: 15px;
      margin: 15px 0;
      font-style: italic;
    }
    
    .legal-citation strong {
      font-style: normal;
      color: #1e3a5f;
    }
    
    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9pt;
      font-weight: bold;
    }
    
    .badge-green {
      background: #d4edda;
      color: #155724;
    }
    
    .badge-yellow {
      background: #fff3cd;
      color: #856404;
    }
    
    .badge-gray {
      background: #e9ecef;
      color: #495057;
    }
    
    /* Certification Page */
    .certification-page {
      text-align: center;
      padding-top: 100px;
    }
    
    .certification-seal {
      width: 150px;
      height: 150px;
      border: 3px solid #1e3a5f;
      border-radius: 50%;
      margin: 30px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12pt;
      font-weight: bold;
      color: #1e3a5f;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      width: 300px;
      margin: 60px auto 10px auto;
    }
    
    /* Footer */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9pt;
      color: #666;
      padding: 10px;
      border-top: 1px solid #ddd;
    }
    
    /* Data Sources */
    .data-sources {
      background: #e8f4f8;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    
    .data-sources ul {
      margin-left: 20px;
    }
    
    .note-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 10px 15px;
      margin: 15px 0;
      font-size: 10pt;
    }
  </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="page cover-page">
  <div class="cover-title">Diminished Value<br>Appraisal Report</div>
  <div class="cover-subtitle">State of Georgia</div>
  
  <div class="cover-vehicle">${input.year} ${input.make} ${input.model}</div>
  <div class="cover-vin">VIN: ${input.vin}</div>
  
  <div class="cover-badge">GEORGIA DIMINISHED VALUE EXPERTS</div>
  
  <div class="cover-date">
    <strong>Appraisal Date:</strong> ${today}<br>
    <strong>Claim Number:</strong> ${input.claimNumber}
  </div>
</div>

<!-- OWNER INFORMATION -->
<div class="page">
  <h2>1. Owner Information</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Owner Name:</span><span class="info-value">${input.ownerName}</span></div>
    <div class="info-item"><span class="info-label">Ownership Type:</span><span class="info-value">${input.ownershipType === "lessee" ? "Lessee (Leaseholder)" : "Titled Owner"}</span></div>
    <div class="info-item"><span class="info-label">Address:</span><span class="info-value">${input.ownerAddress}</span></div>
    <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${input.ownerPhone}</span></div>
    <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${input.ownerEmail}</span></div>
  </div>

  <h2>2. Vehicle Information</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Year:</span><span class="info-value">${input.year}</span></div>
    <div class="info-item"><span class="info-label">Make:</span><span class="info-value">${input.make}</span></div>
    <div class="info-item"><span class="info-label">Model:</span><span class="info-value">${input.model}</span></div>
    <div class="info-item"><span class="info-label">Trim:</span><span class="info-value">${input.trim || "N/A"}</span></div>
    <div class="info-item"><span class="info-label">VIN:</span><span class="info-value" style="font-family: monospace;">${input.vin}</span></div>
    <div class="info-item"><span class="info-label">Mileage:</span><span class="info-value">${input.mileage.toLocaleString()} miles</span></div>
    <div class="info-item"><span class="info-label">License Plate:</span><span class="info-value">${input.licensePlate || "N/A"}</span></div>
    <div class="info-item"><span class="info-label">State of Reg.:</span><span class="info-value">${input.stateOfRegistration}</span></div>
  </div>

  <h2>3. Insurance Information</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Insurance Co.:</span><span class="info-value">${input.insuranceCompany}</span></div>
    <div class="info-item"><span class="info-label">Claim Number:</span><span class="info-value">${input.claimNumber}</span></div>
    <div class="info-item"><span class="info-label">Date of Loss:</span><span class="info-value">${formatDate(input.dateOfLoss)}</span></div>
    <div class="info-item"><span class="info-label">Adjuster:</span><span class="info-value">${input.adjusterName || "N/A"}</span></div>
  </div>

  <h2>4. Purpose of Report</h2>
  <p>This appraisal report has been prepared to establish the diminished value of the above-referenced vehicle following a motor vehicle accident. Diminished value represents the difference between the vehicle's fair market value immediately before the accident and its fair market value after repairs have been completed.</p>
  <p style="margin-top: 10px;">The purpose of this report is to support the vehicle owner's claim for diminished value damages against the at-fault party's insurance carrier.</p>
</div>

<!-- GEORGIA LAW -->
<div class="page">
  <h2>5. Georgia Law Statement</h2>
  
  <div class="legal-citation">
    <strong>State Farm Mutual Automobile Insurance Company v. Mabry, 274 Ga. 498, 556 S.E.2d 114 (2001)</strong><br><br>
    The Georgia Supreme Court held that a claimant is entitled to recover the diminished value of their vehicle when another party's negligence causes damage to that vehicle. The Court stated: "The true measure of damages for injury to personal property where the property can be repaired is the difference between the value of the property before and after the injury."
  </div>

  <p>Under Georgia law, when a vehicle is damaged in an accident caused by another party's negligence, the vehicle owner is entitled to compensation for:</p>
  <ul style="margin: 10px 0 10px 30px;">
    <li>The cost of repairs to restore the vehicle to its pre-accident condition</li>
    <li>The diminished value (inherent diminished value) that remains after repairs</li>
    <li>Any additional out-of-pocket losses related to the accident</li>
  </ul>

  ${includePermaAdIdeas ? `
  <div class="legal-citation">
    <strong>Perma Ad Ideas, Inc. v. Mayville, 158 Ga. App. 707 (1981)</strong><br><br>
    The Georgia Court of Appeals established that a person in lawful possession of property may recover for damage to that property even without holding legal title. This precedent supports claims by lessees and leaseholders who have a possessory interest and have suffered financial loss due to diminished value.
  </div>
  <p style="margin-top: 10px;">As a lessee of the subject vehicle, you maintain the right to pursue a diminished value claim based on your possessory interest and any financial loss suffered, consistent with the holding in <em>Perma Ad Ideas, Inc. v. Mayville</em>.</p>
  ` : ""}

  <h2>6. Repair Center Information</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Repair Center:</span><span class="info-value">${input.repairCenterName || "Not specified"}</span></div>
    <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${input.repairCenterPhone || "N/A"}</span></div>
    <div class="info-item"><span class="info-label">Address:</span><span class="info-value">${input.repairCenterAddress || "N/A"}</span></div>
    <div class="info-item"><span class="info-label">Drop-off Date:</span><span class="info-value">${formatDate(input.repairDropOffDate)}</span></div>
    <div class="info-item"><span class="info-label">Pickup Date:</span><span class="info-value">${formatDate(input.repairPickupDate)}</span></div>
    <div class="info-item"><span class="info-label">Total Repair Cost:</span><span class="info-value">${input.totalRepairCost ? formatCurrency(input.totalRepairCost) : "N/A"}</span></div>
  </div>

  <h2>7. Damage Location Information</h2>
  <p><strong>Key Impact Areas:</strong> ${input.keyImpactAreas || "Not specified"}</p>
  <p style="margin-top: 10px;"><strong>Damage Description:</strong> ${input.damageDescription || "Not specified"}</p>
</div>

<!-- MARKET RESEARCH -->
<div class="page">
  <h2>8. Market Research Analysis</h2>
  
  <h3>Methodology</h3>
  <p>This appraisal utilizes a comprehensive market-based approach to determine the subject vehicle's pre-accident fair market value and post-accident diminished value. The valuation methodology incorporates:</p>
  
  <div class="data-sources">
    <strong>Data Sources:</strong>
    <ul>
      <li><strong>MarketCheck Price™ Valuation</strong> - Third-party algorithmic pricing based on current market conditions and comparable sales data</li>
      <li><strong>VINData AAMVA / NMVTIS Title History</strong> - National Motor Vehicle Title Information System reports via MarketCheck integration to verify title status and history</li>
      <li><strong>Active Retail Listings</strong> - Current dealer inventory of comparable vehicles for market verification</li>
    </ul>
  </div>

  <h3>Comparable Vehicle Selection Criteria</h3>
  <ul style="margin-left: 20px;">
    <li>Same year, make, and model as subject vehicle</li>
    <li>Similar trim level when available</li>
    <li>Mileage within tolerance range of subject vehicle</li>
    <li>Matching title/accident history profile (verified via VINData NMVTIS)</li>
    <li>Active retail dealer listings only (no auction or wholesale data)</li>
  </ul>

  <h2>9. Comparable Vehicles</h2>
  <p>The following comparable vehicles were identified and verified for this analysis:</p>
  
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Vehicle</th>
        <th>VIN</th>
        <th>Mileage</th>
        <th>Price</th>
        <th>Dealer</th>
        <th>History</th>
      </tr>
    </thead>
    <tbody>
      ${compsTableRows}
    </tbody>
  </table>
  
  ${valuationResult.selectedComps.some(c => c.historyMatchStatus !== "exact") ? `
  <div class="note-box">
    <strong>Note:</strong> Some comparable vehicles may show "No Data" for title history if NMVTIS records were not available. These comparables were included based on closest mileage and vehicle specification match.
  </div>
  ` : ""}
</div>

<!-- RESULTS -->
<div class="page">
  <h2>10. Results of Evaluation</h2>
  
  <p>Based on the comprehensive market analysis and comparable vehicle data, the subject vehicle demonstrates measurable diminished value following the accident and subsequent repairs.</p>
  
  <p style="margin-top: 15px;">The market data indicates that prospective buyers consistently pay less for vehicles with documented accident history compared to similar vehicles without such history. This "stigma damage" persists regardless of the quality of repairs performed.</p>

  <h2>11. Valuation Calculation</h2>
  
  <div class="calculation-box">
    <h3>Transparent Calculation Methodology</h3>
    
    <div class="calc-line">
      <span>MarketCheck Price™ (Pre-Accident):</span>
      <span>${formatCurrency(valuationResult.marketcheckPricePre)}</span>
    </div>
    
    <div class="calc-line">
      <span>Average of ${valuationResult.selectedComps.length} Comparable Retail Listings:</span>
      <span>${formatCurrency(valuationResult.avgCompPrice)}</span>
    </div>
    
    <div class="calc-line total">
      <span>Final Pre-Accident Fair Market Value:</span>
      <span>${formatCurrency(valuationResult.finalPreAccidentValue)}</span>
    </div>
    
    <div class="calc-line" style="margin-top: 15px; font-size: 10pt; color: #666;">
      <span>Formula: (MarketCheck Price + Avg Comp Price) ÷ 2</span>
      <span>(${formatCurrency(valuationResult.marketcheckPricePre)} + ${formatCurrency(valuationResult.avgCompPrice)}) ÷ 2</span>
    </div>
    
    <div class="calc-line" style="margin-top: 20px; border-top: 1px dashed #999; padding-top: 15px;">
      <span>Post-Accident Adjustment Factor:</span>
      <span>${POST_ACCIDENT_FACTOR} (${((1 - POST_ACCIDENT_FACTOR) * 100).toFixed(0)}% reduction)</span>
    </div>
    
    <div class="calc-line">
      <span>Post-Accident Fair Market Value:</span>
      <span>${formatCurrency(valuationResult.postAccidentValue)}</span>
    </div>
    
    <div class="calc-line result">
      <span>DIMINISHED VALUE:</span>
      <span>${formatCurrency(valuationResult.diminishedValue)}</span>
    </div>
  </div>

  <div class="note-box">
    <strong>Calculation Note:</strong> The post-accident adjustment factor of ${POST_ACCIDENT_FACTOR} is a temporary testing assumption. A more precise post-accident value would incorporate specific damage severity, repair quality assessment, and additional market factors. This factor represents an estimated ${((1 - POST_ACCIDENT_FACTOR) * 100).toFixed(0)}% reduction in value due to the accident history stigma.
  </div>

  <h2>12. Georgia Insurance Commissioner Directive</h2>
  <p>This appraisal is prepared in accordance with the principles outlined in <strong>Office of Insurance and Safety Fire Commissioner Directive 08-P&C-2</strong>, which addresses the handling of diminished value claims in the State of Georgia.</p>
  
  <p style="margin-top: 10px;">The Directive acknowledges that insurers must consider diminished value claims when presented with supporting documentation, and that the burden of proof lies with the claimant to establish the diminished value through credible evidence such as this appraisal report.</p>
</div>

<!-- CERTIFICATION PAGE -->
<div class="page certification-page">
  <h2 style="border: none; text-align: center;">Certification</h2>
  
  <div class="certification-seal">
    CERTIFIED<br>APPRAISAL
  </div>
  
  <p style="max-width: 500px; margin: 0 auto; text-align: left;">
    I hereby certify that the statements of fact contained in this report are true and correct to the best of my knowledge. The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions, and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.
  </p>
  
  <p style="margin-top: 20px; max-width: 500px; margin-left: auto; margin-right: auto; text-align: left;">
    I have no present or prospective interest in the property that is the subject of this report, and I have no personal interest with respect to the parties involved.
  </p>
  
  <p style="margin-top: 20px; max-width: 500px; margin-left: auto; margin-right: auto; text-align: left;">
    My engagement in this assignment was not contingent upon developing or reporting predetermined results.
  </p>
  
  <div class="signature-line"></div>
  <p><strong>Appraiser Signature</strong></p>
  
  <p style="margin-top: 30px;"><strong>Certification Number:</strong> ${CERTIFICATION_NUMBER}</p>
  <p><strong>Report Date:</strong> ${today}</p>
  
  <p style="margin-top: 40px; font-size: 10pt; color: #666;">
    This report is intended solely for the use of the client identified herein. Any use of this report by third parties without written authorization is prohibited.
  </p>
</div>

</body>
</html>`;
}

export async function generateAppraisalPdf(input: AppraisalPdfInput): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    const html = generateHtml(input);
    await page.setContent(html, { waitUntil: "networkidle" });
    
    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.75in",
        right: "0.75in",
        bottom: "0.75in",
        left: "0.75in",
      },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
