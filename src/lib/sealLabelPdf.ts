import jsPDF from "jspdf";
import type { PhysicalSeal } from "@/hooks/usePhysicalSeals";

/**
 * Gera um PDF A6 com a etiqueta do selo físico (protocolo + QR).
 * Usa o <canvas> do QRCode já renderizado na página para embutir a imagem.
 */
export function generateSealLabelPdf(
  seal: PhysicalSeal,
  qrCanvas: HTMLCanvasElement,
  organizationName?: string
) {
  // A6 paisagem (148 x 105 mm) — bom tamanho para colar em ofícios A4
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a6" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 6;

  // Moldura
  doc.setDrawColor(40);
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    (organizationName ?? "NODIDOC").toUpperCase(),
    margin + 3,
    margin + 5
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("SELO FÍSICO DE RASTREABILIDADE", margin + 3, margin + 9);

  doc.setLineWidth(0.2);
  doc.line(margin + 3, margin + 11, pageW - margin - 3, margin + 11);

  // Coluna esquerda — dados
  const leftX = margin + 3;
  let y = margin + 17;
  const labelLine = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), leftX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value || "—", 70);
    doc.text(lines, leftX, y + 4);
    y += 4 + lines.length * 3.6 + 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(seal.protocol_number, leftX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `Tipo: ${seal.protocol_type}   ·   Data: ${new Date(
      seal.created_at
    ).toLocaleDateString("pt-PT")}`,
    leftX,
    y
  );
  y += 4;

  labelLine("Assunto", seal.subject);
  if (seal.sender_name) labelLine("Remetente", seal.sender_name);
  if (seal.recipient_name) labelLine("Destinatário", seal.recipient_name);

  // QR à direita
  const qrSize = 45;
  const qrX = pageW - margin - qrSize - 3;
  const qrY = margin + 14;
  const dataUrl = qrCanvas.toDataURL("image/png");
  doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Token sob o QR
  doc.setFontSize(6);
  doc.setFont("courier", "normal");
  const tokenLines = doc.splitTextToSize(seal.validation_token, qrSize);
  doc.text(tokenLines, qrX + qrSize / 2, qrY + qrSize + 3, { align: "center" });

  // Rodapé — URL de validação
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.text(
    `Valide em: ${seal.qr_payload}`,
    margin + 3,
    pageH - margin - 3,
    { maxWidth: pageW - margin * 2 - 6 }
  );

  doc.save(`etiqueta-${seal.protocol_number}.pdf`);
}
