import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, File } from "lucide-react";
import { documentPriorityLabels, confidentialityLabels } from "@/types/database";

interface FormData {
  title: string;
  documentTypeId: string;
  classificationId: string;
  originUnitId: string;
  currentUnitId: string;
  priority: string;
  confidentiality: string;
  subject: string;
  description: string;
  senderName: string;
  senderInstitution: string;
  externalReference: string;
  dueDate: string;
}

interface WizardStepReviewProps {
  formData: FormData;
  uploadedFiles: File[];
  getDocumentTypeName: (id: string) => string;
  getUnitName: (id: string) => string;
  getClassificationName: (id: string) => string;
}

export function WizardStepReview({
  formData,
  uploadedFiles,
  getDocumentTypeName,
  getUnitName,
  getClassificationName,
}: WizardStepReviewProps) {
  return (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                {documentPriorityLabels[formData.priority as keyof typeof documentPriorityLabels]}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Confidencialidade</p>
              <Badge variant="outline">
                {confidentialityLabels[formData.confidentiality as keyof typeof confidentialityLabels]}
              </Badge>
            </div>
          </div>

          {formData.subject && (
            <div className="text-sm">
              <p className="text-muted-foreground">Assunto</p>
              <p className="font-medium">{formData.subject}</p>
            </div>
          )}

          {formData.description && (
            <div className="text-sm">
              <p className="text-muted-foreground">Descrição</p>
              <p className="font-medium">{formData.description}</p>
            </div>
          )}

          {(formData.senderName || formData.senderInstitution) && (
            <div className="text-sm border-t pt-3">
              <p className="text-muted-foreground font-medium mb-2">Remetente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.senderName && (
                  <div>
                    <p className="text-muted-foreground text-xs">Nome</p>
                    <p className="font-medium">{formData.senderName}</p>
                  </div>
                )}
                {formData.senderInstitution && (
                  <div>
                    <p className="text-muted-foreground text-xs">Instituição</p>
                    <p className="font-medium">{formData.senderInstitution}</p>
                  </div>
                )}
                {formData.externalReference && (
                  <div>
                    <p className="text-muted-foreground text-xs">Referência Externa</p>
                    <p className="font-medium">{formData.externalReference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.dueDate && (
            <div className="text-sm">
              <p className="text-muted-foreground">Data Limite</p>
              <p className="font-medium">
                {new Date(formData.dueDate).toLocaleDateString("pt-PT")}
              </p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="text-sm border-t pt-3">
              <p className="text-muted-foreground mb-2">
                Ficheiros ({uploadedFiles.length})
              </p>
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
  );
}
