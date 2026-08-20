import jsPDF from "jspdf";
import type { StorageLocation } from "@/hooks/usePhysicalArchive";
import { locationTypeLabels } from "@/hooks/usePhysicalArchive";

/**
 * Gera um PDF A6 com a etiqueta de um contentor de arquivo físico
 * (código, designação, caminho completo e QR).
 */
export function generateLocationLabelPdf(
  location: StorageLocation,
  qrCanvas: HTMLCanvasElement,
  organizationName?: string,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a6" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 6;

  doc.setDrawColor(40);
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text((organizationName ?? "NODIDOC").toUpperCase(), margin + 3, margin + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("ARQUIVO FÍSICO — LOCALIZAÇÃO", margin + 3, margin + 9);

  doc.setLineWidth(0.2);
  doc.line(margin + 3, margin + 11, pageW - margin - 3, margin + 11);

  const leftX = margin + 3;
  let y = margin + 19;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(location.code, leftX, y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(location.name.slice(0, 34), leftX, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(locationTypeLabels[location.location_type], leftX, y);

  y += 5;
  const pathLines = doc.splitTextToSize(location.path ?? location.name, pageW - margin * 2 - 45);
  doc.setFontSize(6.5);
  doc.text(pathLines.slice(0, 3), leftX, y);

  if (location.capacity) {
    doc.setFontSize(6.5);
    doc.text(`Capacidade: ${location.capacity}`, leftX, pageH - margin - 6);
  }

  // QR à direita
  const qrSize = 36;
  const qrX = pageW - margin - qrSize - 4;
  const qrY = margin + 15;
  doc.addImage(qrCanvas.toDataURL("image/png"), "PNG", qrX, qrY, qrSize, qrSize);

  doc.save(`etiqueta-${location.code}.pdf`);
}
