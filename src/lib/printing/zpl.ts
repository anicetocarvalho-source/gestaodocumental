/**
 * Geração de ZPL (Zebra Programming Language) para etiquetas 50×30mm @ 203 dpi.
 * 1 mm = 8 dots → área útil 400 × 240 dots.
 *
 * Multi-cópias usa ^PQ (mais eficiente que repetir o ^XA…^XZ).
 * Caracteres de controlo ZPL (^ ~ \) são escapados nos campos de texto.
 */
import type { Seal } from "@/lib/api/seals";
import type { PrintOptions } from "./types";

function escapeZPL(value: string | null | undefined): string {
  if (!value) return "";
  // ^ e ~ são prefixos de comandos; \ é escape interno em ZPL.
  return String(value).replace(/[\\^~]/g, " ").replace(/[\r\n]+/g, " ").trim();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface GenerateZPLInput {
  seal: Pick<Seal, "protocol_number" | "qr_payload" | "pdf_hash" | "created_at">;
  organizationName: string;
  options: PrintOptions;
}

export function generateZPL({ seal, organizationName, options }: GenerateZPLInput): string {
  const { isDuplicate, copies, speed, density } = options;
  const org = escapeZPL(organizationName).slice(0, 40) || "NODIDOC";
  const proto = escapeZPL(seal.protocol_number);
  const qr = escapeZPL(seal.qr_payload);
  const date = formatDate(seal.created_at);
  const hash8 = seal.pdf_hash ? seal.pdf_hash.slice(0, 8) : "—";

  const lines: string[] = [
    "^XA",
    "^PW400",
    "^LL240",
    "^LH0,0",
    "^CI28", // UTF-8
    `^PR${speed},${speed}`,
    `^MD${Math.max(0, Math.min(30, density))}`,
    // Cabeçalho — organização centrada
    `^FO0,12^A0N,18,18^FB400,1,0,C^FD${org}^FS`,
    // Linha decorativa
    "^FO20,38^GB360,2,2^FS",
    // QR à esquerda (modelo 2, magnification 4)
    `^FO20,55^BQN,2,4^FDLA,${qr}^FS`,
    // Bloco de texto à direita
    "^FO180,58^A0N,12,12^FDPROTOCOLO^FS",
    `^FO180,72^A0N,22,22^FD${proto}^FS`,
    "^FO180,102^A0N,12,12^FDDATA^FS",
    `^FO180,116^A0N,16,16^FD${date}^FS`,
    "^FO180,142^A0N,12,12^FDHASH^FS",
    `^FO180,156^A0N,16,16^FD${hash8}^FS`,
    // Rodapé centrado
    "^FO0,210^A0N,14,14^FB400,1,0,C^FDvalida.nodidoc.ao^FS",
  ];

  if (isDuplicate) {
    // Marca diagonal "DUPLICADO" (rotação 270º via ^FW)
    lines.push("^FO40,200^A0N,30,30^FWR^FDDUPLICADO^FS");
  }

  lines.push(`^PQ${Math.max(1, Math.min(10, copies))},0,1,Y`);
  lines.push("^XZ");

  return lines.join("\n");
}
