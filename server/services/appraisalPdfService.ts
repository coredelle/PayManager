import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { AppraisalInput, AppraisalComputationResult, ComparableListing, DamageCode } from "@shared/types/appraisal";
import { buildGeorgiaLegalSections } from "../constants/georgiaLaw";
import { getMultiViewDamagePoints, formatDamageAreas, DAMAGE_CODE_LABELS } from "../constants/damageMap";

const BRAND_COLOR = rgb(0.12, 0.23, 0.37);
const ACCENT_COLOR = rgb(0.8, 0, 0);
const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
const LIGHT_GRAY = rgb(0.96, 0.96, 0.96);
const BORDER_GRAY = rgb(0.87, 0.87, 0.87);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 60;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

interface PdfOptions {
  appraisal: AppraisalInput;
  result: AppraisalComputationResult;
}

interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  oblique: PDFFont;
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

async function svgToPng(svgPath: string, width: number, height: number): Promise<Buffer> {
  const svgBuffer = readFileSync(svgPath);
  return sharp(svgBuffer)
    .resize(width, height, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
}

async function fetchQuickChart(cleanRetail: number, roughRetail: number): Promise<Buffer> {
  const chartConfig = {
    type: "bar",
    data: {
      labels: ["Pre-Accident\n(Clean Retail)", "Post-Accident\n(Rough Retail)"],
      datasets: [{
        label: "Vehicle Value",
        data: [cleanRetail, roughRetail],
        backgroundColor: ["#10b981", "#ef4444"],
        borderWidth: 0,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#333",
          font: { weight: "bold", size: 14 },
          formatter: (value: number) => "$" + value.toLocaleString()
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: number) => "$" + (value / 1000) + "k"
          }
        }
      }
    }
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=400&h=250&bkg=white`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`QuickChart error: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.log("QuickChart fetch failed, generating placeholder");
    return await createPlaceholderChart();
  }
}

async function createPlaceholderChart(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250">
    <rect width="400" height="250" fill="#f5f5f5"/>
    <text x="200" y="125" text-anchor="middle" fill="#666" font-size="14" font-family="Helvetica, Arial, sans-serif">Chart unavailable</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function drawSectionHeader(page: PDFPage, fonts: FontSet, title: string, y: number): number {
  page.drawText(title, {
    x: MARGIN_LEFT,
    y,
    size: 16,
    font: fonts.bold,
    color: BRAND_COLOR,
  });
  
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 5,
    width: CONTENT_WIDTH,
    height: 2,
    color: ACCENT_COLOR,
  });
  
  return y - 25;
}

function drawLabelValue(page: PDFPage, fonts: FontSet, label: string, value: string, x: number, y: number, labelWidth = 140): number {
  page.drawText(label + ":", {
    x,
    y,
    size: 10,
    font: fonts.bold,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(value || "N/A", {
    x: x + labelWidth,
    y,
    size: 10,
    font: fonts.regular,
    color: TEXT_COLOR,
  });
  
  return y - 16;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

function drawParagraph(page: PDFPage, fonts: FontSet, text: string, x: number, y: number, maxWidth: number): number {
  const lines = wrapText(text, fonts.regular, 10, maxWidth);
  let currentY = y;
  
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size: 10,
      font: fonts.regular,
      color: TEXT_COLOR,
    });
    currentY -= 14;
  }
  
  return currentY;
}

function drawPageFooter(page: PDFPage, fonts: FontSet, ownerName: string, pageNum: number, totalPages: number) {
  const footerText = `Georgia Diminished Value Appraisal Report – ${ownerName} – Page ${pageNum} of ${totalPages}`;
  const textWidth = fonts.regular.widthOfTextAtSize(footerText, 9);
  
  page.drawText(footerText, {
    x: (PAGE_WIDTH - textWidth) / 2,
    y: 30,
    size: 9,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });
}

