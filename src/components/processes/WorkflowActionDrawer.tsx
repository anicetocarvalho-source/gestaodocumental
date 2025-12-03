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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileOutput,
  Forward,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  UserPlus,
  XCircle,
  CalendarIcon,
  Paperclip,
  Clock,
  Building2,
  AlertTriangle,
  Check,
  Upload,
} from "lucide-react";

export type WorkflowAction =
  | "despachar"
  | "reencaminhar"
  | "aprovar"
  | "rejeitar"
  | "solicitar_info"
  | "atribuir"
  | "encerrar";

interface ProcessSummary {
  number: string;
  title: string;
  unit: string;
  slaRemaining: number;
  status: string;
}

interface WorkflowActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: WorkflowAction | null;
  processSummary: ProcessSummary;
  onActionComplete: (action: WorkflowAction, data: Record<string, unknown>) => void;
}

const actionConfig: Record<
  WorkflowAction,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    confirmTitle: string;
    confirmDescription: string;
    variant: "default" | "success" | "destructive";
  }
> = {
  despachar: {
    title: "Despachar Processo",
    description: "Emitir despacho para dar continuidade ao processo.",
    icon: <FileOutput className="h-5 w-5" />,
    confirmTitle: "Confirmar Despacho",
    confirmDescription: "O despacho será registrado e o processo será atualizado.",
    variant: "default",
  },
  reencaminhar: {
    title: "Reencaminhar para Unidade",
    description: "Encaminhar o processo para outra unidade organizacional.",
    icon: <Forward className="h-5 w-5" />,
    confirmTitle: "Confirmar Reencaminhamento",
    confirmDescription: "O processo será encaminhado para a unidade selecionada.",
    variant: "default",
  },
  aprovar: {
    title: "Aprovar Processo",
    description: "Aprovar a etapa atual do processo.",
    icon: <ThumbsUp className="h-5 w-5" />,
    confirmTitle: "Confirmar Aprovação",
    confirmDescription: "O processo será aprovado e avançará para a próxima etapa.",
    variant: "success",
  },
  rejeitar: {
    title: "Rejeitar Processo",
    description: "Rejeitar a etapa atual com justificativa obrigatória.",
    icon: <ThumbsDown className="h-5 w-5" />,
    confirmTitle: "Confirmar Rejeição",
    confirmDescription: "O processo será rejeitado e retornará à etapa anterior.",
    variant: "destructive",
  },
  solicitar_info: {
    title: "Solicitar Informações",
    description: "Solicitar informações ou documentos complementares.",
    icon: <MessageSquare className="h-5 w-5" />,
    confirmTitle: "Confirmar Solicitação",
    confirmDescription: "A solicitação será enviada ao responsável pelo processo.",
    variant: "default",
  },
  atribuir: {
    title: "Atribuir Responsável",
    description: "Designar um novo responsável para o processo.",
    icon: <UserPlus className="h-5 w-5" />,
    confirmTitle: "Confirmar Atribuição",
    confirmDescription: "O processo será atribuído ao responsável selecionado.",
    variant: "default",
  },
  encerrar: {
    title: "Encerrar Processo",
    description: "Finalizar e arquivar o processo.",
    icon: <XCircle className="h-5 w-5" />,
    confirmTitle: "Confirmar Encerramento",
    confirmDescription: "O processo será encerrado e arquivado permanentemente.",
    variant: "destructive",
  },
};

const units = [
  { id: "gabinete", name: "Gabinete" },
  { id: "setor_compras", name: "Setor de Compras" },
  { id: "setor_tecnico", name: "Setor Técnico" },
  { id: "procuradoria", name: "Procuradoria" },
  { id: "comunicacao", name: "Comunicação" },
  { id: "arquivo", name: "Arquivo" },
  { id: "financeiro", name: "Financeiro" },
  { id: "rh", name: "Recursos Humanos" },
];

const users = [
  { id: "maria_silva", name: "Maria Silva", unit: "Gabinete" },
  { id: "carlos_mendes", name: "Carlos Mendes", unit: "Setor Técnico" },
  { id: "ana_costa", name: "Ana Costa", unit: "Procuradoria" },
  { id: "joao_santos", name: "João Santos", unit: "Setor de Compras" },
  { id: "pedro_lima", name: "Pedro Lima", unit: "Financeiro" },
];

