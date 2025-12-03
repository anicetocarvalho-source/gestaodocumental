import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "./SignaturePad";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileSignature, User, Briefcase, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DocumentSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle?: string;
  documentId?: string;
  onSign?: (signatureData: SignatureData) => void;
}

export interface SignatureData {
  signatureImage: string;
  signerName: string;
  signerRole: string;
  timestamp: string;
  documentId?: string;
}

export function DocumentSignatureModal({
  open,
  onOpenChange,
  documentTitle = "Documento",
  documentId,
  onSign,
}: DocumentSignatureModalProps) {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: pt });
  const formattedTime = format(currentDate, "HH:mm:ss");

  const handleSign = async () => {
    if (!signatureImage || !signerName.trim()) {
      toast.error("Por favor, preencha o nome e desenhe a assinatura");
      return;
    }

    setIsSigning(true);

    // Simulate signing process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const signatureData: SignatureData = {
      signatureImage,
      signerName: signerName.trim(),
      signerRole: signerRole.trim() || "Funcionário",
      timestamp: currentDate.toISOString(),
      documentId,
    };

    onSign?.(signatureData);
    setSigned(true);
    setIsSigning(false);
    
    toast.success("Documento assinado com sucesso!", {
      description: `Assinado por ${signerName} em ${formattedDate}`,
    });
  };

  const handleClose = () => {
    if (!isSigning) {
      setSignatureImage(null);
      setSignerName("");
      setSignerRole("");
      setSigned(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Assinatura Digital
          </DialogTitle>
          <DialogDescription>
            Assinar documento: <span className="font-medium">{documentTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {signed ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Documento Assinado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Assinado por {signerName} em {formattedDate} às {formattedTime}
              </p>
            </div>
            <Badge variant="default" className="bg-success">
              Assinatura Válida
            </Badge>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Signer Information */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="signer-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="signer-name"
                  placeholder="Digite o seu nome completo"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signer-role" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Cargo / Função
                </Label>
                <Input
                  id="signer-role"
                  placeholder="Ex: Diretor, Técnico Superior"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                />
              </div>
            </div>

            {/* Timestamp Info */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Signature Pad */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Assinatura *
              </Label>
              <SignaturePad onSignatureChange={setSignatureImage} />
            </div>
          </div>
        )}

        <DialogFooter>
          {signed ? (
            <Button onClick={handleClose}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSigning}>
                Cancelar
              </Button>
              <Button
                onClick={handleSign}
                disabled={!signatureImage || !signerName.trim() || isSigning}
              >
                {isSigning ? "A assinar..." : "Assinar Documento"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
