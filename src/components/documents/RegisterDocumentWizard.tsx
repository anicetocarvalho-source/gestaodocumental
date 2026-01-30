import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useDocumentTypes, useOrganizationalUnits, useClassificationCodes } from "@/hooks/useReferenceData";
import { useCreateDocument } from "@/hooks/useDocuments";
import { useUploadDocumentFile } from "@/hooks/useFileUpload";
import { FieldHelp, fieldHelpTexts } from "@/components/common/FieldHelp";
import { QuickPick } from "@/components/common/QuickPick";
import { 
  DocumentPriority, 
  DocumentConfidentiality,
  documentPriorityLabels,
  confidentialityLabels 
} from "@/types/database";
import { 
  FileText, 
  Upload, 
  X, 
  Save, 
  Send, 
  Sparkles,
  Eye,
  File,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Building,
  Tags
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

interface FormData {
  title: string;
  documentTypeId: string;
  classificationId: string;
  originUnitId: string;
  currentUnitId: string;
  priority: DocumentPriority;
  confidentiality: DocumentConfidentiality;
  subject: string;
  description: string;
  senderName: string;
  senderInstitution: string;
  externalReference: string;
  dueDate: string;
}

const initialFormData: FormData = {
  title: "",
  documentTypeId: "",
  classificationId: "",
  originUnitId: "",
  currentUnitId: "",
  priority: "normal",
  confidentiality: "public",
  subject: "",
  description: "",
  senderName: "",
  senderInstitution: "",
  externalReference: "",
  dueDate: "",
};

const suggestedTags = [
  { label: "Orçamento", confidence: 95 },
  { label: "Financeiro", confidence: 88 },
  { label: "Licitação", confidence: 75 },
  { label: "Contratos", confidence: 70 },
  { label: "Urgente", confidence: 65 },
];

const steps = [
  { id: 1, title: "Dados Básicos", description: "Título, tipo e classificação", icon: FileText },
  { id: 2, title: "Ficheiros", description: "Upload de documentos", icon: Upload },
  { id: 3, title: "Remetente", description: "Origem do documento", icon: User },
  { id: 4, title: "Revisão", description: "Confirmar e submeter", icon: Check },
];

export function RegisterDocumentWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference data
  const { data: documentTypes, isLoading: loadingTypes } = useDocumentTypes({ activeOnly: true });
  const { data: organizationalUnits, isLoading: loadingUnits } = useOrganizationalUnits({ activeOnly: true });
  const { data: classificationCodes, isLoading: loadingClassifications } = useClassificationCodes({ activeOnly: true });
  
  // Mutations
  const createDocument = useCreateDocument();
  const uploadFile = useUploadDocumentFile();

  const isLoading = loadingTypes || loadingUnits || loadingClassifications;
  const progress = (currentStep / steps.length) * 100;

  // Quick pick options - most commonly used items
  const quickPickDocTypes = useMemo(() => {
    if (!documentTypes) return [];
    // Show first 3 as "frequently used" 
    return documentTypes.slice(0, 3).map(t => ({
      id: t.id,
      label: t.name,
    }));
  }, [documentTypes]);

  const quickPickUnits = useMemo(() => {
    if (!organizationalUnits) return [];
    // Show top-level units (level 1) as frequently used
    return organizationalUnits
      .filter(u => u.level === 1)
      .slice(0, 3)
      .map(u => ({
        id: u.id,
        label: u.name,
        subLabel: u.code,
      }));
  }, [organizationalUnits]);

  const quickPickClassifications = useMemo(() => {
    if (!classificationCodes) return [];
    // Show top-level classifications
    return classificationCodes
      .filter(c => c.level === 1)
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        label: c.name,
        subLabel: c.code,
      }));
  }, [classificationCodes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} ficheiro${files.length > 1 ? 's' : ''} adicionado${files.length > 1 ? 's' : ''}`);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} ficheiro${fileArray.length > 1 ? 's' : ''} adicionado${fileArray.length > 1 ? 's' : ''}`);
    }
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  }, []);

  const updateFormData = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.error("O título é obrigatório");
          return false;
        }
        if (!formData.documentTypeId) {
          toast.error("O tipo de documento é obrigatório");
          return false;
        }
        if (!formData.currentUnitId) {
          toast.error("A unidade de destino é obrigatória");
          return false;
        }
        return true;
      case 2:
        return true; // Files are optional
      case 3:
        return true; // Sender info is optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const document = await createDocument.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        document_type_id: formData.documentTypeId || undefined,
        classification_id: formData.classificationId || undefined,
        origin: formData.senderInstitution || undefined,
        origin_unit_id: formData.originUnitId || undefined,
        current_unit_id: formData.currentUnitId || undefined,
        priority: formData.priority,
        confidentiality: formData.confidentiality,
        due_date: formData.dueDate || undefined,
        subject: formData.subject || undefined,
        sender_name: formData.senderName || undefined,
        sender_institution: formData.senderInstitution || undefined,
        external_reference: formData.externalReference || undefined,
      });

      // Upload files
      if (uploadedFiles.length > 0 && document.id) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          await uploadFile.mutateAsync({
            documentId: document.id,
            file: uploadedFiles[i],
            isMainFile: i === 0,
          });
        }
      }

      toast.success("Documento registado com sucesso", {
        description: `Nº de Entrada: ${document.entry_number}`,
      });
      navigate("/documents");
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      toast.error("Erro ao registar documento", {
        description: "Ocorreu um erro ao guardar o documento. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasData = formData.title || formData.subject || formData.description || uploadedFiles.length > 0;
    if (hasData) {
      setCancelDialogOpen(true);
    } else {
      navigate("/documents");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getDocumentTypeName = (id: string) => documentTypes?.find(t => t.id === id)?.name || "-";
  const getUnitName = (id: string) => organizationalUnits?.find(u => u.id === id)?.name || "-";
  const getClassificationName = (id: string) => classificationCodes?.find(c => c.id === id)?.name || "-";

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Passo {currentStep} de {steps.length}</span>
              <span className="font-medium">{Math.round(progress)}% completo</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between pt-2">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                      disabled={step.id > currentStep}
                      className={cn(
                        "flex items-center gap-2 transition-colors",
                        isCurrent && "text-primary",
                        isCompleted && "text-success cursor-pointer hover:text-success/80",
                        !isCurrent && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                        isCurrent && "border-primary bg-primary text-primary-foreground",
                        isCompleted && "border-success bg-success text-success-foreground",
                        !isCurrent && !isCompleted && "border-muted-foreground/30"
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-xs font-medium">{step.title}</p>
                        <p className="text-[10px] text-muted-foreground">{step.description}</p>
                      </div>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "hidden sm:block w-12 lg:w-24 h-px mx-2",
                        isCompleted ? "bg-success" : "bg-border"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Basic Data */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Dados Básicos do Documento
                </CardTitle>
                <CardDescription>
                  Preencha as informações essenciais para identificar o documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input 
                    id="title"
                    placeholder="Título do documento"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="type">Tipo de Documento *</Label>
                      <FieldHelp helpText={fieldHelpTexts.documentType} size="sm" />
                    </div>
                    {loadingTypes ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <>
                        <QuickPick 
                          options={quickPickDocTypes}
                          selectedValue={formData.documentTypeId}
                          onSelect={(id) => updateFormData("documentTypeId", id)}
                          disabled={isSubmitting}
                        />
                        <Select 
                          value={formData.documentTypeId} 
                          onValueChange={(value) => updateFormData("documentTypeId", value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Seleccione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes?.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="currentUnit">Unidade de Destino *</Label>
                      <FieldHelp helpText={fieldHelpTexts.organizationalUnit} size="sm" />
                    </div>
                    {loadingUnits ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <>
                        <QuickPick 
                          options={quickPickUnits}
                          selectedValue={formData.currentUnitId}
                          onSelect={(id) => updateFormData("currentUnitId", id)}
                          disabled={isSubmitting}
                        />
                        <Select 
                          value={formData.currentUnitId} 
                          onValueChange={(value) => updateFormData("currentUnitId", value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="currentUnit">
                            <SelectValue placeholder="Seleccione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationalUnits?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.code} - {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="classification">Classificação</Label>
                    <FieldHelp helpText={fieldHelpTexts.classification} size="sm" />
                  </div>
                  {loadingClassifications ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <>
                      <QuickPick 
                        options={quickPickClassifications}
                        selectedValue={formData.classificationId}
                        onSelect={(id) => updateFormData("classificationId", id)}
                        disabled={isSubmitting}
                      />
                      <Select 
                        value={formData.classificationId} 
                        onValueChange={(value) => updateFormData("classificationId", value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="classification">
                          <SelectValue placeholder="Seleccione a classificação" />
                        </SelectTrigger>
                        <SelectContent>
                          {classificationCodes?.map((code) => (
                            <SelectItem key={code.id} value={code.id}>
                              {code.code} - {code.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="priority">Prioridade</Label>
                      <FieldHelp helpText={fieldHelpTexts.priority} size="sm" />
                    </div>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => updateFormData("priority", value as DocumentPriority)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentPriorityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="confidentiality">Confidencialidade</Label>
                      <FieldHelp helpText={fieldHelpTexts.confidentiality} size="sm" />
                    </div>
                    <Select 
                      value={formData.confidentiality} 
                      onValueChange={(value) => updateFormData("confidentiality", value as DocumentConfidentiality)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="confidentiality">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(confidentialityLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input 
                    id="subject"
                    placeholder="Assunto do documento"
                    value={formData.subject}
                    onChange={(e) => updateFormData("subject", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    className="h-24 resize-none"
                    placeholder="Descreva o conteúdo e contexto do documento..."
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data Limite</Label>
                  <Input 
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateFormData("dueDate", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Files */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload de Ficheiros
                </CardTitle>
                <CardDescription>
                  Adicione os ficheiros associados ao documento (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                    multiple
                    disabled={isSubmitting}
                    aria-label="Seleccionar ficheiros"
                  />
                  <div className="space-y-3">
                    <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Arraste e solte ficheiros aqui</p>
                      <p className="text-xs text-muted-foreground mt-1">ou clique para seleccionar</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 20MB por ficheiro)
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg"
                      >
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          {index === 0 ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <File className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            {index === 0 && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Sender Info */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Informação do Remetente
                </CardTitle>
                <CardDescription>
                  Dados sobre a origem externa do documento (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="originUnit">Unidade de Origem</Label>
                  {loadingUnits ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select 
                      value={formData.originUnitId} 
                      onValueChange={(value) => updateFormData("originUnitId", value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="originUnit">
                        <SelectValue placeholder="Seleccione a unidade de origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationalUnits?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.code} - {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderName">Nome do Remetente</Label>
                  <Input 
                    id="senderName"
                    placeholder="Nome da pessoa ou entidade"
                    value={formData.senderName}
                    onChange={(e) => updateFormData("senderName", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderInstitution">Instituição</Label>
                  <Input 
                    id="senderInstitution"
                    placeholder="Nome da instituição"
                    value={formData.senderInstitution}
                    onChange={(e) => updateFormData("senderInstitution", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalReference">Referência Externa</Label>
                  <Input 
                    id="externalReference"
                    placeholder="Nº de ofício ou referência do remetente"
                    value={formData.externalReference}
                    onChange={(e) => updateFormData("externalReference", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Revisão Final
                </CardTitle>
                <CardDescription>
                  Verifique os dados antes de submeter o documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Título</p>
                      <p className="font-medium">{formData.title || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">{getDocumentTypeName(formData.documentTypeId)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unidade de Destino</p>
                      <p className="font-medium">{getUnitName(formData.currentUnitId)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Classificação</p>
                      <p className="font-medium">{getClassificationName(formData.classificationId)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prioridade</p>
                      <Badge variant={formData.priority === "urgent" ? "destructive" : "secondary"}>
                        {documentPriorityLabels[formData.priority]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confidencialidade</p>
                      <Badge variant="outline">{confidentialityLabels[formData.confidentiality]}</Badge>
                    </div>
                  </div>

                  {formData.description && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Descrição</p>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-2">Ficheiros ({uploadedFiles.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file, index) => (
                          <Badge key={index} variant="outline" className="gap-1">
                            <File className="h-3 w-3" />
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* AI Tags */}
          {currentStep <= 2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  Sugestões IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => handleTagToggle(tag.label)}
                      disabled={isSubmitting}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-colors",
                        selectedTags.includes(tag.label)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      )}
                    >
                      <span>{tag.label}</span>
                      <span className="opacity-70">{tag.confidence}%</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Precisa de ajuda?</p>
                  <p>Campos marcados com * são obrigatórios. Os restantes podem ser preenchidos posteriormente.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={currentStep === 1 ? handleCancel : handleBack}
          disabled={isSubmitting}
        >
          {currentStep === 1 ? (
            <>Cancelar</>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </>
          )}
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={isSubmitting || isLoading}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button 
                variant="secondary" 
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Registar e Enviar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Descartar alterações?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Existem dados não guardados. Se sair agora, todas as alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar a editar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate("/documents")}
              className="bg-destructive hover:bg-destructive/90"
            >
              Descartar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
