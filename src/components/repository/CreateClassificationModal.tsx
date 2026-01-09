import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useCreateClassification } from "@/hooks/useRepository";
import { ClassificationNode } from "@/hooks/useRepository";

const formSchema = z.object({
  code: z
    .string()
    .min(1, "O código é obrigatório")
    .regex(/^[\d.]+$/, "O código deve conter apenas números e pontos"),
  name: z.string().min(1, "O nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  retention_years: z.coerce.number().min(0).max(100).optional().nullable(),
  final_destination: z.enum(["permanent", "elimination", "sample", ""]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const finalDestinationOptions = [
  { value: "permanent", label: "Conservação Permanente" },
  { value: "elimination", label: "Eliminação" },
  { value: "sample", label: "Amostragem" },
];

interface CreateClassificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentClassification?: ClassificationNode | null;
}

export function CreateClassificationModal({
  open,
  onOpenChange,
  parentClassification,
}: CreateClassificationModalProps) {
  const createMutation = useCreateClassification();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: parentClassification ? `${parentClassification.code}.` : "",
      name: "",
      description: "",
      retention_years: null,
      final_destination: "",
    },
  });

  // Reset form when parent changes or modal opens
  useState(() => {
    if (open) {
      form.reset({
        code: parentClassification ? `${parentClassification.code}.` : "",
        name: "",
        description: "",
        retention_years: null,
        final_destination: "",
      });
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        code: values.code,
        name: values.name,
        description: values.description || null,
        parent_id: parentClassification?.id || null,
        level: parentClassification ? parentClassification.level + 1 : 1,
        retention_years: values.retention_years || null,
        final_destination: values.final_destination || null,
      });

      toast.success("Classificação criada com sucesso");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar classificação");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Nova Classificação
          </DialogTitle>
          <DialogDescription>
            {parentClassification
              ? `Criar sub-classificação de "${parentClassification.code} - ${parentClassification.name}"`
              : "Criar nova classificação de nível superior"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 100.10.01"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Código numérico hierárquico (ex: 100, 100.10, 100.10.01)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome da classificação"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional da classificação..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="retention_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de Retenção (anos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Ex: 5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="final_destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino Final</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Não definido</SelectItem>
                        {finalDestinationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Criar Classificação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
