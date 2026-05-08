/**
 * Fallback: imprime via diálogo de impressão do navegador,
 * gerando uma folha A4 com 8 etiquetas (grelha 2×4, formato L7165).
 *
 * Cada etiqueta: 88,9 × 67,7 mm. Renderização HTML/CSS standalone.
 * QR gerado como SVG inline pelo helper sealQrSvg.
 */
import type { Seal } from "@/lib/api/seals";
import { toString as qrToString } from "qrcode";

const TYPE_LABEL: Record<string, string> = {
  ENT: "ENTRADA",
  SAI: "SAÍDA",
  INT: "INTERNO",
};

interface BrowserPrintInput {
  seal: Pick<Seal, "protocol_number" | "protocol_type" | "created_at" | "pdf_hash" | "qr_payload">;
  organizationName: string;
  isDuplicate: boolean;
  copies: number;
}

async function buildLabelHTML(input: BrowserPrintInput): Promise<string> {
  const { seal, organizationName, isDuplicate } = input;
  const qrSvg = await qrToString(seal.qr_payload, {
    type: "svg",
    margin: 0,
    color: { dark: "#0A1F44", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  const date = new Date(seal.created_at);
  const dateStr = isNaN(date.getTime())
    ? "—"
    : `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const hash8 = seal.pdf_hash ? seal.pdf_hash.slice(0, 8) : "—";
  const typeLabel = TYPE_LABEL[seal.protocol_type] ?? seal.protocol_type;

  return `
    <div class="label">
      <div class="header">
        <span class="org">${escapeHtml(organizationName)}</span>
        <span class="type">${typeLabel}</span>
      </div>
      <div class="body">
        <div class="qr">${qrSvg}</div>
        <div class="meta">
          <div><span class="k">PROTOCOLO</span><span class="v proto">${escapeHtml(seal.protocol_number)}</span></div>
          <div><span class="k">DATA</span><span class="v">${dateStr}</span></div>
          <div><span class="k">HASH</span><span class="v">${hash8}</span></div>
        </div>
      </div>
      <div class="footer">VALIDAÇÃO · valida.nodidoc.ao</div>
      ${isDuplicate ? '<div class="duplicate">DUPLICADO</div>' : ""}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export async function printViaBrowser(input: BrowserPrintInput): Promise<void> {
  const labelHtml = await buildLabelHTML(input);
  const total = Math.max(1, Math.min(80, input.copies));
  const labels = Array.from({ length: total }, () => labelHtml).join("");

  const html = `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8" />
<title>Impressão de etiquetas — NODIDOC</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #0A1F44;
  }
  .sheet {
    display: grid;
    grid-template-columns: repeat(2, 88.9mm);
    grid-template-rows: repeat(4, 67.7mm);
    gap: 0;
    justify-content: center;
  }
  .label {
    width: 88.9mm; height: 67.7mm;
    padding: 4mm;
    position: relative;
    border: 1px dashed #cbd5e1;
    overflow: hidden;
  }
  .header { display: flex; justify-content: space-between; align-items: center; font-size: 8pt; }
  .header .org { font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; max-width: 60mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .header .type { font-weight: 700; background: #C9A961; color: #0A1F44; padding: 1mm 2mm; border-radius: 1mm; font-size: 7pt; }
  .body { display: flex; gap: 3mm; margin-top: 3mm; height: 45mm; }
  .qr { width: 45mm; height: 45mm; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .meta { flex: 1; display: flex; flex-direction: column; justify-content: space-between; font-size: 9pt; }
  .meta .k { display: block; font-size: 7pt; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta .v { display: block; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .meta .proto { font-weight: 700; font-size: 12pt; }
  .footer { position: absolute; bottom: 3mm; left: 0; right: 0; text-align: center; font-size: 7pt; opacity: 0.7; letter-spacing: 0.05em; }
  .duplicate {
    position: absolute; top: 18mm; right: -10mm;
    transform: rotate(-30deg);
    color: rgba(184, 58, 58, 0.45);
    font-weight: 800; font-size: 18pt; letter-spacing: 0.2em;
    pointer-events: none;
  }
  @media print { .label { border-color: transparent; } }
</style>
</head>
<body>
<div class="sheet">${labels}</div>
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 100);
  });
  window.addEventListener('afterprint', function () { window.close(); });
</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    throw new Error(
      "O navegador bloqueou a janela de impressão. Permita popups para este site.",
    );
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
