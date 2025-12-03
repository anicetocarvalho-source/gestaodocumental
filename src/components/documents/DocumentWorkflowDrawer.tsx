import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Forward,
  FolderInput,
  Archive,
  RotateCcw,
  AlertTriangle,
  FileSearch,
  Tag,
  Check,
  Building2,
  Clock,
} from "lucide-react";

export type DocumentAction =
  | "validar"
  | "rejeitar_validacao"
  | "despachar"
  | "classificar"
  | "solicitar_correcao"
  | "anexar_processo"
  | "arquivar"
  | "devolver";

interface DocumentSummary {
  number: string;
  title: string;
  origin: string;
  type: string;
  status: string;
}

interface DocumentWorkflowDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DocumentAction | null;
  documentSummary: DocumentSummary;
  onActionComplete: (action: DocumentAction, data: Record<string, unknown>) => void;
}

const actionConfig: Record<
  DocumentAction,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    confirmTitle: string;
    confirmDescription: string;
    variant: "default" | "success" | "destructive";
  }
> = {
  validar: {
    title: "Validar Documento",
    description: "Confirmar que o documento está correto e completo para tramitação.",
    icon: <CheckCircle2 className="h-5 w-5" />,
    confirmTitle: "Confirmar Validação",
    confirmDescription: "O documento será marcado como validado e poderá prosseguir no fluxo.",
    variant: "success",
  },
  rejeitar_validacao: {
    title: "Rejeitar Validação",
    description: "Indicar que o documento possui problemas e não pode ser validado.",
    icon: <XCircle className="h-5 w-5" />,
    confirmTitle: "Confirmar Rejeição",
    confirmDescription: "O documento será devolvido com os motivos da rejeição.",
    variant: "destructive",
  },
  despachar: {
    title: "Despachar Documento",
    description: "Encaminhar o documento para outra unidade ou responsável.",
    icon: <Forward className="h-5 w-5" />,
    confirmTitle: "Confirmar Despacho",
    confirmDescription: "O documento será encaminhado para o destino selecionado.",
    variant: "default",
  },
  classificar: {
    title: "Classificar Documento",
    description: "Atribuir ou alterar a classificação arquivística do documento.",
    icon: <Tag className="h-5 w-5" />,
    confirmTitle: "Confirmar Classificação",
    confirmDescription: "A classificação do documento será atualizada.",
    variant: "default",
  },
  solicitar_correcao: {
    title: "Solicitar Correção",
    description: "Pedir ao remetente que corrija informações ou anexos do documento.",
    icon: <FileSearch className="h-5 w-5" />,
    confirmTitle: "Confirmar Solicitação",
    confirmDescription: "Uma notificação será enviada ao remetente com as correções necessárias.",
    variant: "default",
  },
  anexar_processo: {
    title: "Anexar a Processo",
    description: "Vincular este documento a um processo existente ou criar novo.",
    icon: <FolderInput className="h-5 w-5" />,
    confirmTitle: "Confirmar Anexação",
    confirmDescription: "O documento será vinculado ao processo selecionado.",
    variant: "default",
  },
  arquivar: {
    title: "Arquivar Documento",
    description: "Enviar o documento para o arquivo definitivo.",
    icon: <Archive className="h-5 w-5" />,
    confirmTitle: "Confirmar Arquivamento",
    confirmDescription: "O documento será movido para o arquivo e não poderá ser editado.",
    variant: "default",
  },
  devolver: {
    title: "Devolver à Origem",
    description: "Retornar o documento ao remetente original.",
    icon: <RotateCcw className="h-5 w-5" />,
    confirmTitle: "Confirmar Devolução",
    confirmDescription: "O documento será devolvido ao remetente com a justificativa informada.",
    variant: "destructive",
  },
};

const units = [
  { id: "gabinete", name: "Gabinete" },
  { id: "secretaria", name: "Secretaria Geral" },
  { id: "arquivo", name: "Arquivo Central" },
  { id: "juridico", name: "Assessoria Jurídica" },
  { id: "financeiro", name: "Departamento Financeiro" },
  { id: "rh", name: "Recursos Humanos" },
  { id: "ti", name: "Tecnologia da Informação" },
];

const processes = [
  { id: "proc-001", number: "PROC-2024-0001", subject: "Licitação - Equipamentos TI" },
  { id: "proc-002", number: "PROC-2024-0015", subject: "Contratação de Serviços" },
  { id: "proc-003", number: "PROC-2024-0023", subject: "Reforma Predial" },
  { id: "new", number: "Novo Processo", subject: "Criar novo processo a partir deste documento" },
];

const classifications = [
  { code: "100.10", name: "Correspondência Oficial" },
  { code: "100.20", name: "Documentos Administrativos" },
  { code: "200.10", name: "Recursos Humanos - Pessoal" },
  { code: "300.10", name: "Financeiro - Orçamento" },
  { code: "400.10", name: "Jurídico - Contratos" },
];

