import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { sha256Hex, validatePublic } from "@/lib/api/sealsPublic";

interface Props {
  token: string;
  expectedHashPrefix: string | null;
}

const MAX_BYTES = 25 * 1024 * 1024;

export function PdfIntegrityCheck({ token, expectedHashPrefix }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ match: boolean; uploadedPrefix: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    if (file.type !== "application/pdf") {
      setError("Apenas ficheiros PDF são aceites.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ficheiro excede o limite de 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const hash = await sha256Hex(file);
      const res = await validatePublic(token, hash);
      const match = res.pdf_hash_match === true;
      setResult({ match, uploadedPrefix: hash.slice(0, 8) });
    } catch {
      setError("Não foi possível verificar o ficheiro. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="rounded-md border bg-white p-5 sm:p-6" style={{ borderColor: "#E5E7EB" }}>
      <h2 className="text-base sm:text-lg font-semibold text-[#1A2332]" style={{ fontFamily: "Georgia, serif" }}>
        Verificar integridade do conteúdo
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Se possui o PDF original do documento, pode confirmar que não foi alterado desde o
        registo. O ficheiro nunca é armazenado — apenas comparado localmente no seu dispositivo.
      </p>

      {!result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`mt-4 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "bg-slate-50" : ""
          }`}
          style={{ borderColor: dragOver ? "#0A1F44" : "#CBD5E1" }}
        >
          <Upload className="h-8 w-8 mx-auto text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm text-slate-600">
            Arraste o PDF para aqui ou
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label="Seleccionar ficheiro PDF"
            className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#0A1F44" }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "A verificar..." : "Seleccionar ficheiro"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <p className="mt-3 text-xs text-slate-500">PDF · máximo 25 MB</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border p-3 text-sm"
          style={{ borderColor: "#B83A3A", color: "#B83A3A", backgroundColor: "#FEF2F2" }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div
            role="status"
            className="rounded-md p-4 text-white flex items-start gap-3"
            style={{ backgroundColor: result.match ? "#1F7A5C" : "#B83A3A" }}
          >
            {result.match ? (
              <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
            )}
            <div className="text-sm sm:text-base">
              {result.match
                ? "Conteúdo íntegro — o PDF carregado corresponde ao registado."
                : "Conteúdo divergente — o PDF carregado NÃO corresponde ao original. Pode ter sido modificado ou ser um documento diferente."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="uppercase tracking-wide text-slate-500">Hash registado</div>
              <code className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                {expectedHashPrefix ?? "—"}
              </code>
            </div>
            <div>
              <div className="uppercase tracking-wide text-slate-500">Hash do PDF carregado</div>
              <code className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                {result.uploadedPrefix}
              </code>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-sm underline text-slate-600 hover:text-slate-900"
          >
            Verificar outro ficheiro
          </button>
        </div>
      )}
    </section>
  );
}
