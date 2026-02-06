import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, FolderPlus, Check, Link2, Loader2 } from "lucide-react";
import { useProcessTypes, useCreateProcess } from "@/hooks/useProcesses";
import { useOrganizationalUnits } from "@/hooks/useReferenceData";

export interface DocumentInfo {
  id?: string; // Real document ID for linking
  number: string;
  title: string;
  type: string;
  origin: string;
  subject: string;
  author: string;
}

interface CreateProcessFromDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentInfo[];
  onProcessCreated?: (processNumber: string) => void;
}

const priorities = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export function CreateProcessFromDocumentModal({
  open,
  onOpenChange,
  documents,
  onProcessCreated,
}: CreateProcessFromDocumentModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "",
    subject: documents.length === 1 ? documents[0]?.subject || documents[0]?.title || "" : "",
    description: "",
    unit: "",
    priority: "normal",
    deadline: "",
  });

  const { data: processTypes = [] } = useProcessTypes();
  const { data: units = [] } = useOrganizationalUnits({ activeOnly: true });
  const createProcess = useCreateProcess();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.subject || !formData.unit) {
      toast.error("Preencha os campos obrigatórios (assunto e unidade)");
      return;
    }

    // Collect real document IDs for linking
    const linkedDocumentIds = documents
      .filter(d => d.id)
      .map(d => d.id!);

    createProcess.mutate(
      {
        process_type_id: formData.type || undefined,
        subject: formData.subject,
        description: formData.description || undefined,
        priority: formData.priority as 'baixa' | 'normal' | 'alta' | 'urgente',
        current_unit_id: formData.unit,
        deadline: formData.deadline || undefined,
        linked_document_ids: linkedDocumentIds,
      },
      {
        onSuccess: (data) => {
          const processNumber = data?.process_number || "Novo";
          const docCount = documents.length;
          toast.success("Processo criado com sucesso!", {
            description: `${processNumber} - ${docCount} documento${docCount > 1 ? 's' : ''} vinculado${docCount > 1 ? 's' : ''} automaticamente.`,
          });

          onProcessCreated?.(processNumber);
          onOpenChange(false);

          // Reset form
          setFormData({
            type: "",
            subject: "",
            description: "",
            unit: "",
            priority: "normal",
            deadline: "",
          });

          // Navigate to the new process
          if (data?.id) {
            navigate(`/processes/${data.id}`);
          }
        },
      }
    );
  };

  const handleClose = () => {
    if (!createProcess.isPending) {
      onOpenChange(false);
    }
  };

  const isSingleDocument = documents.length === 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Criar Processo {isSingleDocument ? "a partir do Documento" : `com ${documents.length} Documentos`}
          </DialogTitle>
          <DialogDescription>
            {isSingleDocument
              ? "Um novo processo será criado com este documento automaticamente vinculado."
              : `Um novo processo será criado com ${documents.length} documentos automaticamente vinculados.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Document Info */}
            {isSingleDocument ? (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {documents[0].number}
                      </Badge>
                      <Badge variant="secondary">{documents[0].type}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{documents[0].title}</p>
                    <p className="text-xs text-muted-foreground">
                      Origem: {documents[0].origin} • Autor: {documents[0].author}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <Link2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Será vinculado</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Documentos a vincular</Label>
                  <Badge variant="secondary">{documents.length} selecionados</Badge>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="max-h-[180px] overflow-y-auto">
                    {documents.map((doc, index) => (
                      <div
                        key={doc.number}
                        className={`flex items-center gap-3 p-3 ${index !== documents.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="font-mono text-xs">
                              {doc.number}
                            </Badge>
                          </div>
                          <p className="text-sm truncate">{doc.title}</p>
                        </div>
                        <Link2 className="h-4 w-4 text-success shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Process Form - using real data */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Processo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unidade Responsável *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.code} - {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assunto do Processo *</Label>
                <Input
                  placeholder="Digite o assunto do processo"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o objetivo e contexto do processo..."
                  className="min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">O que será feito:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Novo processo será criado com número automático</li>
                    <li>• {documents.length} documento{documents.length > 1 ? 's serão vinculados' : ' será vinculado'} automaticamente</li>
                    <li>• Histórico de auditoria será registrado</li>
                    <li>• Fluxo de trabalho será iniciado na unidade selecionada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createProcess.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={createProcess.isPending}>
            {createProcess.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A criar...
              </>
            ) : (
              "Criar Processo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
