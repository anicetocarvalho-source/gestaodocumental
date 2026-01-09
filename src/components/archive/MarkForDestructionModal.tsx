import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addYears } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon, Trash2, Scale, FileWarning, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Document } from "@/types/database";

const formSchema = z.object({
  scheduledDate: z.date({
    required_error: "Seleccione a data prevista para eliminação",
  }),
  retentionReason: z.string().optional(),
  destructionReason: z.string().min(10, "Descreva a razão da eliminação (mínimo 10 caracteres)"),
  legalBasis: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MarkForDestructionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Document[];
  onConfirm: (data: {
    documentIds: string[];
    scheduledDate: Date;
    retentionReason?: string;
    destructionReason: string;
    legalBasis?: string;
    notes?: string;
  }) => Promise<void>;
  isPending?: boolean;
}

const RETENTION_PRESETS = [
  { label: "1 ano", years: 1 },
  { label: "3 anos", years: 3 },
  { label: "5 anos", years: 5 },
  { label: "7 anos", years: 7 },
  { label: "10 anos", years: 10 },
  { label: "25 anos", years: 25 },
];

const LEGAL_BASIS_OPTIONS = [
  { value: "lei_arquivos", label: "Lei dos Arquivos (Lei nº 12/2020)" },
  { value: "rgpd", label: "RGPD - Regulamento Geral de Protecção de Dados" },
  { value: "prazo_legal", label: "Prazo legal de conservação expirado" },
  { value: "tabela_temporalidade", label: "Tabela de temporalidade institucional" },
  { value: "despacho_superior", label: "Despacho superior" },
  { value: "outro", label: "Outro" },
];

export function MarkForDestructionModal({
  open,
  onOpenChange,
  documents,
  onConfirm,
  isPending,
}: MarkForDestructionModalProps) {
  const [showOtherLegalBasis, setShowOtherLegalBasis] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduledDate: addYears(new Date(), 1),
      retentionReason: "",
      destructionReason: "",
      legalBasis: "",
      notes: "",
    },
  });

  const handlePresetClick = (years: number) => {
    form.setValue("scheduledDate", addYears(new Date(), years));
  };

  const handleLegalBasisChange = (value: string) => {
    if (value === "outro") {
      setShowOtherLegalBasis(true);
      form.setValue("legalBasis", "");
    } else {
      setShowOtherLegalBasis(false);
      const option = LEGAL_BASIS_OPTIONS.find((o) => o.value === value);
      form.setValue("legalBasis", option?.label || "");
    }
  };

  const onSubmit = async (values: FormValues) => {
    await onConfirm({
      documentIds: documents.map((d) => d.id),
      scheduledDate: values.scheduledDate,
      retentionReason: values.retentionReason,
      destructionReason: values.destructionReason,
      legalBasis: values.legalBasis,
      notes: values.notes,
    });
    form.reset();
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      setShowOtherLegalBasis(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Marcar para Eliminação
          </DialogTitle>
          <DialogDescription>
            Configure o período de retenção e a data prevista para eliminação dos documentos seleccionados.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Documents Summary */}
        <div className="p-3 bg-muted rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <FileWarning className="h-4 w-4 text-warning" />
            <span className="font-medium text-sm">
              {documents.length} documento{documents.length > 1 ? "s" : ""} seleccionado{documents.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {documents.slice(0, 5).map((doc) => (
              <Badge key={doc.id} variant="secondary" className="text-xs">
                {doc.entry_number}
              </Badge>
            ))}
            {documents.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{documents.length - 5} mais
              </Badge>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Retention Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período de Retenção</label>
              <div className="flex flex-wrap gap-2">
                {RETENTION_PRESETS.map((preset) => (
                  <Button
                    key={preset.years}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset.years)}
                    className="h-7 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Scheduled Date */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Prevista de Eliminação *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: pt })
                          ) : (
                            <span>Seleccione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Data a partir da qual o documento poderá ser eliminado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Legal Basis */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                Base Legal
              </label>
              <Select onValueChange={handleLegalBasisChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione a base legal" />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_BASIS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showOtherLegalBasis && (
                <FormField
                  control={form.control}
                  name="legalBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Especifique a base legal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Destruction Reason */}
            <FormField
              control={form.control}
              name="destructionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão da Eliminação *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva a razão pela qual o documento deve ser eliminado..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Notas adicionais (opcional)..."
                      className="resize-none"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar para Eliminação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
