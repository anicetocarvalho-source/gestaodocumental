import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { validatePublic, type PublicSealResponse } from "@/lib/api/sealsPublic";
import { usePageMeta } from "@/lib/hooks/usePageMeta";
import { StateBanner } from "@/components/seals/public/StateBanner";
import { SealMetadataCard } from "@/components/seals/public/SealMetadataCard";
import { PdfIntegrityCheck } from "@/components/seals/public/PdfIntegrityCheck";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PublicValidate() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicSealResponse | null>(null);

  const protocol = data?.seal?.protocol_number;
  usePageMeta({
    title: protocol
      ? `Validação de Selo ${protocol} · NODIDOC`
      : "Validação de Selo · NODIDOC",
    description:
      "Verificação pública de autenticidade de documento institucional via NODIDOC.",
    noindex: true,
    lang: "pt-PT",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token || !UUID_RE.test(token)) {
        setData({ valid: false, error: "Selo não encontrado" });
        setLoading(false);
        return;
      }
      try {
        const res = await validatePublic(token);
        if (active) setData(res);
      } catch {
        if (active) setData({ valid: false, error: "Selo não encontrado" });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div
      className="min-h-screen bg-white text-[#1A2332]"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* Header */}
      <header style={{ backgroundColor: "#0A1F44" }} className="text-white">
        <div className="max-w-[720px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
          <div
            className="text-2xl sm:text-3xl tracking-wide"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
          >
            NODIDOC
          </div>
          <div className="text-xs sm:text-sm mt-1" style={{ color: "#C9A961" }}>
            Portal Público de Validação
          </div>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-5 sm:px-6 py-6 sm:py-10 space-y-6">
        {loading && <LoadingState />}
        {!loading && data && <ResultView token={token!} data={data} />}

        <p className="text-xs text-slate-500 leading-relaxed pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
          Este selo confirma o registo administrativo do documento na instituição emissora.
          Para actos que exijam assinatura electrónica qualificada nos termos da Lei n.º 1/11,
          consulte os serviços competentes.
        </p>
      </main>

      <footer className="max-w-[720px] mx-auto px-5 sm:px-6 py-6 text-center text-xs text-slate-500">
        NODIDOC · Sistema de Gestão Documental
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-600">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
      <p className="mt-3 text-sm">A verificar selo...</p>
    </div>
  );
}

function ResultView({ token, data }: { token: string; data: PublicSealResponse }) {
  // Not found
  if (!data.seal) {
    return (
      <div
        className="rounded-md border bg-slate-50 p-6 sm:p-8 text-center"
        style={{ borderColor: "#E5E7EB" }}
      >
        <h1
          className="text-xl sm:text-2xl text-[#1A2332]"
          style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
        >
          Selo não encontrado
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          O código verificado pode ser inválido ou ter sido removido. Se obteve este código de
          uma etiqueta NODIDOC, contacte a instituição emissora.
        </p>
      </div>
    );
  }

  const cancelled = data.status === "cancelled";

  if (cancelled) {
    const cancelledAt = data.seal.cancelled_at
      ? new Date(data.seal.cancelled_at).toLocaleString("pt-PT", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : null;
    return (
      <>
        <StateBanner
          variant="danger"
          title="Selo cancelado"
          subtitle={
            cancelledAt
              ? `Cancelado em ${cancelledAt}.`
              : "Este selo foi cancelado pela instituição emissora."
          }
        />
        <SealMetadataCard seal={data.seal} faded />
      </>
    );
  }

  return (
    <>
      <StateBanner
        variant="success"
        title="Selo válido"
        subtitle="Este registo foi efectuado por uma instituição utilizadora do NODIDOC."
      />
      <SealMetadataCard seal={data.seal} />
      {data.seal.has_pdf_hash && (
        <PdfIntegrityCheck token={token} expectedHashPrefix={data.seal.pdf_hash_prefix} />
      )}
    </>
  );
}
