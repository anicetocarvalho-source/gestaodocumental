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
import { Skeleton } from "@/components/ui/skeleton";
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
  Building2,
  User,
  Search,
  Plus,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateDispatch, useEmitDispatch, dispatchTypeLabels, dispatchPriorityLabels } from "@/hooks/useDispatches";
import { useOrganizationalUnits, useProfiles } from "@/hooks/useReferenceData";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type DispatchType = Database["public"]["Enums"]["dispatch_type"];
type DispatchPriority = Database["public"]["Enums"]["dispatch_priority"];

interface Recipient {
  id: string;
  name: string;
  type: "unit" | "person";
  department?: string;
}

interface AttachedDocument {
  id: string;
  name: string;
  entry_number: string;
}

const dispatchTypes: Array<{ value: DispatchType; label: string; description: string }> = [
  { value: "informativo", label: "Informativo", description: "Para conhecimento" },
  { value: "determinativo", label: "Determinativo", description: "Ordem ou instrução" },
  { value: "autorizativo", label: "Autorizativo", description: "Autorização ou aprovação" },
  { value: "homologativo", label: "Homologatório", description: "Homologação de decisão" },
  { value: "decisorio", label: "Decisório", description: "Decisão final" },
];

const CreateDispatch = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Form state
  const [dispatchType, setDispatchType] = useState<DispatchType | "">("");
  const [subject, setSubject] = useState("");
  const [dispatchText, setDispatchText] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<DispatchPriority>("normal");
  const [requiresResponse, setRequiresResponse] = useState(false);
  
  // Dialog states
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  // Data fetching
  const { data: units, isLoading: unitsLoading } = useOrganizationalUnits();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  
  // Mutations
  const createDispatch = useCreateDispatch();
  const emitDispatch = useEmitDispatch();

  // Filter recipients based on search
  const filteredUnits = (units || []).filter(u => 
    u.name.toLowerCase().includes(recipientSearch.toLowerCase()) &&
    !selectedRecipients.find(r => r.id === u.id && r.type === "unit")
  );
  const filteredPeople = (profiles || []).filter(p => 
    p.full_name.toLowerCase().includes(recipientSearch.toLowerCase()) &&
    !selectedRecipients.find(r => r.id === p.id && r.type === "person")
  );

  // Filter documents based on search
  const documentsList = documents && 'data' in documents ? documents.data : (documents || []);
  const filteredDocuments = (documentsList as any[]).filter((d: any) =>
    (d.title.toLowerCase().includes(documentSearch.toLowerCase()) ||
    d.entry_number.toLowerCase().includes(documentSearch.toLowerCase())) &&
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

  const validateForm = () => {
    if (!dispatchType) {
      toast.error("Seleccione o tipo de despacho");
      return false;
    }
    if (!subject.trim()) {
      toast.error("Digite o assunto do despacho");
      return false;
    }
    if (!dispatchText.trim()) {
      toast.error("Digite o conteúdo do despacho");
      return false;
    }
    if (selectedRecipients.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!dispatchType || !subject.trim()) {
      toast.error("Preencha pelo menos o tipo e assunto para guardar rascunho");
      return;
    }

    try {
      await createDispatch.mutateAsync({
        dispatch_type: dispatchType as DispatchType,
        subject: subject.trim(),
        content: dispatchText.trim() || "Rascunho",
        priority,
        origin_unit_id: profile?.unit_id || undefined,
        deadline: deadline?.toISOString(),
        requires_response: requiresResponse,
        recipients: selectedRecipients.map(r => ({
          type: r.type,
          unit_id: r.type === "unit" ? r.id : undefined,
          profile_id: r.type === "person" ? r.id : undefined,
        })),
        document_ids: attachedDocuments.map(d => d.id),
      });
      toast.success("Rascunho guardado com sucesso!");
      navigate("/dispatches");
    } catch (error) {
      toast.error("Erro ao guardar rascunho");
    }
  };

  const handleEmit = async () => {
    if (!validateForm()) return;

    try {
      const dispatch = await createDispatch.mutateAsync({
        dispatch_type: dispatchType as DispatchType,
        subject: subject.trim(),
        content: dispatchText.trim(),
        priority,
        origin_unit_id: profile?.unit_id || undefined,
        deadline: deadline?.toISOString(),
        requires_response: requiresResponse,
        recipients: selectedRecipients.map(r => ({
          type: r.type,
          unit_id: r.type === "unit" ? r.id : undefined,
          profile_id: r.type === "person" ? r.id : undefined,
        })),
        document_ids: attachedDocuments.map(d => d.id),
      });

      await emitDispatch.mutateAsync(dispatch.id);
      toast.success("Despacho emitido com sucesso!");
      navigate("/dispatches");
    } catch (error) {
      toast.error("Erro ao emitir despacho");
    }
  };

  const isSubmitting = createDispatch.isPending || emitDispatch.isPending;

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

              <div className="space-y-2">
                <Label>Conteúdo do Despacho *</Label>
                <Textarea
                  placeholder="Digite o texto do despacho aqui..."
                  className="min-h-[200px]"
                  value={dispatchText}
                  onChange={(e) => setDispatchText(e.target.value)}
                />
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
                          <p className="text-xs text-muted-foreground">{doc.entry_number}</p>
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
                Prazo e Prioridade
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
                <Select value={priority} onValueChange={(v) => setPriority(v as DispatchPriority)}>
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
                  {dispatchType ? dispatchTypeLabels[dispatchType] : "-"}
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
                  {dispatchPriorityLabels[priority]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleEmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Emitir Despacho
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
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

      {/* Recipients Dialog */}
      <Dialog open={recipientDialogOpen} onOpenChange={setRecipientDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Destinatários</DialogTitle>
            <DialogDescription>
              Seleccione unidades ou pessoas para receber o despacho
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar destinatários..." 
              className="pl-10"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {unitsLoading || profilesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Units */}
                {filteredUnits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Unidades Orgânicas
                    </h4>
                    <div className="space-y-1">
                      {filteredUnits.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => addRecipient({ id: unit.id, name: unit.name, type: "unit" })}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{unit.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* People */}
                {filteredPeople.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Pessoas
                    </h4>
                    <div className="space-y-1">
                      {filteredPeople.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => addRecipient({ 
                            id: person.id, 
                            name: person.full_name, 
                            type: "person",
                            department: person.position || undefined
                          })}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{person.full_name}</p>
                            {person.position && (
                              <p className="text-xs text-muted-foreground">{person.position}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredUnits.length === 0 && filteredPeople.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum destinatário encontrado
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipientDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Anexar Documentos</DialogTitle>
            <DialogDescription>
              Seleccione documentos do sistema para anexar ao despacho
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar documentos..." 
              className="pl-10"
              value={documentSearch}
              onChange={(e) => setDocumentSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {documentsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum documento encontrado
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => addDocument({ id: doc.id, name: doc.title, entry_number: doc.entry_number })}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.entry_number}</p>
                  </div>
                </button>
              ))
            )}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Despacho</DialogTitle>
          </DialogHeader>
          
          <div className="border border-border rounded-lg p-6 bg-background">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold uppercase">
                Despacho {dispatchType ? dispatchTypeLabels[dispatchType] : ""}
              </h3>
              <p className="text-sm text-muted-foreground">Número: (Será gerado automaticamente)</p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Assunto:</p>
                <p className="font-medium">{subject || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Destinatários:</p>
                <p className="font-medium">
                  {selectedRecipients.length > 0 
                    ? selectedRecipients.map(r => r.name).join(", ")
                    : "-"
                  }
                </p>
              </div>

              <div className="border-t border-b border-border py-4 my-4">
                <p className="whitespace-pre-wrap">{dispatchText || "Sem conteúdo"}</p>
              </div>

              {attachedDocuments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Anexos:</p>
                  <ul className="list-disc list-inside">
                    {attachedDocuments.map(d => (
                      <li key={d.id} className="text-sm">{d.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {deadline && (
                <div>
                  <p className="text-sm text-muted-foreground">Prazo:</p>
                  <p className="font-medium">{format(deadline, "dd/MM/yyyy")}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => { setPreviewDialogOpen(false); handleEmit(); }} disabled={isSubmitting}>
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
