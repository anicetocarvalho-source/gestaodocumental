import type { PublicSealResponse } from "@/lib/api/sealsPublic";

const TYPE_LABEL: Record<string, string> = {
  ENT: "Entrada",
  SAI: "Saída",
  INT: "Circulação Interna",
};

interface Props {
  seal: NonNullable<PublicSealResponse["seal"]>;
  faded?: boolean;
}

export function SealMetadataCard({ seal, faded }: Props) {
  const dt = new Date(seal.created_at);
  const dtStr = dt.toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" });
  return (
    <div
      className={`rounded-md border bg-white p-5 sm:p-6 ${faded ? "opacity-60" : ""}`}
      style={{ borderColor: "#E5E7EB" }}
    >
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-[#1A2332]">
        <Field label="Protocolo">
          <span className="font-mono font-bold text-base sm:text-lg" style={{ color: "#0A1F44" }}>
            {seal.protocol_number}
          </span>
        </Field>
        <Field label="Tipo">{TYPE_LABEL[seal.protocol_type] ?? seal.protocol_type}</Field>
        <Field label="Organização emissora">{seal.organization_name ?? "—"}</Field>
        <Field label="Assunto" wide>
          {seal.subject || seal.document_title || "—"}
        </Field>
        <Field label="Data e hora de registo">{dtStr}</Field>
        <Field label="Documento associado">
          {seal.has_pdf_hash ? "Sim" : "Não"}
        </Field>
        {seal.has_pdf_hash && seal.pdf_hash_prefix && (
          <Field label="Hash (prefixo)">
            <code className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded">
              {seal.pdf_hash_prefix}
            </code>
          </Field>
        )}
      </dl>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-3" : ""}>
      <dt className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</dt>
      <dd className="mt-0.5 text-sm sm:text-base">{children}</dd>
    </div>
  );
}