export function DocumentWorkflowDrawer({
  open,
  onOpenChange,
  action,
  documentSummary,
  onActionComplete,
}: DocumentWorkflowDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  if (!action) return null;

  const config = actionConfig[action];

  const handleSubmit = () => {
    // Validate required fields
    if (action === "rejeitar_validacao" && !formData.motivo) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (action === "despachar" && !formData.destino) {
      toast({
        title: "Destino obrigatório",
        description: "Selecione o destino do despacho.",
        variant: "destructive",
      });
      return;
    }

    if (action === "devolver" && !formData.justificativa) {
      toast({
        title: "Justificativa obrigatória",
        description: "Informe o motivo da devolução.",
        variant: "destructive",
      });
      return;
    }

    if (action === "anexar_processo" && !formData.processo) {
      toast({
        title: "Processo obrigatório",
        description: "Selecione o processo de destino.",
        variant: "destructive",
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    onActionComplete(action, formData);

    toast({
      title: "Ação realizada com sucesso",
      description: `${config.title} concluído para ${documentSummary.number}.`,
    });

    setConfirmOpen(false);
    onOpenChange(false);
    setFormData({});
  };

  const renderActionFields = () => {
    switch (action) {
      case "validar":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/20 bg-success-muted p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Validação do Documento</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao validar, você confirma que o documento está completo, legível e pronto para tramitação.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observações (opcional)</Label>
              <Textarea
                id="observacao"
                placeholder="Adicione observações sobre a validação..."
                className="min-h-[100px]"
                value={(formData.observacao as string) || ""}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              />
            </div>
          </div>
        );

      case "rejeitar_validacao":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Rejeição de Validação</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O documento será devolvido ao remetente com os motivos informados.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Rejeição *</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva os problemas encontrados no documento..."
                className="min-h-[120px]"
                value={(formData.motivo as string) || ""}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              />
            </div>
          </div>
        );

      case "despachar":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destino">Unidade de Destino *</Label>
              <Select
                value={(formData.destino as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, destino: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="despacho">Texto do Despacho</Label>
              <Textarea
                id="despacho"
                placeholder="Instruções ou observações para o destinatário..."
                className="min-h-[100px]"
                value={(formData.despacho as string) || ""}
                onChange={(e) => setFormData({ ...formData, despacho: e.target.value })}
              />
            </div>
          </div>
        );

      case "classificar":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classificacao">Código de Classificação *</Label>
              <Select
                value={(formData.classificacao as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classificação" />
                </SelectTrigger>
                <SelectContent>
                  {classifications.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="justificativa_class">Justificativa (opcional)</Label>
              <Textarea
                id="justificativa_class"
                placeholder="Motivo da classificação ou reclassificação..."
                className="min-h-[80px]"
                value={(formData.justificativa_class as string) || ""}
                onChange={(e) => setFormData({ ...formData, justificativa_class: e.target.value })}
              />
            </div>
          </div>
        );

      case "solicitar_correcao":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correcoes">Correções Necessárias *</Label>
              <Textarea
                id="correcoes"
                placeholder="Descreva as correções ou complementações necessárias..."
                className="min-h-[120px]"
                value={(formData.correcoes as string) || ""}
                onChange={(e) => setFormData({ ...formData, correcoes: e.target.value })}
              />
            </div>
          </div>
        );

      case "anexar_processo":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="processo">Processo de Destino *</Label>
              <Select
                value={(formData.processo as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, processo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o processo" />
                </SelectTrigger>
                <SelectContent>
                  {processes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.number}</span>
                        <span className="text-xs text-muted-foreground">{p.subject}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao_anexo">Observações</Label>
              <Textarea
                id="observacao_anexo"
                placeholder="Informações adicionais sobre a anexação..."
                className="min-h-[80px]"
                value={(formData.observacao_anexo as string) || ""}
                onChange={(e) => setFormData({ ...formData, observacao_anexo: e.target.value })}
              />
            </div>
          </div>
        );

      case "arquivar":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Archive className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Arquivamento Definitivo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O documento será movido para o arquivo central e não poderá mais ser editado.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="local_arquivo">Local de Arquivamento</Label>
              <Select
                value={(formData.local_arquivo as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, local_arquivo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Arquivo Corrente</SelectItem>
                  <SelectItem value="intermediario">Arquivo Intermediário</SelectItem>
                  <SelectItem value="permanente">Arquivo Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao_arq">Observações</Label>
              <Textarea
                id="observacao_arq"
                placeholder="Observações sobre o arquivamento..."
                className="min-h-[80px]"
                value={(formData.observacao_arq as string) || ""}
                onChange={(e) => setFormData({ ...formData, observacao_arq: e.target.value })}
              />
            </div>
          </div>
        );

      case "devolver":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Devolução à Origem</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O documento será devolvido a {documentSummary.origin} com a justificativa informada.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa da Devolução *</Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo detalhado da devolução..."
                className="min-h-[120px]"
                value={(formData.justificativa as string) || ""}
                onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                config.variant === "success" 
                  ? "bg-success-muted text-success" 
                  : config.variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary-muted text-primary"
              }`}>
                {config.icon}
              </div>
              <div>
                <SheetTitle>{config.title}</SheetTitle>
                <SheetDescription>{config.description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Document Summary */}
          <div className="my-6 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="font-mono text-sm font-medium">{documentSummary.number}</p>
                <p className="text-sm text-muted-foreground truncate">{documentSummary.title}</p>
              </div>
              <Badge variant="secondary">{documentSummary.status}</Badge>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Origem:</span>
                <span className="font-medium truncate">{documentSummary.origin}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{documentSummary.type}</span>
              </div>
            </div>
          </div>

          {/* Action Fields */}
          <div className="space-y-6">
            {renderActionFields()}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              variant={config.variant === "destructive" ? "destructive" : config.variant === "success" ? "success" : "default"}
              onClick={handleSubmit}
            >
              Confirmar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{config.confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={config.variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
