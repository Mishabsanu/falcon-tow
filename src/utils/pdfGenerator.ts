import { PDFDocument, StandardFonts } from "pdf-lib";

export async function generateJobCardPDF(jobCard: any) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([600, 800]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 750;

  page.drawText("JOB CARD", {
    x: 240,
    y,
    size: 18,
    font,
  });

  y -= 40;

  page.drawText(`Job Card No: ${jobCard.jobCardNumber}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 20;

  page.drawText(`Vehicle ID: ${jobCard.vehicleId}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 20;

  page.drawText(`Customer ID: ${jobCard.customerId}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 30;

  page.drawText("Status:", {
    x: 50,
    y,
    size: 14,
    font,
  });

  y -= 20;

  page.drawText(jobCard.status, {
    x: 50,
    y,
    size: 12,
    font,
  });

  return await pdfDoc.save();
}