export function WorkflowActionDrawer({
  open,
  onOpenChange,
  action,
  processSummary,
  onActionComplete,
}: WorkflowActionDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [deadline, setDeadline] = useState<Date>();
  const [attachments, setAttachments] = useState<File[]>([]);

  if (!action) return null;

  const config = actionConfig[action];

  const handleSubmit = () => {
    // Validate required fields
    if (action === "rejeitar" && !formData.justificativa) {
      toast({
        title: "Justificativa obrigatória",
        description: "Informe o motivo da rejeição para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (action === "reencaminhar" && !formData.unidade) {
      toast({
        title: "Unidade obrigatória",
        description: "Selecione a unidade de destino para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (action === "atribuir" && !formData.responsavel) {
      toast({
        title: "Responsável obrigatório",
        description: "Selecione o responsável para continuar.",
        variant: "destructive",
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    onActionComplete(action, {
      ...formData,
      deadline,
      attachments: attachments.map((f) => f.name),
    });

    toast({
      title: "Ação realizada com sucesso",
      description: `${config.title} concluído para o processo ${processSummary.number}.`,
    });

    setConfirmOpen(false);
    onOpenChange(false);
    setFormData({});
    setDeadline(undefined);
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const renderActionFields = () => {
    switch (action) {
      case "despachar":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="despacho">Texto do Despacho *</Label>
              <Textarea
                id="despacho"
                placeholder="Digite o conteúdo do despacho..."
                className="min-h-[120px]"
                value={(formData.despacho as string) || ""}
                onChange={(e) => setFormData({ ...formData, despacho: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo para Cumprimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case "reencaminhar":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade de Destino *</Label>
              <Select
                value={(formData.unidade as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, unidade: value })}
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
              <Label htmlFor="motivo">Motivo do Encaminhamento</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo do encaminhamento..."
                className="min-h-[100px]"
                value={(formData.motivo as string) || ""}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar prazo"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case "aprovar":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacao">Observações (opcional)</Label>
              <Textarea
                id="observacao"
                placeholder="Adicione observações sobre a aprovação..."
                className="min-h-[100px]"
                value={(formData.observacao as string) || ""}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              />
            </div>
            <div className="rounded-lg border border-success/20 bg-success-muted p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Aprovação Automática</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O processo avançará automaticamente para a próxima etapa do fluxo após a confirmação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "rejeitar":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Ação Irreversível</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A rejeição fará o processo retornar à etapa anterior. Justificativa é obrigatória.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa da Rejeição *</Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo detalhado da rejeição..."
                className="min-h-[120px]"
                value={(formData.justificativa as string) || ""}
                onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 20 caracteres. Esta justificativa será registrada no histórico do processo.
              </p>
            </div>
          </div>
        );

      case "solicitar_info":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="solicitacao">Informações Solicitadas *</Label>
              <Textarea
                id="solicitacao"
                placeholder="Descreva as informações ou documentos necessários..."
                className="min-h-[120px]"
                value={(formData.solicitacao as string) || ""}
                onChange={(e) => setFormData({ ...formData, solicitacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo para Resposta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar prazo"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinatario">Destinatário</Label>
              <Select
                value={(formData.destinatario as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, destinatario: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destinatário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "atribuir":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel">Novo Responsável *</Label>
              <Select
                value={(formData.responsavel as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, responsavel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instrucoes">Instruções</Label>
              <Textarea
                id="instrucoes"
                placeholder="Instruções para o novo responsável..."
                className="min-h-[100px]"
                value={(formData.instrucoes as string) || ""}
                onChange={(e) => setFormData({ ...formData, instrucoes: e.target.value })}
              />
            </div>
          </div>
        );

      case "encerrar":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Encerramento Definitivo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O processo será arquivado e não poderá ser reaberto. Todas as etapas pendentes serão canceladas.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo_encerramento">Motivo do Encerramento *</Label>
              <Select
                value={(formData.motivo_encerramento as string) || ""}
                onValueChange={(value) => setFormData({ ...formData, motivo_encerramento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concluido">Processo Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelamento por Solicitação</SelectItem>
                  <SelectItem value="improcedente">Processo Improcedente</SelectItem>
                  <SelectItem value="duplicado">Processo Duplicado</SelectItem>
                  <SelectItem value="outros">Outros Motivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao_encerramento">Observações Finais</Label>
              <Textarea
                id="observacao_encerramento"
                placeholder="Observações sobre o encerramento..."
                className="min-h-[100px]"
                value={(formData.observacao_encerramento as string) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, observacao_encerramento: e.target.value })
                }
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
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  config.variant === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : config.variant === "success"
                    ? "bg-success-muted text-success"
                    : "bg-primary-muted text-primary"
                )}
              >
                {config.icon}
              </div>
              <div>
                <SheetTitle>{config.title}</SheetTitle>
                <SheetDescription>{config.description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Process Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 mb-6">
            <h4 className="text-sm font-medium mb-3">Resumo do Processo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Número:</span>
                <Badge variant="outline" className="font-mono">
                  {processSummary.number}
                </Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Título:</span>
                <span className="text-right font-medium">{processSummary.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Unidade:
                </span>
                <span className="font-medium">{processSummary.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  SLA:
                </span>
                <Badge
                  variant={
                    processSummary.slaRemaining > 10
                      ? "success"
                      : processSummary.slaRemaining > 3
                      ? "warning"
                      : "error"
                  }
                >
                  {processSummary.slaRemaining} dias restantes
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Action-specific fields */}
          <div className="space-y-6">
            {renderActionFields()}

            {/* File Attachment - Common for most actions */}
            {action !== "aprovar" && (
              <div className="space-y-2">
                <Label htmlFor="anexos">Anexar Documentos</Label>
                <div className="border border-dashed border-border rounded-lg p-4">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar arquivos
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setAttachments(attachments.filter((_, i) => i !== index))
                          }
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <SheetFooter className="mt-8 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              variant={config.variant === "destructive" ? "destructive" : "default"}
              onClick={handleSubmit}
            >
              {config.title.split(" ")[0]}
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
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p>
              <strong>Processo:</strong> {processSummary.number}
            </p>
            <p>
              <strong>Ação:</strong> {config.title}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                config.variant === "destructive" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              onClick={handleConfirm}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
