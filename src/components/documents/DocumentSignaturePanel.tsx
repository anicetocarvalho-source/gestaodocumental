import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSignature, ShieldCheck, ShieldAlert, Lock, Link2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentApprovals } from "@/hooks/useDocumentApprovals";
import {
  useDocumentSignatures,
  useSignDocument,
  useVerifySignatureChain,
  type SignatureChainCheck,
} from "@/hooks/useDocumentSignatures";
import { DocumentSignatureModal, type SignatureData } from "./DocumentSignatureModal";

interface Props {
  documentId: string;
  documentTitle?: string;
}

export function DocumentSignaturePanel({ documentId, documentTitle }: Props) {
  const { profile } = useAuth();
  const { data: signatures = [], isLoading } = useDocumentSignatures(documentId);
  const { data: approvals = [] } = useDocumentApprovals(documentId);
  const signDocument = useSignDocument();
  const verifyChain = useVerifySignatureChain(documentId);

  const [modalOpen, setModalOpen] = useState(false);
  const [checks, setChecks] = useState<SignatureChainCheck[] | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === "pendente");
  const blockedApprovals = approvals.filter((a) => a.status === "rejeitado" || a.status === "devolvido");
  const canSign = pendingApprovals.length === 0 && blockedApprovals.length === 0;

  const lastApproval = useMemo(
    () => [...approvals].reverse().find((a) => a.status === "aprovado") ?? null,
    [approvals],
  );

  const handleSign = async (data: SignatureData) => {
    await signDocument.mutateAsync({
      documentId,
      signatureImage: data.signatureImage,
      signerName: data.signerName,
      signerRole: data.signerRole,
      approvalId: lastApproval?.id ?? null,
    });
    setChecks(null);
  };

  const handleVerify = async () => {
    const result = await verifyChain.mutateAsync();
    setChecks(result);
    const invalid = result.filter((r) => !r.is_chain_valid).length;
    if (invalid === 0) {
      toast.success("Cadeia de assinaturas íntegra");
    } else {
      toast.error(`${invalid} assinatura(s) com integridade comprometida`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-5 w-5 text-primary" />
          Assinatura Electrónica
          {signatures.length > 0 && <Badge variant="secondary">{signatures.length}</Badge>}
        </CardTitle>
        <div className="flex gap-2">
          {signatures.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifyChain.isPending}>
              <ShieldCheck className="mr-1 h-4 w-4" />
              {verifyChain.isPending ? "A verificar..." : "Verificar"}
            </Button>
          )}
          <Button size="sm" onClick={() => setModalOpen(true)} disabled={!canSign}>
            <FileSignature className="mr-1 h-4 w-4" />
            Assinar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canSign && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              {pendingApprovals.length > 0
                ? `Assinatura bloqueada: ${pendingApprovals.length} etapa(s) de aprovação por decidir.`
                : "Assinatura bloqueada: o documento foi rejeitado ou devolvido para revisão."}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : signatures.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Ainda não existem assinaturas registadas neste documento.
          </p>
        ) : (
          <div className="space-y-3">
            {signatures.map((sig) => {
              const check = checks?.find((c) => c.signature_id === sig.id);
              return (
                <div key={sig.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {sig.signature_data && (
                        <img
                          src={sig.signature_data}
                          alt={`Assinatura de ${sig.signer_name ?? "utilizador"}`}
                          className="h-12 w-24 rounded border bg-background object-contain"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {sig.signer_name ?? sig.signer?.full_name ?? "Utilizador"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sig.signer_role ?? sig.signer?.position ?? "—"} •{" "}
                          {format(new Date(sig.signed_at), "d MMM yyyy, HH:mm", { locale: pt })}
                        </p>
                        <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                          <Link2 className="h-3 w-3" />
                          {sig.signature_hash?.slice(0, 24)}…
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline">#{sig.sequence_order}</Badge>
                      {check && (
                        <Badge variant={check.is_chain_valid ? "default" : "destructive"} className="gap-1">
                          {check.is_chain_valid ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldAlert className="h-3 w-3" />
                          )}
                          {check.is_chain_valid ? "Íntegra" : "Adulterada"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Registo imutável — cada assinatura é encadeada à anterior e arquivada no histórico do documento.
            </p>
          </div>
        )}
      </CardContent>

      <DocumentSignatureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        documentTitle={documentTitle}
        documentId={documentId}
        defaultSignerName={profile?.full_name ?? ""}
        defaultSignerRole={profile?.position ?? ""}
        onSign={handleSign}
      />
    </Card>
  );
}
