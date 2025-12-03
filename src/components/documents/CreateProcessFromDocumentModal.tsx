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
import { toast } from "sonner";
import {
  FileText,
  FolderPlus,
  Building2,
  Tag,
  Calendar,
  AlertTriangle,
  Check,
  Link2,
} from "lucide-react";

interface DocumentInfo {
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
  document: DocumentInfo;
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
  document,
  onProcessCreated,
}: CreateProcessFromDocumentModalProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    subject: document.subject || "",
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

    toast.success("Processo criado com sucesso!", {
      description: `${processNumber} - Documento ${document.number} vinculado automaticamente.`,
    });

    onProcessCreated?.(processNumber);
    setIsCreating(false);
    onOpenChange(false);

    // Reset form
    setFormData({
      type: "",
      subject: document.subject || "",
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Criar Processo a partir do Documento
          </DialogTitle>
          <DialogDescription>
            Um novo processo será criado com este documento automaticamente vinculado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {document.number}
                  </Badge>
                  <Badge variant="secondary">{document.type}</Badge>
                </div>
                <p className="text-sm font-medium truncate">{document.title}</p>
                <p className="text-xs text-muted-foreground">
                  Origem: {document.origin} • Autor: {document.author}
                </p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <Link2 className="h-4 w-4" />
                <span className="text-xs font-medium">Será vinculado</span>
              </div>
            </div>
          </div>

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
                  <li>• Documento {document.number} será vinculado automaticamente</li>
                  <li>• Histórico de auditoria será registrado</li>
                  <li>• Fluxo de trabalho será iniciado na unidade selecionada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

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
