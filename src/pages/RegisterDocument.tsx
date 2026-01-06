import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTypes, useOrganizationalUnits, useClassificationCodes } from "@/hooks/useReferenceData";
import { useCreateDocument } from "@/hooks/useDocuments";
import { useUploadDocumentFile } from "@/hooks/useFileUpload";
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
  AlertCircle
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

const RegisterDocument = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados de referência
  const { data: documentTypes, isLoading: loadingTypes } = useDocumentTypes({ activeOnly: true });
  const { data: organizationalUnits, isLoading: loadingUnits } = useOrganizationalUnits({ activeOnly: true });
  const { data: classificationCodes, isLoading: loadingClassifications } = useClassificationCodes({ activeOnly: true });
  
  // Mutations
  const createDocument = useCreateDocument();
  const uploadFile = useUploadDocumentFile();

  const isLoading = loadingTypes || loadingUnits || loadingClassifications;

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
    // Reset input to allow re-selecting same file
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

  const validateForm = (): boolean => {
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
  };

  const handleSave = async () => {
    if (!validateForm()) return;

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

  const handleSend = async () => {
    if (!validateForm()) return;
    await handleSave();
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

  return (
    <DashboardLayout 
      title="Registar Novo Documento" 
      subtitle="Registe um novo documento no sistema"
    >
      <PageBreadcrumb 
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Registar Novo Documento" }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Document Metadata Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                Dados do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
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

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Documento *</Label>
                {loadingTypes ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
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
                )}
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <Label htmlFor="classification">Classificação</Label>
                {loadingClassifications ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
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
                )}
              </div>

              {/* Origin Unit */}
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

              {/* Current/Destination Unit */}
              <div className="space-y-2">
                <Label htmlFor="currentUnit">Unidade de Destino *</Label>
                {loadingUnits ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={formData.currentUnitId} 
                    onValueChange={(value) => updateFormData("currentUnitId", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="currentUnit">
                      <SelectValue placeholder="Seleccione a unidade de destino" />
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

              {/* Priority & Confidentiality Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
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
                  <Label htmlFor="confidentiality">Confidencialidade</Label>
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

              {/* Subject */}
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

              {/* Description */}
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

              {/* Due Date */}
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

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags Selecionadas</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" aria-hidden="true" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sender Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informação do Remetente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={handleSave}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Guardar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSend}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Registar e Enviar
            </Button>
          </div>

          {/* Audit Log Reference */}
          <AuditLogReference context="Ver histórico de registos" />
        </div>

        {/* Right Panel - Upload and Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
                Upload de Ficheiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
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
                    <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arraste e solte ficheiros aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou clique para seleccionar
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 20MB por ficheiro)
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg"
                    >
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {index === 0 ? (
                          <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                        ) : (
                          <File className="h-5 w-5 text-primary" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">Principal</Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isSubmitting}
                        aria-label="Remover ficheiro"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
                  Pré-visualização
                </CardTitle>
                {uploadedFiles.length > 0 && (
                  <Button variant="outline" size="sm" disabled>
                    Visualizar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/50 border border-border rounded-lg flex items-center justify-center">
                {uploadedFiles.length > 0 ? (
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                      <File className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {uploadedFiles[0].name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadedFiles.length > 1 
                          ? `+ ${uploadedFiles.length - 1} outro${uploadedFiles.length > 2 ? 's' : ''} ficheiro${uploadedFiles.length > 2 ? 's' : ''}`
                          : "Ficheiro principal"
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <File className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum ficheiro carregado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Tag Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" aria-hidden="true" />
                  Sugestões de Tags (IA)
                </CardTitle>
                <Badge variant="warning" className="text-xs">
                  Assistido por IA
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Com base no conteúdo do documento, sugerimos as seguintes tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleTagToggle(tag.label)}
                    disabled={isSubmitting}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors disabled:opacity-50 ${
                      selectedTags.includes(tag.label)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    <span>{tag.label}</span>
                    <span className={`text-xs ${
                      selectedTags.includes(tag.label) 
                        ? 'text-primary-foreground/80' 
                        : 'text-muted-foreground'
                    }`}>
                      {tag.confidence}%
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Clique nas tags para adicioná-las ao documento. A percentagem indica a confiança da sugestão.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
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
    </DashboardLayout>
  );
};

export default RegisterDocument;
