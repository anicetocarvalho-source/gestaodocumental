import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDocumentTypes, useOrganizationalUnits, useClassificationCodes } from "@/hooks/useReferenceData";
import { useCreateDocument } from "@/hooks/useDocuments";
import { useUploadDocumentFile } from "@/hooks/useFileUpload";
import {
  DocumentPriority,
  DocumentConfidentiality,
} from "@/types/database";
import {
  FileText,
  Upload,
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import { WizardStepIndicator } from "./wizard/WizardStepIndicator";
import { WizardStepBasicData } from "./wizard/WizardStepBasicData";
import { WizardStepFiles } from "./wizard/WizardStepFiles";
import { WizardStepSender } from "./wizard/WizardStepSender";
import { WizardStepReview } from "./wizard/WizardStepReview";
import { WizardAISuggestions } from "./wizard/WizardAISuggestions";

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

interface FieldErrors {
  [key: string]: string | undefined;
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

const steps = [
  { id: 1, title: "Dados", description: "Título, tipo e classificação", icon: FileText },
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const updateFormData = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user types
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleAnalysisComplete = useCallback((analysis: {
    extracted_fields?: { title?: string; subject?: string; sender?: string };
    classification_suggestion?: { code?: string; category?: string };
    sensitivity_level?: string;
  }) => {
    setFormData((prev) => {
      const updates: Partial<FormData> = {};
      if (analysis.extracted_fields?.title && !prev.title) {
        updates.title = analysis.extracted_fields.title;
      }
      if (analysis.extracted_fields?.subject && !prev.subject) {
        updates.subject = analysis.extracted_fields.subject;
      }
      if (analysis.extracted_fields?.sender && !prev.senderName) {
        updates.senderName = analysis.extracted_fields.sender;
      }
      if (analysis.sensitivity_level && prev.confidentiality === "public") {
        const sensitivityMap: Record<string, string> = {
          "público": "public",
          "interno": "internal",
          "restrito": "restricted",
          "confidencial": "confidential",
        };
        const mapped = sensitivityMap[analysis.sensitivity_level.toLowerCase()];
        if (mapped && mapped !== "public") {
          updates.confidentiality = mapped as DocumentConfidentiality;
        }
      }
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, []);

  const validateStep = (step: number): boolean => {
    const errors: FieldErrors = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        errors.title = "O título é obrigatório";
      }
      if (!formData.documentTypeId) {
        errors.documentTypeId = "Seleccione o tipo de documento";
      }
      if (!formData.currentUnitId) {
        errors.currentUnitId = "Seleccione a unidade de destino";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStepClick = (stepId: number) => {
    // Going backwards is always allowed
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      return;
    }
    // Going forward: validate current step first, then allow skip
    if (stepId > currentStep) {
      // Must validate step 1 before skipping ahead
      if (currentStep === 1 || stepId > currentStep) {
        if (validateStep(1)) {
          setCurrentStep(stepId);
        }
      }
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Re-validate step 1 before final submission
    if (!validateStep(1)) {
      setCurrentStep(1);
      toast.error("Por favor corrija os campos obrigatórios");
      return;
    }

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
    const hasData =
      formData.title || formData.subject || formData.description || uploadedFiles.length > 0;
    if (hasData) {
      setCancelDialogOpen(true);
    } else {
      navigate("/documents");
    }
  };

  const getDocumentTypeName = (id: string) =>
    documentTypes?.find((t) => t.id === id)?.name || "-";
  const getUnitName = (id: string) =>
    organizationalUnits?.find((u) => u.id === id)?.name || "-";
  const getClassificationName = (id: string) =>
    classificationCodes?.find((c) => c.id === id)?.name || "-";

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <WizardStepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <WizardStepBasicData
              formData={formData}
              updateFormData={updateFormData}
              fieldErrors={fieldErrors}
              isSubmitting={isSubmitting}
              documentTypes={documentTypes}
              organizationalUnits={organizationalUnits}
              classificationCodes={classificationCodes}
              loadingTypes={loadingTypes}
              loadingUnits={loadingUnits}
              loadingClassifications={loadingClassifications}
            />
          )}

          {currentStep === 2 && (
            <WizardStepFiles
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 3 && (
            <WizardStepSender
              formData={formData}
              updateFormData={updateFormData}
              isSubmitting={isSubmitting}
              organizationalUnits={organizationalUnits}
              loadingUnits={loadingUnits}
            />
          )}

          {currentStep === 4 && (
            <WizardStepReview
              formData={formData}
              uploadedFiles={uploadedFiles}
              getDocumentTypeName={getDocumentTypeName}
              getUnitName={getUnitName}
              getClassificationName={getClassificationName}
            />
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <WizardAISuggestions
            uploadedFiles={uploadedFiles}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onAnalysisComplete={handleAnalysisComplete}
            disabled={isSubmitting}
          />

          {/* Help */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Precisa de ajuda?</p>
                  <p>
                    Campos marcados com * são obrigatórios. Os passos opcionais (Ficheiros e Remetente) podem ser saltados clicando directamente em "Revisão".
                  </p>
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
            <>
              {/* Skip to review button for optional steps */}
              {currentStep > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => handleStepClick(4)}
                  disabled={isSubmitting || isLoading}
                  className="text-muted-foreground"
                >
                  Saltar para revisão
                </Button>
              )}
              <Button onClick={handleNext} disabled={isSubmitting || isLoading}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || isLoading} size="lg">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Registar Documento
            </Button>
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
