import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Save,
  FileText,
  Paperclip,
  Users,
  CalendarIcon,
  X,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Building2,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Types
interface Recipient {
  id: string;
  name: string;
  type: "unit" | "person";
  department?: string;
}

interface AttachedDocument {
  id: string;
  name: string;
  size: string;
  type: string;
}

// Sample Data
const dispatchTypes = [
  { value: "informativo", label: "Informativo", description: "Para conhecimento" },
  { value: "determinativo", label: "Determinativo", description: "Ordem ou instrução" },
  { value: "autorizativo", label: "Autorizativo", description: "Autorização ou aprovação" },
  { value: "homologativo", label: "Homologatório", description: "Homologação de decisão" },
  { value: "decisorio", label: "Decisório", description: "Decisão final" },
];

const availableUnits: Recipient[] = [
  { id: "unit-1", name: "Gabinete do Director-Geral", type: "unit" },
  { id: "unit-2", name: "Direcção de Administração e Finanças", type: "unit" },
  { id: "unit-3", name: "Direcção de Recursos Humanos", type: "unit" },
  { id: "unit-4", name: "Direcção de Tecnologias de Informação", type: "unit" },
  { id: "unit-5", name: "Direcção Jurídica", type: "unit" },
  { id: "unit-6", name: "Direcção de Operações", type: "unit" },
  { id: "unit-7", name: "Gabinete de Planeamento", type: "unit" },
  { id: "unit-8", name: "Secretaria-Geral", type: "unit" },
];

const availablePeople: Recipient[] = [
  { id: "person-1", name: "Dr. António Silva", type: "person", department: "Direcção-Geral" },
  { id: "person-2", name: "Dra. Maria Santos", type: "person", department: "Recursos Humanos" },
  { id: "person-3", name: "Eng. João Costa", type: "person", department: "TI" },
  { id: "person-4", name: "Dr. Carlos Ferreira", type: "person", department: "Jurídico" },
  { id: "person-5", name: "Dra. Ana Rodrigues", type: "person", department: "Finanças" },
  { id: "person-6", name: "Dr. Pedro Almeida", type: "person", department: "Operações" },
];

const availableDocuments: AttachedDocument[] = [
  { id: "doc-1", name: "Relatório Mensal Janeiro 2024.pdf", size: "2.4 MB", type: "pdf" },
  { id: "doc-2", name: "Proposta Orçamento 2024.xlsx", size: "1.8 MB", type: "excel" },
  { id: "doc-3", name: "Contrato Prestação Serviços.docx", size: "856 KB", type: "word" },
  { id: "doc-4", name: "Parecer Jurídico 2024-012.pdf", size: "1.2 MB", type: "pdf" },
  { id: "doc-5", name: "Acta Reunião Direcção.pdf", size: "645 KB", type: "pdf" },
];