async function drawDamageOverlay(
  pdfDoc: PDFDocument,
  page: PDFPage,
  viewType: "top" | "front" | "side" | "rear",
  x: number,
  y: number,
  width: number,
  height: number,
  damageCodes: DamageCode[]
): Promise<void> {
  const svgPath = join(process.cwd(), "server", "assets", "vehicle", `${viewType}-view.svg`);
  
  if (!existsSync(svgPath)) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: LIGHT_GRAY,
      borderColor: BORDER_GRAY,
      borderWidth: 1,
    });
    return;
  }

  try {
    const pngBuffer = await svgToPng(svgPath, Math.round(width * 2), Math.round(height * 2));
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    
    page.drawImage(pngImage, {
      x,
      y,
      width,
      height,
    });

    const damagePoints = getMultiViewDamagePoints(damageCodes);
    for (const point of damagePoints) {
      const viewCoord = point.views[viewType];
      if (viewCoord) {
        const circleX = x + viewCoord.x * width;
        const circleY = y + height - viewCoord.y * height;
        
        page.drawCircle({
          x: circleX,
          y: circleY,
          size: 8,
          color: rgb(0.8, 0, 0),
          opacity: 0.7,
        });
      }
    }
  } catch (error) {
    console.error(`Failed to render ${viewType} view:`, error);
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: LIGHT_GRAY,
      borderColor: BORDER_GRAY,
      borderWidth: 1,
    });
  }
}

