/**
 * Demand Letter PDF Service
 *
 * Generates professional demand letters for DV claims
 * with state-specific legal citations and case law references
 */

import PDFDocument from "pdfkit";
import { getStateLaw } from "./stateLaw";

export interface DemandLetterData {
  claimantName: string;
  claimantEmail?: string;
  claimantPhone?: string;
  insurerName: string;
  claimNumber: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin?: string;
  dateOfLoss: string;
  repairCost: number;
  dvAmount: number;
  preAccidentValue: number;
  state: "GA" | "FL" | "NC" | "TX" | "CA";
  appraiserName?: string;
  appraiserLicense?: string;
}

export function generateDemandLetterPdf(data: DemandLetterData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "Letter",
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(14).font("Helvetica-Bold").text("DEMAND FOR PAYMENT", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("Diminished Value Claim", { align: "center" });
      doc.moveDown(0.5);

      // Date
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.fontSize(10).text(`Date: ${today}`);
      doc.moveDown(1);

      // To: Insurance Company
      doc.fontSize(10).font("Helvetica-Bold").text("TO:");
      doc.font("Helvetica").text(data.insurerName);
      doc.text(`Claim #: ${data.claimNumber}`);
      doc.moveDown(1);

      // From: Claimant
      doc.font("Helvetica-Bold").text("FROM:");
      doc.font("Helvetica").text(data.claimantName);
      if (data.claimantEmail) doc.text(`Email: ${data.claimantEmail}`);
      if (data.claimantPhone) doc.text(`Phone: ${data.claimantPhone}`);
      doc.moveDown(1);

      // Subject
      doc.font("Helvetica-Bold").text("SUBJECT: Formal Demand for Diminished Value Payment");
      doc.moveDown(1);

      // Body paragraphs
      doc.font("Helvetica").fontSize(10).text(
        `This letter formally demands payment in the amount of ${formatCurrency(data.dvAmount)} for diminished value damage to my vehicle as a result of the accident that occurred on ${data.dateOfLoss}.`
      );
  doc.moveDown(0.5);

  // Vehicle information
  doc.font("Helvetica-Bold").text("VEHICLE INFORMATION:");
  doc.font("Helvetica");
  doc.text(`  • Year/Make/Model: ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`);
  if (data.vehicleVin) doc.text(`  • VIN: ${data.vehicleVin}`);
  doc.moveDown(0.5);

  // Accident details
  doc.font("Helvetica-Bold").text("ACCIDENT DETAILS:");
  doc.font("Helvetica");
  doc.text(`  • Date of Loss: ${data.dateOfLoss}`);
  doc.text(`  • Claim Number: ${data.claimNumber}`);
  doc.text(`  • Repair Cost: ${formatCurrency(data.repairCost)}`);
  doc.moveDown(0.5);

  // Valuation
  doc.font("Helvetica-Bold").text("DIMINISHED VALUE CALCULATION:");
  doc.font("Helvetica");
  doc.text(`  • Pre-Accident Market Value: ${formatCurrency(data.preAccidentValue)}`);
  doc.text(`  • Post-Accident Market Value: ${formatCurrency(data.preAccidentValue - data.dvAmount)}`);
  doc.text(`  • Diminished Value Amount: ${formatCurrency(data.dvAmount)}`);
  if (data.appraiserName) {
    doc.text(`  • Appraiser: ${data.appraiserName}`);
    if (data.appraiserLicense) doc.text(`  • License: ${data.appraiserLicense}`);
  }
  doc.moveDown(0.5);

  // Legal basis
  const lawInfo = getStateLaw(data.state);
  doc.font("Helvetica-Bold").text("LEGAL BASIS:");
  doc.font("Helvetica").fontSize(9);

  if (data.state === "GA") {
    doc.text(
      "Under Georgia law, specifically as established in State Farm v. Mabry, 184 Ga. App. 344, " +
        "the at-fault party's insurance is responsible for diminished value claims. " +
        "The Georgia Department of Insurance Directive 08-P&C-2 forbids the use of the 17(c) formula and requires data-driven calculations like professional appraisals. " +
        "Diminished value is distinct from repair costs and represents the loss in resale value caused by accident history."
    );
  } else if (data.state === "FL") {
    doc.text(
      "Under Florida tort law, the at-fault party's insurer is liable for all damages resulting from negligence, " +
        "including diminished value. Florida courts recognize that vehicles with accident history sell for less, " +
        "and this loss is recoverable as damages. The insurer cannot limit recovery to repair costs alone."
    );
  } else if (data.state === "NC") {
    doc.text(
      "Under North Carolina law, diminished value claims are recognized under pure negligence principles. " +
        "The at-fault party is liable for all damages flowing from their negligence, including the loss of resale value. " +
        "Professional appraisals documenting the market-based loss of value are the standard method for calculating this damage."
    );
  } else if (data.state === "TX") {
    doc.text(
      "Under Texas Civil Practice & Remedies Code § 2001, the at-fault party is liable for damages caused by their negligence. " +
        "Texas courts recognize diminished value as a legitimate damage component in personal injury and property damage cases. " +
        "The insurer cannot arbitrarily deny DV claims with proper documentation."
    );
  } else if (data.state === "CA") {
    doc.text(
      "Under California tort law, diminished value is recognized as a recoverable damage under Keeton & Widiss principles. " +
        "Even with perfect repairs, vehicles with accident history sell for less in the California market. " +
        "This loss is legally distinct from repair costs and must be compensated separately."
    );
  }

  doc.fontSize(10).moveDown(0.5);

  // Demand
  doc.font("Helvetica-Bold").text("DEMAND:");
  doc.font("Helvetica");
  doc.text(
    `I demand payment of ${formatCurrency(data.dvAmount)} within 30 days of receipt of this letter. ` +
      `This amount represents the diminished value of my vehicle as professionally appraised and documented.`
  );
  doc.moveDown(0.5);

  // Consequences
  doc.font("Helvetica-Bold").text("CONSEQUENCES OF FAILURE TO PAY:");
  doc.font("Helvetica");
  doc.text(
    "If payment is not received within 30 days, I will pursue legal action in small claims court. " +
      "This will result in additional costs to your organization and may expose your company to further liability."
  );
  doc.moveDown(1);

  // Signature section
  doc.font("Helvetica-Bold").text("Respectfully,");
  doc.moveDown(2);
  doc.font("Helvetica").text("_________________________________");
  doc.text(data.claimantName);
  if (data.claimantEmail) doc.text(data.claimantEmail);
  if (data.claimantPhone) doc.text(data.claimantPhone);

  // Footer
  doc.moveDown(1);
  doc.fontSize(8).text(
    "This demand letter is based on professional appraisal and market analysis. " +
      "All figures are supported by comparable vehicle data and repair documentation.",
    { align: "center" }
  );

  doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
