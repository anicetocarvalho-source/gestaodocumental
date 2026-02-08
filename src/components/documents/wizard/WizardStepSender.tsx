import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Building } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface WizardStepSenderProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  isSubmitting: boolean;
  organizationalUnits: Array<{ id: string; name: string; code: string }> | undefined;
  loadingUnits: boolean;
}

export function WizardStepSender({
  formData,
  updateFormData,
  isSubmitting,
  organizationalUnits,
  loadingUnits,
}: WizardStepSenderProps) {
  return (
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
        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <Label htmlFor="senderName">Nome do Remetente</Label>
          <Input
            id="senderName"
            placeholder="Nome da pessoa ou entidade"
            value={formData.senderName}
            onChange={(e) => updateFormData("senderName", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senderInstitution">Instituição</Label>
          <Input
            id="senderInstitution"
            placeholder="Nome da instituição"
            value={formData.senderInstitution}
            onChange={(e) => updateFormData("senderInstitution", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
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
  );
}
