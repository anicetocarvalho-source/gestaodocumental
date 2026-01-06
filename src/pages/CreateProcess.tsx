import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  FileText,
  Upload,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Clock,
  AlertTriangle,
  Paperclip,
  Eye,
  Trash2,
  Plus,
  Loader2
} from "lucide-react";
import { useProcessTypes, useCreateProcess } from "@/hooks/useProcesses";
import { useOrganizationalUnits } from "@/hooks/useReferenceData";
import { useDocuments } from "@/hooks/useDocuments";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface LinkedDocument {
  id: string;
  title: string;
  type: string;
}

const steps = [
  { number: 1, title: "Identificação", description: "Dados básicos do processo" },
  { number: 2, title: "Documentos", description: "Anexar documentos" },
  { number: 3, title: "Workflow", description: "Configurar fluxo" },
];

const CreateProcess = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch data from database
  const { data: processTypes = [], isLoading: isLoadingTypes } = useProcessTypes();
  const { data: units = [], isLoading: isLoadingUnits } = useOrganizationalUnits({ activeOnly: true });
  const { data: documentsResult, isLoading: isLoadingDocs } = useDocuments({});
  const existingDocuments = documentsResult?.data || [];
  const createProcess = useCreateProcess();
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Identificação
    processTypeId: "",
    subject: "",
    description: "",
    origin: "interno",
    requesterName: "",
    requesterUnitId: "",
    // Step 3: Workflow
    currentUnitId: "",
    deadline: "",
    priority: "normal" as "baixa" | "normal" | "alta" | "urgente",
  });

  // Step 2: Documents
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocument[]>([]);
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const linkDocument = (doc: { id: string; title: string; document_type?: { name: string } | null }) => {
    if (!linkedDocuments.find(d => d.id === doc.id)) {
      setLinkedDocuments(prev => [...prev, {
        id: doc.id,
        title: doc.title,
        type: doc.document_type?.name || 'Documento'
      }]);
    }
    setShowDocumentSearch(false);
  };

  const unlinkDocument = (docId: string) => {
    setLinkedDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Calculate SLA days from deadline
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      const slaDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      await createProcess.mutateAsync({
        process_type_id: formData.processTypeId || undefined,
        subject: formData.subject,
        description: formData.description || undefined,
        origin: formData.origin,
        requester_name: formData.requesterName,
        requester_unit_id: formData.origin === "interno" && formData.requesterUnitId ? formData.requesterUnitId : undefined,
        current_unit_id: formData.currentUnitId || undefined,
        priority: formData.priority,
        deadline: formData.deadline ? deadlineDate.toISOString() : undefined,
        sla_days: slaDays > 0 ? slaDays : undefined,
        linked_document_ids: linkedDocuments.map(d => d.id),
      });

      toast.success("Processo criado com sucesso!");
      navigate("/processes");
    } catch (error) {
      console.error("Erro ao criar processo:", error);
      toast.error("Erro ao criar processo. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProcessType = processTypes.find(pt => pt.id === formData.processTypeId);
  const isStep1Valid = formData.processTypeId && formData.subject && formData.requesterName;
  const isStep3Valid = formData.currentUnitId && formData.deadline && formData.priority;

  const isLoading = isLoadingTypes || isLoadingUnits;

  return (
    <DashboardLayout 
      title="Criar Novo Processo" 
      subtitle="Preencha os dados para iniciar um novo processo"
    >
      <PageBreadcrumb 
        items={[
          { label: "Processos", href: "/processes" },
          { label: "Criar Processo" }
        ]} 
      />

      {/* Step Indicator */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div 
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      currentStep === step.number 
                        ? "bg-primary text-primary-foreground" 
                        : currentStep > step.number
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number ? "bg-success" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-8">
          {/* Step 1: Identificação */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Identificação Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Identificação do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Processo *</Label>
                      <select
                        id="type"
                        className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                        value={formData.processTypeId}
                        onChange={(e) => handleInputChange("processTypeId", e.target.value)}
                        disabled={isLoadingTypes}
                      >
                        <option value="">Selecione o tipo</option>
                        {processTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                      {selectedProcessType?.description && (
                        <p className="text-xs text-muted-foreground">{selectedProcessType.description}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto *</Label>
                      <Input
                        id="subject"
                        placeholder="Digite o assunto do processo"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente o objetivo e contexto do processo..."
                      className="min-h-[120px]"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Origem Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Origem do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Origem *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="origin"
                          value="interno"
                          checked={formData.origin === "interno"}
                          onChange={(e) => handleInputChange("origin", e.target.value)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Interno</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="origin"
                          value="externo"
                          checked={formData.origin === "externo"}
                          onChange={(e) => handleInputChange("origin", e.target.value)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Externo</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requester">
                        {formData.origin === "interno" ? "Servidor Solicitante *" : "Requerente *"}
                      </Label>
                      <Input
                        id="requester"
                        placeholder={formData.origin === "interno" ? "Nome do servidor" : "Nome do requerente"}
                        value={formData.requesterName}
                        onChange={(e) => handleInputChange("requesterName", e.target.value)}
                      />
                    </div>
                    {formData.origin === "interno" && (
                      <div className="space-y-2">
                        <Label htmlFor="requesterUnit">Unidade do Solicitante</Label>
                        <select
                          id="requesterUnit"
                          className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                          value={formData.requesterUnitId}
                          onChange={(e) => handleInputChange("requesterUnitId", e.target.value)}
                          disabled={isLoadingUnits}
                        >
                          <option value="">Selecione a unidade</option>
                          {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Documentos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Upload Zone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload de Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Arraste arquivos aqui</p>
                        <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Selecionar Arquivos
                        </label>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 10MB cada)
                      </p>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Arquivos anexados ({uploadedFiles.length})</p>
                      {uploadedFiles.map(file => (
                        <div 
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.type} • {file.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => removeFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Link Existing Documents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Vincular Documentos Existentes
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDocumentSearch(!showDocumentSearch)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Vincular Documento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Document Search */}
                  {showDocumentSearch && (
                    <div className="mb-4 p-4 border border-border rounded-lg bg-muted/30">
                      <p className="text-sm font-medium mb-3">Selecione um documento para vincular:</p>
                      {isLoadingDocs ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : existingDocuments.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {existingDocuments.slice(0, 10).map(doc => (
                            <div 
                              key={doc.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:border-primary cursor-pointer transition-colors"
                              onClick={() => linkDocument(doc)}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{doc.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.entry_number} • {doc.document_type?.name || 'Documento'}
                                  </p>
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-primary" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum documento disponível
                        </p>
                      )}
                    </div>
                  )}

                  {/* Linked Documents List */}
                  {linkedDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {linkedDocuments.map(doc => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                              <Paperclip className="h-5 w-5 text-info" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">{doc.id.slice(0, 8)}... • {doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link to={`/documents/${doc.id}`}>
                              <Button variant="ghost" size="icon-sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => unlinkDocument(doc.id)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum documento vinculado</p>
                      <p className="text-xs">Clique em "Vincular Documento" para adicionar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Workflow */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Parâmetros do Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialUnit">Unidade Inicial *</Label>
                    <select
                      id="initialUnit"
                      className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={formData.currentUnitId}
                      onChange={(e) => handleInputChange("currentUnitId", e.target.value)}
                      disabled={isLoadingUnits}
                    >
                      <option value="">Selecione a unidade</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Unidade responsável pela primeira análise do processo
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo para Conclusão *</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground">
                      Data limite para conclusão do processo
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Nível de Prioridade *</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { value: "baixa", label: "Baixa", color: "info", description: "Prazo flexível" },
                      { value: "normal", label: "Normal", color: "secondary", description: "Prazo padrão" },
                      { value: "alta", label: "Alta", color: "warning", description: "Urgente" },
                      { value: "urgente", label: "Urgente", color: "error", description: "Crítico" },
                    ].map(priority => (
                      <label
                        key={priority.value}
                        className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.priority === priority.value
                            ? `border-primary bg-primary/5`
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority.value}
                          checked={formData.priority === priority.value}
                          onChange={(e) => handleInputChange("priority", e.target.value)}
                          className="sr-only"
                        />
                        <AlertTriangle className={`h-6 w-6 mb-2 ${
                          priority.color === "info" ? "text-info" :
                          priority.color === "secondary" ? "text-muted-foreground" :
                          priority.color === "warning" ? "text-warning" : "text-destructive"
                        }`} />
                        <span className="font-medium text-sm">{priority.label}</span>
                        <span className="text-xs text-muted-foreground">{priority.description}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3">Resumo do Processo</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="ml-2 font-medium">{selectedProcessType?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assunto:</span>
                      <span className="ml-2 font-medium">{formData.subject || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Origem:</span>
                      <span className="ml-2 font-medium capitalize">{formData.origin}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requerente:</span>
                      <span className="ml-2 font-medium">{formData.requesterName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documentos:</span>
                      <span className="ml-2 font-medium">
                        {uploadedFiles.length + linkedDocuments.length} anexo(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prioridade:</span>
                      <Badge 
                        variant={
                          formData.priority === "urgente" ? "destructive" :
                          formData.priority === "alta" ? "warning" :
                          formData.priority === "normal" ? "secondary" : "info"
                        }
                        className="ml-2"
                      >
                        {formData.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <div className="flex items-center gap-3">
              <Link to="/processes">
                <Button variant="ghost" disabled={isSubmitting}>Cancelar</Button>
              </Link>
              {currentStep < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={currentStep === 1 && !isStep1Valid}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStep3Valid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Criar Processo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ajuda</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              {currentStep === 1 && (
                <>
                  <div>
                    <p className="font-medium text-foreground mb-1">Tipo de Processo</p>
                    <p>Selecione a categoria que melhor descreve o processo a ser criado.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Origem</p>
                    <p>Indique se a demanda é interna (de outro setor) ou externa (cidadão, empresa).</p>
                  </div>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <div>
                    <p className="font-medium text-foreground mb-1">Upload de Arquivos</p>
                    <p>Anexe os documentos necessários para instruir o processo.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Vincular Documentos</p>
                    <p>Você pode vincular documentos já existentes no sistema.</p>
                  </div>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <div>
                    <p className="font-medium text-foreground mb-1">Unidade Inicial</p>
                    <p>Selecione o setor responsável pela primeira tramitação.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Prazo</p>
                    <p>O prazo definido será utilizado para calcular o SLA do processo.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Prioridade</p>
                    <p>Processos de alta prioridade terão destaque na fila de trabalho.</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Campos Obrigatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  {formData.processTypeId ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={formData.processTypeId ? "text-muted-foreground" : ""}>Tipo de processo</span>
                </li>
                <li className="flex items-center gap-2">
                  {formData.subject ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={formData.subject ? "text-muted-foreground" : ""}>Assunto</span>
                </li>
                <li className="flex items-center gap-2">
                  {formData.requesterName ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={formData.requesterName ? "text-muted-foreground" : ""}>Requerente</span>
                </li>
                <li className="flex items-center gap-2">
                  {formData.currentUnitId ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={formData.currentUnitId ? "text-muted-foreground" : ""}>Unidade inicial</span>
                </li>
                <li className="flex items-center gap-2">
                  {formData.deadline ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={formData.deadline ? "text-muted-foreground" : ""}>Prazo</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {isLoading && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando dados...
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateProcess;