const CreateDispatch = () => {
  const navigate = useNavigate();
  
  // Form state
  const [dispatchType, setDispatchType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [dispatchText, setDispatchText] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<string>("normal");
  const [requiresResponse, setRequiresResponse] = useState(false);
  
  // Dialog states
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  // Filter recipients based on search
  const filteredUnits = availableUnits.filter(u => 
    u.name.toLowerCase().includes(recipientSearch.toLowerCase()) &&
    !selectedRecipients.find(r => r.id === u.id)
  );
  const filteredPeople = availablePeople.filter(p => 
    p.name.toLowerCase().includes(recipientSearch.toLowerCase()) &&
    !selectedRecipients.find(r => r.id === p.id)
  );

  // Filter documents based on search
  const filteredDocuments = availableDocuments.filter(d =>
    d.name.toLowerCase().includes(documentSearch.toLowerCase()) &&
    !attachedDocuments.find(a => a.id === d.id)
  );

  const addRecipient = (recipient: Recipient) => {
    setSelectedRecipients([...selectedRecipients, recipient]);
  };

  const removeRecipient = (id: string) => {
    setSelectedRecipients(selectedRecipients.filter(r => r.id !== id));
  };

  const addDocument = (doc: AttachedDocument) => {
    setAttachedDocuments([...attachedDocuments, doc]);
  };

  const removeDocument = (id: string) => {
    setAttachedDocuments(attachedDocuments.filter(d => d.id !== id));
  };

  const handleEmit = () => {
    if (!dispatchType || !subject || !dispatchText || selectedRecipients.length === 0) {
      toast.error("Por favor preencha todos os campos obrigatórios");
      return;
    }
    toast.success("Despacho emitido com sucesso!");
    navigate("/dispatches");
  };

  const handleSaveDraft = () => {
    toast.success("Rascunho guardado com sucesso!");
  };

  const getTypeInfo = (type: string) => {
    return dispatchTypes.find(t => t.value === type);
  };

  return (
    <DashboardLayout
      title="Criar Despacho"
      subtitle="Criação e emissão de despachos institucionais"
    >
      <PageBreadcrumb 
        items={[
          { label: "Gestão de Despachos", href: "/dispatches" },
          { label: "Criar Despacho" }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispatch Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tipo de Despacho
              </CardTitle>
              <CardDescription>Seleccione o tipo de despacho a emitir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dispatchTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDispatchType(type.value)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      dispatchType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border-strong hover:bg-muted/50"
                    )}
                  >
                    <p className="font-medium text-sm text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Texto do Despacho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  placeholder="Ex: Autorização de despesa - Aquisição de equipamentos"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Rich Text Toolbar */}
              <div className="space-y-2">
                <Label>Conteúdo do Despacho *</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-muted border-b border-border">
                    <Button variant="ghost" size="icon-sm" type="button">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" type="button">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" type="button">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button variant="ghost" size="icon-sm" type="button">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" type="button">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button variant="ghost" size="icon-sm" type="button">
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" type="button">
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" type="button">
                      <AlignRight className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button variant="ghost" size="icon-sm" type="button">
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Digite o texto do despacho aqui...

Exemplo:
Autorizo a despesa solicitada no valor de 50.000,00 MT (cinquenta mil meticais), referente à aquisição de equipamentos informáticos, conforme proposta anexa.

Determino que a Direcção de Administração e Finanças proceda aos trâmites necessários para a efectivação da presente autorização."
                    className="min-h-[250px] border-0 rounded-none focus-visible:ring-0 resize-none"
                    value={dispatchText}
                    onChange={(e) => setDispatchText(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {dispatchText.length} caracteres
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attach Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Documentos Anexos
                  </CardTitle>
                  <CardDescription>Anexe documentos relacionados ao despacho</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDocumentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Anexar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attachedDocuments.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Paperclip className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhum documento anexado
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setDocumentDialogOpen(true)}>
                    Seleccionar Documentos
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinatários *
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setRecipientDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedRecipients.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum destinatário seleccionado
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          recipient.type === "unit" ? "bg-primary/10" : "bg-success/10"
                        )}>
                          {recipient.type === "unit" ? (
                            <Building2 className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{recipient.name}</p>
                          {recipient.department && (
                            <p className="text-xs text-muted-foreground">{recipient.department}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRecipient(recipient.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deadline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Prazo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data Limite</Label>
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
                      {deadline ? format(deadline, "PPP", { locale: pt }) : "Seleccionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresResponse"
                  checked={requiresResponse}
                  onCheckedChange={(checked) => setRequiresResponse(checked as boolean)}
                />
                <Label htmlFor="requiresResponse" className="text-sm font-normal">
                  Requer resposta/feedback
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">
                  {dispatchType ? getTypeInfo(dispatchType)?.label : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Destinatários:</span>
                <span className="font-medium">{selectedRecipients.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Anexos:</span>
                <span className="font-medium">{attachedDocuments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prazo:</span>
                <span className="font-medium">
                  {deadline ? format(deadline, "dd/MM/yyyy") : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prioridade:</span>
                <Badge variant={
                  priority === "urgente" ? "destructive" :
                  priority === "alta" ? "warning" :
                  priority === "normal" ? "secondary" : "outline"
                }>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={handleEmit}>
              <Send className="h-4 w-4 mr-2" />
              Emitir Despacho
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Rascunho
              </Button>
              <Button variant="outline" onClick={() => setPreviewDialogOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => navigate("/dispatches")}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>

      {/* Recipient Selection Dialog */}
      <Dialog open={recipientDialogOpen} onOpenChange={setRecipientDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Seleccionar Destinatários</DialogTitle>
            <DialogDescription>
              Escolha as unidades orgânicas ou pessoas que receberão o despacho
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="pl-9"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-4">
              {filteredUnits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Unidades Orgânicas
                  </p>
                  {filteredUnits.map((unit) => (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => addRecipient(unit)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{unit.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredPeople.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pessoas
                  </p>
                  {filteredPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => addRecipient(person)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.department}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredUnits.length === 0 && filteredPeople.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum resultado encontrado
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipientDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Selection Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anexar Documentos</DialogTitle>
            <DialogDescription>
              Seleccione documentos existentes ou carregue novos ficheiros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste ficheiros ou clique para carregar
              </p>
              <Button variant="outline" size="sm">
                Seleccionar Ficheiros
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou seleccione existentes
                </span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar documentos..."
                className="pl-9"
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => addDocument(doc)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Despacho</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary">
                  {dispatchType ? getTypeInfo(dispatchType)?.label : "Tipo não definido"}
                </Badge>
                <Badge variant={
                  priority === "urgente" ? "destructive" :
                  priority === "alta" ? "warning" : "secondary"
                }>
                  Prioridade: {priority}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {subject || "Assunto não definido"}
              </h3>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Texto do Despacho:</p>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {dispatchText || "Nenhum conteúdo"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Destinatários:</p>
                <div className="space-y-1">
                  {selectedRecipients.length > 0 ? (
                    selectedRecipients.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-sm">
                        {r.type === "unit" ? (
                          <Building2 className="h-3 w-3 text-primary" />
                        ) : (
                          <User className="h-3 w-3 text-success" />
                        )}
                        {r.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum destinatário</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Anexos:</p>
                <div className="space-y-1">
                  {attachedDocuments.length > 0 ? (
                    attachedDocuments.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-3 w-3" />
                        {d.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum anexo</p>
                  )}
                </div>
              </div>
            </div>

            {deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Prazo: {format(deadline, "PPP", { locale: pt })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleEmit}>
              <Send className="h-4 w-4 mr-2" />
              Emitir Despacho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CreateDispatch;
