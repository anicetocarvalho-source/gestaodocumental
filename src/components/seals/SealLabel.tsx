import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface SealLabelProps {
  protocolNumber: string;
  protocolType: "ENT" | "SAI" | "INT";
  createdAt: Date | string;
  pdfHashTruncated: string | null;
  organizationName: string;
  qrPayload: string;
  duplicate?: boolean;
  validationBaseUrl?: string;
  className?: string;
}

const TYPE_LABEL: Record<SealLabelProps["protocolType"], string> = {
  ENT: "ENTRADA",
  SAI: "SAÍDA",
  INT: "INTERNO",
};

export function SealLabel({
  protocolNumber,
  protocolType,
  createdAt,
  pdfHashTruncated,
  organizationName,
  qrPayload,
  duplicate = false,
  validationBaseUrl = "valida.nodidoc.ao",
  className,
}: SealLabelProps) {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const dateStr = isNaN(date.getTime())
    ? "—"
    : format(date, "dd/MM/yyyy HH:mm", { locale: pt });

  return (
    <div
      className={cn(
        "seal-label relative bg-white text-[hsl(218,73%,15%)] border border-dashed border-[hsl(215,41%,80%)]",
        "shadow-sm overflow-hidden",
        className,
      )}
      style={{ width: "50mm", height: "30mm", padding: "1.5mm" }}
    >
      <style>{`
        @media print {
          @page { size: 50mm 30mm; margin: 0; }
          body { margin: 0; }
          .seal-label { box-shadow: none !important; border-color: #ccc !important; }
        }
      `}</style>

      {/* Topo */}
      <div className="flex items-center justify-between" style={{ fontSize: "5pt" }}>
        <span className="font-semibold uppercase tracking-wide truncate max-w-[34mm]">
          {organizationName || "—"}
        </span>
        <span
          className="font-bold rounded-sm px-1"
          style={{
            fontSize: "5pt",
            background: "hsl(42, 47%, 59%)",
            color: "hsl(218, 73%, 15%)",
          }}
        >
          {TYPE_LABEL[protocolType]}
        </span>
      </div>

      {/* Corpo */}
      <div className="flex gap-1.5 mt-1" style={{ height: "20mm" }}>
        {/* QR */}
        <div
          className="flex items-center justify-center bg-[hsl(215,41%,94%)] rounded-sm"
          style={{ width: "20mm", height: "20mm" }}
        >
          {qrPayload ? (
            <QRCodeSVG
              value={qrPayload}
              size={68}
              level="M"
              bgColor="#ffffff"
              fgColor="#0A1F44"
              includeMargin={false}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[6pt] text-muted-foreground"
              aria-label="QR pendente"
            >
              QR
            </div>
          )}
        </div>

        {/* Dados */}
        <div className="flex-1 flex flex-col justify-between" style={{ fontSize: "6pt" }}>
          <div>
            <div className="uppercase tracking-wide opacity-60" style={{ fontSize: "4.5pt" }}>
              Protocolo
            </div>
            <div className="font-mono font-bold leading-tight" style={{ fontSize: "7.5pt" }}>
              {protocolNumber}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wide opacity-60" style={{ fontSize: "4.5pt" }}>
              Data
            </div>
            <div className="font-mono leading-tight" style={{ fontSize: "6pt" }}>
              {dateStr}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wide opacity-60" style={{ fontSize: "4.5pt" }}>
              Hash
            </div>
            <div className="font-mono leading-tight" style={{ fontSize: "6pt" }}>
              {pdfHashTruncated ? pdfHashTruncated : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div
        className="text-center mt-0.5 opacity-70 truncate"
        style={{ fontSize: "4.5pt", letterSpacing: "0.05em" }}
      >
        VALIDAÇÃO · {validationBaseUrl}
      </div>

      {/* Marca DUPLICADO */}
      {duplicate && (
        <div
          className="absolute pointer-events-none select-none font-extrabold tracking-widest"
          style={{
            top: "5mm",
            right: "-6mm",
            transform: "rotate(-45deg)",
            color: "rgba(220, 38, 38, 0.45)",
            fontSize: "9pt",
          }}
        >
          DUPLICADO
        </div>
      )}
    </div>
  );
}
