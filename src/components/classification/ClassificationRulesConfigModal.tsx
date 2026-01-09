import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  FileType,
  FolderTree,
  Loader2,
  Save,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClassificationCode {
  id: string;
  code: string;
  name: string;
  level: number;
}

interface DocumentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_classification_id: string | null;
  default_classification?: ClassificationCode | null;
}

interface ClassificationRulesConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClassificationRulesConfigModal = ({
  open,
  onOpenChange,
}: ClassificationRulesConfigModalProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>("");

  // Fetch document types
  const { data: documentTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['document-types-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select(`
          id,
          code,
          name,
          description,
          default_classification_id,
          default_classification:classification_codes(id, code, name, level)
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as DocumentType[];
    },
    enabled: open,
  });

  // Fetch classification codes
  const { data: classificationCodes = [] } = useQuery({
    queryKey: ['classification-codes-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_codes')
        .select('id, code, name, level')
        .eq('is_active', true)
        .order('code');
      
      if (error) throw error;
      return data as ClassificationCode[];
    },
    enabled: open,
  });

  // Update mutation
  const updateDefaultClassification = useMutation({
    mutationFn: async ({ typeId, classificationId }: { typeId: string; classificationId: string | null }) => {
      const { error } = await supabase
        .from('document_types')
        .update({ default_classification_id: classificationId })
        .eq('id', typeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types-config'] });
      queryClient.invalidateQueries({ queryKey: ['document-types-with-rules'] });
      setEditingTypeId(null);
      setSelectedClassificationId("");
      toast({
        title: "Regra atualizada",
        description: "A classificação padrão foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter document types
  const filteredTypes = useMemo(() => {
    if (!searchQuery) return documentTypes;
    const query = searchQuery.toLowerCase();
    return documentTypes.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        type.code.toLowerCase().includes(query)
    );
  }, [documentTypes, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const configured = documentTypes.filter(t => t.default_classification_id).length;
    const unconfigured = documentTypes.filter(t => !t.default_classification_id).length;
    return { configured, unconfigured, total: documentTypes.length };
  }, [documentTypes]);

  const startEditing = (type: DocumentType) => {
    setEditingTypeId(type.id);
    setSelectedClassificationId(type.default_classification_id || "");
  };

  const cancelEditing = () => {
    setEditingTypeId(null);
    setSelectedClassificationId("");
  };

  const saveRule = () => {
    if (!editingTypeId) return;
    updateDefaultClassification.mutate({
      typeId: editingTypeId,
      classificationId: selectedClassificationId || null,
    });
  };

  const removeRule = (typeId: string) => {
    updateDefaultClassification.mutate({
      typeId,
      classificationId: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar Regras de Classificação
          </DialogTitle>
          <DialogDescription>
            Configure classificações padrão para cada tipo de documento. 
            Documentos deste tipo serão automaticamente sugeridos para esta classificação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <FileType className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Configurados</span>
              </div>
              <p className="text-2xl font-bold text-success mt-1">{stats.configured}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Sem regra</span>
              </div>
              <p className="text-2xl font-bold text-warning mt-1">{stats.unconfigured}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tipos de documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Separator />

          {/* Table */}
          <ScrollArea className="flex-1">
            {isLoadingTypes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileType className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Nenhum tipo de documento encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? "Tente uma pesquisa diferente" : "Configure tipos de documento primeiro"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Tipo de Documento</TableHead>
                    <TableHead>Classificação Padrão</TableHead>
                    <TableHead className="w-[150px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileType className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{type.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{type.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingTypeId === type.id ? (
                          <Select
                            value={selectedClassificationId}
                            onValueChange={setSelectedClassificationId}
                          >
                            <SelectTrigger className="w-full max-w-md">
                              <SelectValue placeholder="Selecione uma classificação..." />
                            </SelectTrigger>
                            <SelectContent>
                              {classificationCodes.map((code) => (
                                <SelectItem key={code.id} value={code.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {code.code}
                                    </span>
                                    <span>{code.name}</span>
                                    <Badge variant="outline" className="text-xs ml-2">
                                      Nível {code.level}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : type.default_classification ? (
                          <div className="flex items-center gap-2">
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="font-mono">
                              {type.default_classification.code}
                            </Badge>
                            <span className="text-sm">{type.default_classification.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Sem classificação definida
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingTypeId === type.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={updateDefaultClassification.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveRule}
                              disabled={updateDefaultClassification.isPending}
                            >
                              {updateDefaultClassification.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(type)}
                            >
                              <Settings2 className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            {type.default_classification_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeRule(type.id)}
                                disabled={updateDefaultClassification.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
