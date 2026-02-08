import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { FieldHelp, fieldHelpTexts } from "@/components/common/FieldHelp";
import { QuickPick } from "@/components/common/QuickPick";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DocumentPriority,
  DocumentConfidentiality,
  documentPriorityLabels,
  confidentialityLabels,
} from "@/types/database";
import { useState } from "react";

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

interface WizardStepBasicDataProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  fieldErrors: FieldErrors;
  isSubmitting: boolean;
  documentTypes: Array<{ id: string; name: string; code: string }> | undefined;
  organizationalUnits: Array<{ id: string; name: string; code: string; level: number }> | undefined;
  classificationCodes: Array<{ id: string; name: string; code: string; level: number }> | undefined;
  loadingTypes: boolean;
  loadingUnits: boolean;
  loadingClassifications: boolean;
}

export function WizardStepBasicData({
  formData,
  updateFormData,
  fieldErrors,
  isSubmitting,
  documentTypes,
  organizationalUnits,
  classificationCodes,
  loadingTypes,
  loadingUnits,
  loadingClassifications,
}: WizardStepBasicDataProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const quickPickDocTypes = useMemo(() => {
    if (!documentTypes) return [];
    return documentTypes.slice(0, 3).map((t) => ({ id: t.id, label: t.name }));
  }, [documentTypes]);

  const quickPickUnits = useMemo(() => {
    if (!organizationalUnits) return [];
    return organizationalUnits
      .filter((u) => u.level === 1)
      .slice(0, 3)
      .map((u) => ({ id: u.id, label: u.name, subLabel: u.code }));
  }, [organizationalUnits]);

  const quickPickClassifications = useMemo(() => {
    if (!classificationCodes) return [];
    return classificationCodes
      .filter((c) => c.level === 1)
      .slice(0, 3)
      .map((c) => ({ id: c.id, label: c.name, subLabel: c.code }));
  }, [classificationCodes]);

  const hasDetailsData =
    formData.classificationId ||
    formData.priority !== "normal" ||
    formData.confidentiality !== "public" ||
    formData.subject ||
    formData.description ||
    formData.dueDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Dados Essenciais
        </CardTitle>
        <CardDescription>
          Preencha os campos obrigatórios para registar o documento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Essential Fields */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            placeholder="Título do documento"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            disabled={isSubmitting}
            className={cn(fieldErrors.title && "border-destructive focus:border-destructive focus:ring-destructive/20")}
          />
          {fieldErrors.title && (
            <p className="text-xs text-destructive">{fieldErrors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
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
                  <SelectTrigger id="type" className={cn(fieldErrors.documentTypeId && "border-destructive")}>
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
                {fieldErrors.documentTypeId && (
                  <p className="text-xs text-destructive">{fieldErrors.documentTypeId}</p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
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
                  <SelectTrigger id="currentUnit" className={cn(fieldErrors.currentUnitId && "border-destructive")}>
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
                {fieldErrors.currentUnitId && (
                  <p className="text-xs text-destructive">{fieldErrors.currentUnitId}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Collapsible Details Section */}
        <Collapsible open={detailsOpen || !!hasDetailsData} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
            >
              <span className="text-sm">
                Detalhes adicionais {!hasDetailsData && "(opcional)"}
              </span>
              {detailsOpen || hasDetailsData ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="confidentiality">Confidencialidade</Label>
                  <FieldHelp helpText={fieldHelpTexts.confidentiality} size="sm" />
                </div>
                <Select
                  value={formData.confidentiality}
                  onValueChange={(value) =>
                    updateFormData("confidentiality", value as DocumentConfidentiality)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="confidentiality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(confidentialityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto do documento"
                value={formData.subject}
                onChange={(e) => updateFormData("subject", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Data Limite</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateFormData("dueDate", e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
