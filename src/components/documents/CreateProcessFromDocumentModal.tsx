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
import {
  FileText,
  FolderPlus,
  Check,
  Link2,
  X,
} from "lucide-react";

export interface DocumentInfo {
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

const processTypes = [
  { value: "licitacao", label: "Licitação" },
  { value: "contratacao", label: "Contratação" },
  { value: "renovacao", label: "Renovação" },
  { value: "solicitacao", label: "Solicitação" },
  { value: "parecer", label: "Parecer" },
  { value: "convenio", label: "Convênio" },
  { value: "auditoria", label: "Auditoria" },
  { value: "recurso", label: "Recurso" },
  { value: "denuncia", label: "Denúncia" },
  { value: "consulta", label: "Consulta" },
];

const units = [
  { value: "gabinete", label: "Gabinete" },
  { value: "compras", label: "Setor de Compras" },
  { value: "juridico", label: "Departamento Jurídico" },
  { value: "educacao", label: "Secretaria de Educação" },
  { value: "engenharia", label: "Setor de Engenharia" },
  { value: "convenios", label: "Setor de Convênios" },
  { value: "controladoria", label: "Controladoria" },
  { value: "procuradoria", label: "Procuradoria" },
  { value: "rh", label: "Recursos Humanos" },
  { value: "financeiro", label: "Financeiro" },
];

const priorities = [
  { value: "baixa", label: "Baixa", color: "bg-blue-500" },
  { value: "media", label: "Média", color: "bg-yellow-500" },
  { value: "alta", label: "Alta", color: "bg-orange-500" },
  { value: "urgente", label: "Urgente", color: "bg-red-500" },
];

export function CreateProcessFromDocumentModal({
  open,
  onOpenChange,
  documents,
  onProcessCreated,
}: CreateProcessFromDocumentModalProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    subject: documents.length === 1 ? documents[0]?.subject || "" : "",
    description: "",
    unit: "",
    priority: "media",
    deadline: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateProcessNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `PROC-${year}-${random}`;
  };

  const handleCreate = async () => {
    if (!formData.type || !formData.subject || !formData.unit) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsCreating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const processNumber = generateProcessNumber();

    const docCount = documents.length;
    toast.success("Processo criado com sucesso!", {
      description: `${processNumber} - ${docCount} documento${docCount > 1 ? 's' : ''} vinculado${docCount > 1 ? 's' : ''} automaticamente.`,
    });

    onProcessCreated?.(processNumber);
    setIsCreating(false);
    onOpenChange(false);

    // Reset form
    setFormData({
      type: "",
      subject: "",
      description: "",
      unit: "",
      priority: "media",
      deadline: "",
    });

    // Navigate to the new process
    navigate(`/processes/1`);
  };

  const handleClose = () => {
    if (!isCreating) {
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
              : `Um novo processo será criado com ${documents.length} documentos automaticamente vinculados.`
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Document Info */}
            {isSingleDocument ? (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
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
                        <div className="h-8 w-8 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="font-mono text-xs">
                              {doc.number}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
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

            {/* Process Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="process-type">Tipo de Processo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-unit">Unidade Responsável *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="process-subject">Assunto do Processo *</Label>
                <Input
                  id="process-subject"
                  placeholder="Digite o assunto do processo"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="process-description">Descrição</Label>
                <Textarea
                  id="process-description"
                  placeholder="Descreva o objetivo e contexto do processo..."
                  className="min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="process-priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-deadline">Prazo</Label>
                  <Input
                    id="process-deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-primary/20 bg-primary-muted/30 p-4">
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
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "A criar..." : "Criar Processo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}