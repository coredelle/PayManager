import PDFDocument from "pdfkit";
import type { AppraisalInput, AppraisalComputationResult, ComparableListing } from "@shared/types/appraisal";
import { buildGeorgiaLegalSections } from "../constants/georgiaLaw";
import { getDamagePointsForCodes, formatDamageAreas, DAMAGE_CODE_LABELS } from "../constants/damageMap";

const BRAND_COLOR = "#1e3a5f";
const ACCENT_COLOR = "#10b981";
const TEXT_COLOR = "#333333";
const LIGHT_GRAY = "#f5f5f5";

interface PdfOptions {
  appraisal: AppraisalInput;
  result: AppraisalComputationResult;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function generateAppraisalPdf(options: PdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { appraisal, result } = options;
    const legal = buildGeorgiaLegalSections({ isLeased: appraisal.isLeased });

    const doc = new PDFDocument({
      size: "letter",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let pageNumber = 0;

    function addPageFooter() {
      pageNumber++;
      const totalPages = 10;
      doc
        .fontSize(9)
        .fillColor("#666666")
        .text(
          `Georgia Diminished Value Appraisal Report – ${appraisal.ownerName} – Page ${pageNumber} of ${totalPages}`,
          50,
          doc.page.height - 40,
          { align: "center", width: doc.page.width - 100 }
        );
    }

    function addSectionTitle(title: string) {
      doc
        .fontSize(14)
        .fillColor(BRAND_COLOR)
        .font("Helvetica-Bold")
        .text(title, { align: "left" })
        .moveDown(0.5);
      doc.font("Helvetica");
    }

    function addSubsectionTitle(title: string) {
      doc
        .fontSize(11)
        .fillColor(ACCENT_COLOR)
        .font("Helvetica-Bold")
        .text(title, { align: "left" })
        .moveDown(0.3);
      doc.font("Helvetica");
    }

    function addParagraph(text: string) {
      doc
        .fontSize(10)
        .fillColor(TEXT_COLOR)
        .font("Helvetica")
        .text(text, { align: "justify", lineGap: 2 })
        .moveDown(0.5);
    }

    function addLabelValue(label: string, value: string) {
      doc
        .fontSize(10)
        .fillColor("#666666")
        .font("Helvetica-Bold")
        .text(label + ": ", { continued: true })
        .fillColor(TEXT_COLOR)
        .font("Helvetica")
        .text(value);
    }

    doc
      .fontSize(28)
      .fillColor(BRAND_COLOR)
      .font("Helvetica-Bold")
      .text("Georgia Diminished Value", { align: "center" })
      .text("Appraisal Report", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor("#666666")
      .font("Helvetica")
      .text("Prepared for the State of Georgia", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .font("Helvetica-Bold")
      .text("PayMyValue Appraisal Services", { align: "center" })
      .moveDown(0.3)
      .font("Helvetica")
      .fontSize(10)
      .text("Georgia Diminished Value Specialists", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .font("Helvetica-Bold")
      .text("Prepared For:", { align: "center" })
      .moveDown(0.3)
      .font("Helvetica")
      .fontSize(14)
      .text(appraisal.ownerName, { align: "center" })
      .moveDown(2);

    doc
      .fontSize(11)
      .text(`Date of Report: ${formatDate(new Date().toISOString())}`, { align: "center" })
      .text(`Date of Loss: ${formatDate(appraisal.dateOfLoss)}`, { align: "center" });

    addPageFooter();

    doc.addPage();
    addSectionTitle("Owner Information");
    addLabelValue("Name", appraisal.ownerName);
    addLabelValue("Address", appraisal.ownerAddress);
    addLabelValue("Phone", appraisal.ownerPhone);
    addLabelValue("Email", appraisal.ownerEmail);
    doc.moveDown();

    addSectionTitle("Vehicle Information");
    addLabelValue("Year/Make/Model/Trim", `${appraisal.year} ${appraisal.make} ${appraisal.model} ${appraisal.trim}`);
    addLabelValue("VIN", appraisal.vin);
    if (appraisal.licensePlate) {
      addLabelValue("License Plate", `${appraisal.licensePlate} (${appraisal.stateOfRegistration})`);
    }
    addLabelValue("Mileage at Loss", `${appraisal.mileage.toLocaleString()} miles`);
    addLabelValue("Ownership Type", appraisal.isLeased ? "Leased" : "Owned");
    addLabelValue("Prior Accident History", appraisal.accidentHistory === "clean" ? "No prior accidents" : 
      appraisal.accidentHistory === "prior_damage" ? "Prior accident on record" : "Unknown");
    doc.moveDown();

    addSectionTitle("Insurance Information");
    addLabelValue("Insurance Company", appraisal.insuranceCompany);
    addLabelValue("Claim Number", appraisal.claimNumber);
    if (appraisal.adjusterName) {
      addLabelValue("Adjuster", appraisal.adjusterName);
    }
    if (appraisal.adjusterEmail) {
      addLabelValue("Adjuster Email", appraisal.adjusterEmail);
    }
    if (appraisal.adjusterPhone) {
      addLabelValue("Adjuster Phone", appraisal.adjusterPhone);
    }
    addLabelValue("Date of Loss", formatDate(appraisal.dateOfLoss));

    addPageFooter();

    doc.addPage();
    addSectionTitle("Purpose of Report");
    addParagraph(legal.purposeOfReport);
    doc.moveDown();

    addSectionTitle("Georgia Diminished Value Standard");
    addParagraph(legal.georgiaDvStandard);
    doc.moveDown();

    addSubsectionTitle("Key Georgia Case Law – Mabry v. State Farm");
    addParagraph(legal.mabrySummary);

    if (legal.permaLesseeSummary) {
      doc.moveDown();
      addSubsectionTitle("Leased Vehicle Consideration – Perma Ad Ideas v. Mayville");
      addParagraph(legal.permaLesseeSummary);
    }

    addPageFooter();

    doc.addPage();
    addSectionTitle("Repair Information");
    if (appraisal.repairCenterName) {
      addLabelValue("Repair Center", appraisal.repairCenterName);
    }
    if (appraisal.repairCenterAddress) {
      addLabelValue("Address", appraisal.repairCenterAddress);
    }
    if (appraisal.repairCenterPhone) {
      addLabelValue("Phone", appraisal.repairCenterPhone);
    }
    if (appraisal.repairDropOffDate) {
      addLabelValue("Drop-off Date", formatDate(appraisal.repairDropOffDate));
    }
    if (appraisal.repairPickupDate) {
      addLabelValue("Pickup Date", formatDate(appraisal.repairPickupDate));
    }
    if (appraisal.totalRepairCost) {
      addLabelValue("Total Repair Cost", formatCurrency(appraisal.totalRepairCost));
    }
    doc.moveDown();

    addSectionTitle("Damage Description");
    if (appraisal.damageDescription) {
      addParagraph(appraisal.damageDescription);
    } else {
      addParagraph("Damage description not provided.");
    }
    doc.moveDown();

    addSectionTitle("Impact Areas Diagram");

    const diagramWidth = 300;
    const diagramHeight = 400;
    const startX = (doc.page.width - diagramWidth) / 2;
    const startY = doc.y + 10;

    doc
      .roundedRect(startX, startY, diagramWidth, diagramHeight, 20)
      .fillAndStroke(LIGHT_GRAY, "#cccccc");

    doc
      .roundedRect(startX + 100, startY + 10, 100, 50, 15)
      .fillAndStroke("#ffffff", "#999999");
    doc.fillColor("#666666").fontSize(8).text("FRONT", startX + 130, startY + 30);

    doc
      .roundedRect(startX + 50, startY + 70, 200, 260, 10)
      .fillAndStroke("#ffffff", "#999999");

    doc
      .roundedRect(startX + 100, startY + 340, 100, 50, 15)
      .fillAndStroke("#ffffff", "#999999");
    doc.fillColor("#666666").fontSize(8).text("REAR", startX + 132, startY + 360);

    if (appraisal.keyImpactAreas && appraisal.keyImpactAreas.length > 0) {
      const damagePoints = getDamagePointsForCodes(appraisal.keyImpactAreas);
      
      for (const point of damagePoints) {
        const x = startX + point.x * diagramWidth;
        const y = startY + point.y * diagramHeight;
        
        doc.circle(x, y, 12).fillAndStroke("#ef4444", "#b91c1c");
        doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("X", x - 4, y - 5);
      }

      doc.y = startY + diagramHeight + 20;
      doc.fillColor(TEXT_COLOR).fontSize(10).font("Helvetica");
      doc.text("Damaged Areas: " + formatDamageAreas(appraisal.keyImpactAreas), startX, doc.y, {
        width: diagramWidth,
        align: "center",
      });
    }

    addPageFooter();

    doc.addPage();
    addSectionTitle("Third-Party Market Valuation");
    doc.moveDown(0.5);

    const boxY = doc.y;
    doc.rect(60, boxY, doc.page.width - 120, 80).fillAndStroke(LIGHT_GRAY, "#dddddd");

    doc.fillColor(TEXT_COLOR).fontSize(11).font("Helvetica-Bold");
    doc.text("Third-Party Pre-Accident (Clean Retail):", 80, boxY + 15);
    doc.text(formatCurrency(result.thirdParty.cleanRetailPreAccident), 80, boxY + 15, {
      width: doc.page.width - 180,
      align: "right",
    });

    doc.text("Third-Party Post-Accident (Rough Retail):", 80, boxY + 45);
    doc.text(formatCurrency(result.thirdParty.roughRetailPostAccident), 80, boxY + 45, {
      width: doc.page.width - 180,
      align: "right",
    });

    doc.y = boxY + 100;
    doc.moveDown();
    addParagraph(
      `The above values were obtained from ${result.thirdParty.source}, a recognized third-party automotive valuation provider. ` +
      `The clean retail value represents the fair market value of the subject vehicle in undamaged condition. ` +
      `The rough retail value represents the estimated market value after repairs, accounting for the stigma associated with an accident history.`
    );
    doc.moveDown();
    addParagraph(result.mileageBandDescription);

    addPageFooter();

    doc.addPage();
    addSectionTitle("Comparable Vehicle Analysis");
    addParagraph(result.comparableFilterNotes);
    doc.moveDown();

    if (result.comparables.length > 0) {
      const tableTop = doc.y;
      const tableHeaders = ["#", "Dealer", "Vehicle", "Mileage", "VIN", "Price"];
      const colWidths = [25, 130, 140, 60, 100, 60];
      let currentX = 50;

      doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND_COLOR);
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, tableTop, { width: colWidths[i] });
        currentX += colWidths[i];
      });

      doc.moveTo(50, tableTop + 15).lineTo(doc.page.width - 50, tableTop + 15).stroke("#cccccc");

      let rowY = tableTop + 20;
      doc.font("Helvetica").fontSize(8).fillColor(TEXT_COLOR);

      result.comparables.forEach((comp, idx) => {
        currentX = 50;
        const rowData = [
          String(idx + 1),
          comp.sourceDealerName.substring(0, 22),
          `${comp.year} ${comp.make} ${comp.model}`.substring(0, 24),
          comp.mileage.toLocaleString(),
          comp.vin.substring(0, 17),
          formatCurrency(comp.listedPrice),
        ];

        rowData.forEach((cell, i) => {
          doc.text(cell, currentX, rowY, { width: colWidths[i] });
          currentX += colWidths[i];
        });

        rowY += 20;
      });

      doc.moveTo(50, rowY).lineTo(doc.page.width - 50, rowY).stroke("#cccccc");

      doc.y = rowY + 20;
      doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND_COLOR);
      doc.text(`Average Retail Price of Comparables: ${formatCurrency(result.comparablesAvgRetail)}`);
    } else {
      addParagraph("No comparable vehicles were found matching the search criteria. The valuation relies solely on third-party pricing data.");
    }

    addPageFooter();

    doc.addPage();
    addSectionTitle("Georgia Insurance Commissioner Directive 08-P&C-2");
    addParagraph(legal.directiveSummary);

    addPageFooter();

    doc.addPage();
    addSectionTitle("Results of Evaluation");
    doc.moveDown(0.5);

    addParagraph(
      `Based on the comprehensive analysis conducted, it is the professional opinion of this appraiser that the subject vehicle, ` +
      `a ${appraisal.year} ${appraisal.make} ${appraisal.model} ${appraisal.trim}, VIN ${appraisal.vin}, has sustained inherent diminished value ` +
      `as a result of the collision that occurred on ${formatDate(appraisal.dateOfLoss)} in the State of Georgia.`
    );

    addParagraph(
      `This analysis considered the vehicle's year, make, model, and trim level; current mileage of ${appraisal.mileage.toLocaleString()} miles; ` +
      `the location and severity of damage; third-party market valuation data from ${result.thirdParty.source}; ` +
      `and comparable retail listings in the Georgia market.`
    );

    doc.moveDown();
    doc.fontSize(16).font("Helvetica-Bold").fillColor(BRAND_COLOR);
    doc.text(`CALCULATED DIMINISHED VALUE: ${formatCurrency(result.diminishedValue)}`, { align: "center" });
    doc.moveDown();
    doc.font("Helvetica").fillColor(TEXT_COLOR).fontSize(10);

    addPageFooter();

    doc.addPage();
    addSectionTitle("Report Values & Diminished Value Calculation");
    doc.moveDown(0.5);

    const calcBoxY = doc.y;
    const calcBoxHeight = 180;
    doc.rect(50, calcBoxY, doc.page.width - 100, calcBoxHeight).fillAndStroke(LIGHT_GRAY, "#dddddd");

    const lineHeight = 28;
    let lineY = calcBoxY + 20;

    const calcRows = [
      ["Third-Party Pre-Accident (Clean Retail)", formatCurrency(result.thirdParty.cleanRetailPreAccident)],
      ["Comparables Average Retail Value", formatCurrency(result.comparablesAvgRetail)],
      ["Final Pre-Accident Value (Average)", formatCurrency(result.finalPreAccidentValue)],
      ["Third-Party Post-Accident (Rough Retail)", formatCurrency(result.postAccidentValue)],
      ["CALCULATED DIMINISHED VALUE", formatCurrency(result.diminishedValue)],
    ];

    calcRows.forEach((row, idx) => {
      const isLast = idx === calcRows.length - 1;
      doc.fontSize(isLast ? 12 : 10).font(isLast ? "Helvetica-Bold" : "Helvetica");
      doc.fillColor(isLast ? ACCENT_COLOR : TEXT_COLOR);

      doc.text(row[0], 70, lineY);
      doc.text(row[1], 70, lineY, { width: doc.page.width - 160, align: "right" });
      lineY += lineHeight;
    });

    doc.y = calcBoxY + calcBoxHeight + 20;
    doc.fontSize(10).font("Helvetica").fillColor(TEXT_COLOR);
    addParagraph(
      "Diminished value is calculated as the difference between the final pre-accident value (average of third-party clean retail and comparables) " +
      "and the third-party post-accident rough retail value."
    );

    addPageFooter();

    doc.addPage();
    addSectionTitle("Appraiser Certification");
    addParagraph(legal.certificationText);
    doc.moveDown(2);

    doc.moveTo(100, doc.y).lineTo(300, doc.y).stroke("#333333");
    doc.moveDown(0.3);
    doc.fontSize(10).text("Appraiser Signature", 100);
    doc.moveDown();

    doc.moveTo(350, doc.y - 35).lineTo(500, doc.y - 35).stroke("#333333");
    doc.text("Date", 350, doc.y - 20);
    doc.moveDown(2);

    addSectionTitle("Disclaimer");
    addParagraph(legal.disclaimerText);

    addPageFooter();

    doc.end();
  });
}