export async function generateAppraisalPdf(options: PdfOptions): Promise<Buffer> {
  const { appraisal, result } = options;
  const legal = buildGeorgiaLegalSections({ isLeased: appraisal.isLeased });
  
  const pdfDoc = await PDFDocument.create();
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  const fonts: FontSet = {
    regular: helvetica,
    bold: helveticaBold,
    oblique: helveticaOblique,
  };

  const pages: PDFPage[] = [];
  for (let i = 0; i < 10; i++) {
    pages.push(pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]));
  }

  let page1 = pages[0];
  let y = PAGE_HEIGHT - 120;
  
  page1.drawText("GEORGIA", {
    x: MARGIN_LEFT,
    y,
    size: 32,
    font: fonts.bold,
    color: BRAND_COLOR,
  });
  y -= 40;
  
  page1.drawText("DIMINISHED VALUE", {
    x: MARGIN_LEFT,
    y,
    size: 28,
    font: fonts.bold,
    color: BRAND_COLOR,
  });
  y -= 35;
  
  page1.drawText("APPRAISAL REPORT", {
    x: MARGIN_LEFT,
    y,
    size: 28,
    font: fonts.bold,
    color: BRAND_COLOR,
  });
  y -= 10;
  
  page1.drawRectangle({
    x: MARGIN_LEFT,
    y,
    width: 280,
    height: 3,
    color: ACCENT_COLOR,
  });
  
  y -= 60;
  page1.drawText("PayMyValue Appraisal Services", {
    x: MARGIN_LEFT,
    y,
    size: 14,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  y -= 20;
  page1.drawText("Georgia Diminished Value Specialists", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  y -= 80;
  page1.drawText("PREPARED FOR:", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fonts.bold,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 25;
  page1.drawText(appraisal.ownerName, {
    x: MARGIN_LEFT,
    y,
    size: 18,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  
  y -= 80;
  page1.drawText(`Report Date: ${formatDate(new Date().toISOString())}`, {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fonts.regular,
    color: TEXT_COLOR,
  });
  y -= 18;
  page1.drawText(`Date of Loss: ${formatDate(appraisal.dateOfLoss)}`, {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fonts.regular,
    color: TEXT_COLOR,
  });
  y -= 18;
  page1.drawText(`Claim Number: ${appraisal.claimNumber}`, {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fonts.regular,
    color: TEXT_COLOR,
  });
  
  drawPageFooter(page1, fonts, appraisal.ownerName, 1, 10);

  let page2 = pages[1];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page2, fonts, "OWNER INFORMATION", y);
  y = drawLabelValue(page2, fonts, "Name", appraisal.ownerName, MARGIN_LEFT, y);
  y = drawLabelValue(page2, fonts, "Address", appraisal.ownerAddress, MARGIN_LEFT, y);
  y = drawLabelValue(page2, fonts, "Phone", appraisal.ownerPhone, MARGIN_LEFT, y);
  y = drawLabelValue(page2, fonts, "Email", appraisal.ownerEmail, MARGIN_LEFT, y);
  
  y -= 25;
  y = drawSectionHeader(page2, fonts, "VEHICLE INFORMATION", y);
  y = drawLabelValue(page2, fonts, "Year/Make/Model", `${appraisal.year} ${appraisal.make} ${appraisal.model} ${appraisal.trim}`, MARGIN_LEFT, y);
  y = drawLabelValue(page2, fonts, "VIN", appraisal.vin, MARGIN_LEFT, y);
  if (appraisal.licensePlate) {
    y = drawLabelValue(page2, fonts, "License Plate", `${appraisal.licensePlate} (${appraisal.stateOfRegistration})`, MARGIN_LEFT, y);
  }
  y = drawLabelValue(page2, fonts, "Mileage at Loss", `${appraisal.mileage.toLocaleString()} miles`, MARGIN_LEFT, y);
  y = drawLabelValue(page2, fonts, "Ownership", appraisal.isLeased ? "Leased" : "Owned", MARGIN_LEFT, y);
  const historyText = appraisal.accidentHistory === "clean" ? "No prior accidents" :
    appraisal.accidentHistory === "prior_damage" ? "Prior accident on record" : "Unknown";
  y = drawLabelValue(page2, fonts, "Prior History", historyText, MARGIN_LEFT, y);
  
  y -= 25;
  y = drawSectionHeader(page2, fonts, "INSURANCE INFORMATION", y);
  y = drawLabelValue(page2, fonts, "Insurance Company", appraisal.insuranceCompany, MARGIN_LEFT, y);
  y = drawLabelValue(page2, fonts, "Claim Number", appraisal.claimNumber, MARGIN_LEFT, y);
  if (appraisal.adjusterName) {
    y = drawLabelValue(page2, fonts, "Adjuster", appraisal.adjusterName, MARGIN_LEFT, y);
  }
  if (appraisal.adjusterEmail) {
    y = drawLabelValue(page2, fonts, "Adjuster Email", appraisal.adjusterEmail, MARGIN_LEFT, y);
  }
  if (appraisal.adjusterPhone) {
    y = drawLabelValue(page2, fonts, "Adjuster Phone", appraisal.adjusterPhone, MARGIN_LEFT, y);
  }
  y = drawLabelValue(page2, fonts, "Date of Loss", formatDate(appraisal.dateOfLoss), MARGIN_LEFT, y);
  
  drawPageFooter(page2, fonts, appraisal.ownerName, 2, 10);

  let page3 = pages[2];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page3, fonts, "PURPOSE OF REPORT", y);
  y = drawParagraph(page3, fonts, legal.purposeOfReport, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  y -= 30;
  y = drawSectionHeader(page3, fonts, "GEORGIA DIMINISHED VALUE STANDARD", y);
  y = drawParagraph(page3, fonts, legal.georgiaDvStandard, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  y -= 30;
  y = drawSectionHeader(page3, fonts, "KEY GEORGIA CASE LAW – MABRY v. STATE FARM", y);
  y = drawParagraph(page3, fonts, legal.mabrySummary, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  if (legal.permaLesseeSummary) {
    y -= 30;
    y = drawSectionHeader(page3, fonts, "LEASED VEHICLE – PERMA AD IDEAS v. MAYVILLE", y);
    y = drawParagraph(page3, fonts, legal.permaLesseeSummary, MARGIN_LEFT, y, CONTENT_WIDTH);
  }
  
  drawPageFooter(page3, fonts, appraisal.ownerName, 3, 10);

  let page4 = pages[3];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page4, fonts, "REPAIR CENTER INFORMATION", y);
  if (appraisal.repairCenterName) {
    y = drawLabelValue(page4, fonts, "Repair Center", appraisal.repairCenterName, MARGIN_LEFT, y);
  }
  if (appraisal.repairCenterAddress) {
    y = drawLabelValue(page4, fonts, "Address", appraisal.repairCenterAddress, MARGIN_LEFT, y);
  }
  if (appraisal.repairCenterPhone) {
    y = drawLabelValue(page4, fonts, "Phone", appraisal.repairCenterPhone, MARGIN_LEFT, y);
  }
  if (appraisal.repairDropOffDate) {
    y = drawLabelValue(page4, fonts, "Drop-off Date", formatDate(appraisal.repairDropOffDate), MARGIN_LEFT, y);
  }
  if (appraisal.repairPickupDate) {
    y = drawLabelValue(page4, fonts, "Pickup Date", formatDate(appraisal.repairPickupDate), MARGIN_LEFT, y);
  }
  if (appraisal.totalRepairCost) {
    y = drawLabelValue(page4, fonts, "Total Repair Cost", formatCurrency(appraisal.totalRepairCost), MARGIN_LEFT, y);
  }
  
  y -= 30;
  y = drawSectionHeader(page4, fonts, "DAMAGE LOCATION DIAGRAM", y);
  
  const diagramWidth = 120;
  const diagramHeight = 150;
  const diagramGap = 15;
  const startX = MARGIN_LEFT + 30;
  const startY = y - diagramHeight - 20;
  
  const damageCodes = appraisal.keyImpactAreas || [];
  
  await drawDamageOverlay(pdfDoc, page4, "top", startX, startY, diagramWidth, diagramHeight, damageCodes);
  page4.drawText("TOP", { x: startX + 45, y: startY - 15, size: 9, font: fonts.bold, color: TEXT_COLOR });
  
  await drawDamageOverlay(pdfDoc, page4, "front", startX + diagramWidth + diagramGap, startY + 50, diagramWidth, 100, damageCodes);
  page4.drawText("FRONT", { x: startX + diagramWidth + diagramGap + 40, y: startY + 35, size: 9, font: fonts.bold, color: TEXT_COLOR });
  
  await drawDamageOverlay(pdfDoc, page4, "side", startX + (diagramWidth + diagramGap) * 2, startY + 30, 160, 120, damageCodes);
  page4.drawText("SIDE", { x: startX + (diagramWidth + diagramGap) * 2 + 65, y: startY + 15, size: 9, font: fonts.bold, color: TEXT_COLOR });
  
  y = startY - 40;
  if (damageCodes.length > 0) {
    page4.drawText("Damaged Areas: " + formatDamageAreas(damageCodes), {
      x: MARGIN_LEFT,
      y,
      size: 10,
      font: fonts.regular,
      color: TEXT_COLOR,
    });
  }
  
  if (appraisal.damageDescription) {
    y -= 30;
    y = drawSectionHeader(page4, fonts, "DAMAGE DESCRIPTION", y);
    y = drawParagraph(page4, fonts, appraisal.damageDescription, MARGIN_LEFT, y, CONTENT_WIDTH);
  }
  
  drawPageFooter(page4, fonts, appraisal.ownerName, 4, 10);

  let page5 = pages[4];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page5, fonts, "THIRD-PARTY MARKET VALUATION", y);
  
  y -= 10;
  page5.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 80,
    width: CONTENT_WIDTH,
    height: 85,
    color: LIGHT_GRAY,
    borderColor: BORDER_GRAY,
    borderWidth: 1,
  });
  
  page5.drawText("Pre-Accident Value (Clean Retail):", {
    x: MARGIN_LEFT + 15,
    y: y - 25,
    size: 12,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  page5.drawText(formatCurrency(result.thirdParty.cleanRetailPreAccident), {
    x: PAGE_WIDTH - MARGIN_RIGHT - 15 - fonts.bold.widthOfTextAtSize(formatCurrency(result.thirdParty.cleanRetailPreAccident), 14),
    y: y - 25,
    size: 14,
    font: fonts.bold,
    color: rgb(0.06, 0.73, 0.51),
  });
  
  page5.drawText("Post-Accident Value (Rough Retail):", {
    x: MARGIN_LEFT + 15,
    y: y - 55,
    size: 12,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  page5.drawText(formatCurrency(result.thirdParty.roughRetailPostAccident), {
    x: PAGE_WIDTH - MARGIN_RIGHT - 15 - fonts.bold.widthOfTextAtSize(formatCurrency(result.thirdParty.roughRetailPostAccident), 14),
    y: y - 55,
    size: 14,
    font: fonts.bold,
    color: rgb(0.94, 0.27, 0.27),
  });
  
  y -= 110;
  
  try {
    const chartBuffer = await fetchQuickChart(
      result.thirdParty.cleanRetailPreAccident,
      result.thirdParty.roughRetailPostAccident
    );
    const chartImage = await pdfDoc.embedPng(chartBuffer);
    const chartWidth = 300;
    const chartHeight = 180;
    
    page5.drawImage(chartImage, {
      x: (PAGE_WIDTH - chartWidth) / 2,
      y: y - chartHeight - 20,
      width: chartWidth,
      height: chartHeight,
    });
    y -= chartHeight + 40;
  } catch (error) {
    console.error("Chart embedding failed:", error);
    y -= 20;
  }
  
  y -= 20;
  y = drawParagraph(page5, fonts, 
    `The above values were obtained from ${result.thirdParty.source}, a recognized third-party automotive valuation provider. ` +
    `The clean retail value represents the fair market value of the subject vehicle in undamaged condition. ` +
    `The rough retail value represents the estimated market value after repairs, accounting for the stigma associated with an accident history.`,
    MARGIN_LEFT, y, CONTENT_WIDTH
  );
  
  y -= 15;
  y = drawParagraph(page5, fonts, result.mileageBandDescription, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  drawPageFooter(page5, fonts, appraisal.ownerName, 5, 10);

  let page6 = pages[5];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page6, fonts, "COMPARABLE VEHICLE ANALYSIS", y);
  y = drawParagraph(page6, fonts, result.comparableFilterNotes, MARGIN_LEFT, y, CONTENT_WIDTH);
  y -= 20;
  
  if (result.comparables.length > 0) {
    const headers = ["#", "Dealer", "Vehicle", "Mileage", "Price"];
    const colWidths = [25, 150, 150, 70, 80];
    let tableX = MARGIN_LEFT;
    
    page6.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 18,
      width: CONTENT_WIDTH,
      height: 22,
      color: BRAND_COLOR,
    });
    
    headers.forEach((header, i) => {
      page6.drawText(header, {
        x: tableX + 5,
        y: y - 12,
        size: 9,
        font: fonts.bold,
        color: WHITE,
      });
      tableX += colWidths[i];
    });
    
    y -= 22;
    
    result.comparables.forEach((comp, idx) => {
      const rowY = y - (idx + 1) * 35;
      
      if (idx % 2 === 0) {
        page6.drawRectangle({
          x: MARGIN_LEFT,
          y: rowY - 15,
          width: CONTENT_WIDTH,
          height: 35,
          color: LIGHT_GRAY,
        });
      }
      
      tableX = MARGIN_LEFT;
      const rowData = [
        String(idx + 1),
        comp.sourceDealerName.substring(0, 25),
        `${comp.year} ${comp.make} ${comp.model}`.substring(0, 25),
        comp.mileage.toLocaleString(),
        formatCurrency(comp.listedPrice),
      ];
      
      rowData.forEach((cell, i) => {
        page6.drawText(cell, {
          x: tableX + 5,
          y: rowY,
          size: 9,
          font: fonts.regular,
          color: TEXT_COLOR,
        });
        tableX += colWidths[i];
      });
    });
    
    y -= (result.comparables.length + 1) * 35 + 20;
    
    page6.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 5,
      width: CONTENT_WIDTH,
      height: 30,
      color: rgb(0.9, 0.95, 0.9),
      borderColor: rgb(0.06, 0.73, 0.51),
      borderWidth: 1,
    });
    
    page6.drawText("Average Retail Price of Comparables:", {
      x: MARGIN_LEFT + 15,
      y: y + 5,
      size: 11,
      font: fonts.bold,
      color: TEXT_COLOR,
    });
    page6.drawText(formatCurrency(result.comparablesAvgRetail), {
      x: PAGE_WIDTH - MARGIN_RIGHT - 15 - fonts.bold.widthOfTextAtSize(formatCurrency(result.comparablesAvgRetail), 14),
      y: y + 5,
      size: 14,
      font: fonts.bold,
      color: rgb(0.06, 0.73, 0.51),
    });
  } else {
    y = drawParagraph(page6, fonts, 
      "No comparable vehicles were found matching the search criteria. The valuation relies solely on third-party pricing data.",
      MARGIN_LEFT, y, CONTENT_WIDTH
    );
  }
  
  drawPageFooter(page6, fonts, appraisal.ownerName, 6, 10);

  let page7 = pages[6];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page7, fonts, "GEORGIA INSURANCE COMMISSIONER DIRECTIVE 08-P&C-2", y);
  y = drawParagraph(page7, fonts, legal.directiveSummary, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  y -= 30;
  page7.drawText("Key Points:", {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fonts.bold,
    color: BRAND_COLOR,
  });
  y -= 20;
  
  const bulletPoints = [
    "The Department has not endorsed any specific formula for calculating diminished value.",
    "Each claim must be evaluated on its own facts and circumstances.",
    "Insurers should not imply that a single formula result is the definitive liability amount.",
    "This report follows that guidance by relying on real market data and transparent analysis.",
  ];
  
  bulletPoints.forEach(point => {
    page7.drawText("•", { x: MARGIN_LEFT, y, size: 10, font: fonts.regular, color: ACCENT_COLOR });
    y = drawParagraph(page7, fonts, point, MARGIN_LEFT + 15, y, CONTENT_WIDTH - 15);
    y -= 10;
  });
  
  drawPageFooter(page7, fonts, appraisal.ownerName, 7, 10);

  let page8 = pages[7];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page8, fonts, "RESULTS OF EVALUATION", y);
  
  const narrative1 = `Based on the comprehensive analysis conducted, it is the professional opinion of this appraiser that the subject vehicle, ` +
    `a ${appraisal.year} ${appraisal.make} ${appraisal.model} ${appraisal.trim}, VIN ${appraisal.vin}, has sustained inherent diminished value ` +
    `as a result of the collision that occurred on ${formatDate(appraisal.dateOfLoss)} in the State of Georgia.`;
  
  y = drawParagraph(page8, fonts, narrative1, MARGIN_LEFT, y, CONTENT_WIDTH);
  y -= 15;
  
  const narrative2 = `This analysis considered the vehicle's year, make, model, and trim level; current mileage of ${appraisal.mileage.toLocaleString()} miles; ` +
    `the location and severity of damage; third-party market valuation data from ${result.thirdParty.source}; ` +
    `and comparable retail listings in the Georgia market.`;
  
  y = drawParagraph(page8, fonts, narrative2, MARGIN_LEFT, y, CONTENT_WIDTH);
  y -= 15;
  
  const narrative3 = `Diminished value is the difference between the fair market value of the vehicle immediately before the loss ` +
    `and immediately after repairs are completed. This loss in value exists regardless of whether the owner intends to sell the vehicle, ` +
    `as it represents a real economic harm that occurs at the moment of the collision.`;
  
  y = drawParagraph(page8, fonts, narrative3, MARGIN_LEFT, y, CONTENT_WIDTH);
  y -= 30;
  
  page8.drawRectangle({
    x: MARGIN_LEFT + 50,
    y: y - 50,
    width: CONTENT_WIDTH - 100,
    height: 60,
    color: rgb(0.9, 0.95, 0.9),
    borderColor: rgb(0.06, 0.73, 0.51),
    borderWidth: 2,
  });
  
  page8.drawText("CALCULATED DIMINISHED VALUE", {
    x: MARGIN_LEFT + 70,
    y: y - 20,
    size: 12,
    font: fonts.bold,
    color: TEXT_COLOR,
  });
  
  const dvText = formatCurrency(result.diminishedValue);
  page8.drawText(dvText, {
    x: (PAGE_WIDTH - fonts.bold.widthOfTextAtSize(dvText, 28)) / 2,
    y: y - 45,
    size: 28,
    font: fonts.bold,
    color: rgb(0.06, 0.73, 0.51),
  });
  
  drawPageFooter(page8, fonts, appraisal.ownerName, 8, 10);

  let page9 = pages[8];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page9, fonts, "REPORT VALUES – DIMINISHED VALUE CALCULATION", y);
  y -= 10;
  
  const calcRows = [
    ["Third-Party Pre-Accident (Clean Retail)", formatCurrency(result.thirdParty.cleanRetailPreAccident)],
    ["Comparables Average Retail Value", formatCurrency(result.comparablesAvgRetail)],
    ["Final Pre-Accident Value (Average)", formatCurrency(result.finalPreAccidentValue)],
    ["Third-Party Post-Accident (Rough Retail)", formatCurrency(result.postAccidentValue)],
  ];
  
  page9.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 160,
    width: CONTENT_WIDTH,
    height: 165,
    color: LIGHT_GRAY,
    borderColor: BORDER_GRAY,
    borderWidth: 1,
  });
  
  let rowY = y - 15;
  calcRows.forEach((row, idx) => {
    page9.drawText(row[0], {
      x: MARGIN_LEFT + 15,
      y: rowY,
      size: 11,
      font: fonts.regular,
      color: TEXT_COLOR,
    });
    page9.drawText(row[1], {
      x: PAGE_WIDTH - MARGIN_RIGHT - 15 - fonts.bold.widthOfTextAtSize(row[1], 12),
      y: rowY,
      size: 12,
      font: fonts.bold,
      color: TEXT_COLOR,
    });
    rowY -= 30;
    
    if (idx < calcRows.length - 1) {
      page9.drawLine({
        start: { x: MARGIN_LEFT + 10, y: rowY + 15 },
        end: { x: PAGE_WIDTH - MARGIN_RIGHT - 10, y: rowY + 15 },
        color: BORDER_GRAY,
        thickness: 1,
      });
    }
  });
  
  rowY -= 10;
  page9.drawLine({
    start: { x: MARGIN_LEFT + 10, y: rowY + 15 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT - 10, y: rowY + 15 },
    color: ACCENT_COLOR,
    thickness: 2,
  });
  
  page9.drawText("TOTAL DIMINISHED VALUE", {
    x: MARGIN_LEFT + 15,
    y: rowY - 10,
    size: 12,
    font: fonts.bold,
    color: BRAND_COLOR,
  });
  page9.drawText(formatCurrency(result.diminishedValue), {
    x: PAGE_WIDTH - MARGIN_RIGHT - 15 - fonts.bold.widthOfTextAtSize(formatCurrency(result.diminishedValue), 16),
    y: rowY - 10,
    size: 16,
    font: fonts.bold,
    color: rgb(0.06, 0.73, 0.51),
  });
  
  y -= 200;
  y = drawParagraph(page9, fonts, 
    "Diminished value is calculated as the difference between the final pre-accident value (average of third-party clean retail and comparables average) " +
    "and the third-party post-accident rough retail value.",
    MARGIN_LEFT, y, CONTENT_WIDTH
  );
  
  drawPageFooter(page9, fonts, appraisal.ownerName, 9, 10);

  let page10 = pages[9];
  y = PAGE_HEIGHT - MARGIN_TOP;
  
  y = drawSectionHeader(page10, fonts, "APPRAISER CERTIFICATION", y);
  y = drawParagraph(page10, fonts, legal.certificationText, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  y -= 50;
  page10.drawLine({
    start: { x: MARGIN_LEFT + 50, y },
    end: { x: MARGIN_LEFT + 250, y },
    color: TEXT_COLOR,
    thickness: 1,
  });
  page10.drawText("Appraiser Signature", {
    x: MARGIN_LEFT + 100,
    y: y - 15,
    size: 9,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page10.drawLine({
    start: { x: PAGE_WIDTH - MARGIN_RIGHT - 200, y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT - 50, y },
    color: TEXT_COLOR,
    thickness: 1,
  });
  page10.drawText("Date", {
    x: PAGE_WIDTH - MARGIN_RIGHT - 140,
    y: y - 15,
    size: 9,
    font: fonts.regular,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  y -= 60;
  y = drawSectionHeader(page10, fonts, "DISCLAIMER", y);
  y = drawParagraph(page10, fonts, legal.disclaimerText, MARGIN_LEFT, y, CONTENT_WIDTH);
  
  drawPageFooter(page10, fonts, appraisal.ownerName, 10, 10);

  return Buffer.from(await pdfDoc.save());
}
