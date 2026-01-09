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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileType,
  FolderTree,
  Info,
  ArrowUpDown,
  Filter,
  Lightbulb,
  Loader2,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
  Wand2,
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

interface ValidationIssue {
  type: "warning" | "info";
  title: string;
  description: string;
  affectedTypes: string[];
  classificationCode?: string;
  classificationName?: string;
}

interface ClassificationSuggestion {
  classificationId: string;
  classificationCode: string;
  classificationName: string;
  confidence: number;
  reason: string;
  similarTypes: string[];
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
  const [filterMode, setFilterMode] = useState<"all" | "unconfigured" | "with-suggestions">("all");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>("");
  const [showValidation, setShowValidation] = useState(true);
  const [sortColumn, setSortColumn] = useState<"name" | "code" | "state" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // Validation issues detection
  const validationIssues = useMemo(() => {
    const issues: ValidationIssue[] = [];
    
    // Group types by classification
    const typesByClassification = new Map<string, DocumentType[]>();
    documentTypes.forEach(type => {
      if (type.default_classification_id) {
        const existing = typesByClassification.get(type.default_classification_id) || [];
        existing.push(type);
        typesByClassification.set(type.default_classification_id, existing);
      }
    });

    // Check for overloaded classifications (same classification for many types)
    typesByClassification.forEach((types, classificationId) => {
      if (types.length >= 3) {
        const classification = classificationCodes.find(c => c.id === classificationId);
        issues.push({
          type: "warning",
          title: "Classificação sobrecarregada",
          description: `A classificação "${classification?.code || 'N/A'}" está atribuída a ${types.length} tipos de documento diferentes. Considere usar classificações mais específicas.`,
          affectedTypes: types.map(t => t.name),
          classificationCode: classification?.code,
          classificationName: classification?.name,
        });
      }
    });

    // Check for high-level classifications (level 1 only)
    documentTypes.forEach(type => {
      if (type.default_classification?.level === 1) {
        issues.push({
          type: "info",
          title: "Classificação genérica",
          description: `O tipo "${type.name}" usa uma classificação de nível 1, que é muito genérica. Considere usar uma subclassificação mais específica.`,
          affectedTypes: [type.name],
          classificationCode: type.default_classification.code,
          classificationName: type.default_classification.name,
        });
      }
    });

    // Check for similar document types without rules
    const unconfiguredTypes = documentTypes.filter(t => !t.default_classification_id);
    const configuredTypes = documentTypes.filter(t => t.default_classification_id);
    
    // Find potentially similar types (same prefix in code)
    const prefixGroups = new Map<string, { configured: DocumentType[]; unconfigured: DocumentType[] }>();
    documentTypes.forEach(type => {
      const prefix = type.code.substring(0, 2).toUpperCase();
      const group = prefixGroups.get(prefix) || { configured: [], unconfigured: [] };
      if (type.default_classification_id) {
        group.configured.push(type);
      } else {
        group.unconfigured.push(type);
      }
      prefixGroups.set(prefix, group);
    });

    prefixGroups.forEach((group, prefix) => {
      if (group.configured.length > 0 && group.unconfigured.length > 0) {
        // Suggest using same classification for similar types
        const suggestedClassification = group.configured[0].default_classification;
        if (suggestedClassification) {
          issues.push({
            type: "info",
            title: "Tipos similares sem regra",
            description: `Tipos com prefixo "${prefix}" têm configurações inconsistentes. ${group.unconfigured.length} tipo(s) sem regra poderiam usar "${suggestedClassification.code}".`,
            affectedTypes: group.unconfigured.map(t => t.name),
            classificationCode: suggestedClassification.code,
            classificationName: suggestedClassification.name,
          });
        }
      }
    });

    return issues;
  }, [documentTypes, classificationCodes]);

  // Generate suggestions for unconfigured types based on similar configured types
  const getSuggestionForType = useMemo(() => {
    return (typeId: string): ClassificationSuggestion | null => {
      const type = documentTypes.find(t => t.id === typeId);
      if (!type || type.default_classification_id) return null;

      const configuredTypes = documentTypes.filter(t => t.default_classification_id && t.default_classification);
      if (configuredTypes.length === 0) return null;

      const suggestions: Array<{
        classification: ClassificationCode;
        score: number;
        reasons: string[];
        similarTypes: string[];
      }> = [];

      // Helper to calculate word similarity
      const getWordSimilarity = (str1: string, str2: string): number => {
        const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
        return commonWords.length / Math.max(words1.length, 1);
      };

      // Helper to calculate prefix similarity
      const getPrefixSimilarity = (code1: string, code2: string): number => {
        const minLength = Math.min(code1.length, code2.length);
        let commonPrefix = 0;
        for (let i = 0; i < minLength; i++) {
          if (code1[i].toLowerCase() === code2[i].toLowerCase()) {
            commonPrefix++;
          } else {
            break;
          }
        }
        return commonPrefix / Math.max(code1.length, 1);
      };

      configuredTypes.forEach(configuredType => {
        if (!configuredType.default_classification) return;

        let score = 0;
        const reasons: string[] = [];

        // 1. Code prefix similarity (weight: 40%)
        const codeSimilarity = getPrefixSimilarity(type.code, configuredType.code);
        if (codeSimilarity >= 0.5) {
          score += codeSimilarity * 40;
          if (codeSimilarity >= 0.75) {
            reasons.push(`Código similar: ${configuredType.code}`);
          }
        }

        // 2. Name word similarity (weight: 35%)
        const nameSimilarity = getWordSimilarity(type.name, configuredType.name);
        if (nameSimilarity > 0) {
          score += nameSimilarity * 35;
          if (nameSimilarity >= 0.3) {
            reasons.push(`Nome similar: "${configuredType.name}"`);
          }
        }

        // 3. Description similarity if both have descriptions (weight: 15%)
        if (type.description && configuredType.description) {
          const descSimilarity = getWordSimilarity(type.description, configuredType.description);
          if (descSimilarity > 0) {
            score += descSimilarity * 15;
          }
        }

        // 4. First letter match bonus (weight: 10%)
        if (type.code[0]?.toLowerCase() === configuredType.code[0]?.toLowerCase()) {
          score += 10;
        }

        if (score > 20) {
          // Find existing suggestion for this classification
          const existingSuggestion = suggestions.find(
            s => s.classification.id === configuredType.default_classification!.id
          );

          if (existingSuggestion) {
            // Aggregate scores
            existingSuggestion.score = Math.max(existingSuggestion.score, score);
            existingSuggestion.similarTypes.push(configuredType.name);
            reasons.forEach(r => {
              if (!existingSuggestion.reasons.includes(r)) {
                existingSuggestion.reasons.push(r);
              }
            });
          } else {
            suggestions.push({
              classification: configuredType.default_classification,
              score,
              reasons,
              similarTypes: [configuredType.name],
            });
          }
        }
      });

      if (suggestions.length === 0) return null;

      // Sort by score and get the best one
      suggestions.sort((a, b) => b.score - a.score);
      const best = suggestions[0];

      // Confidence based on score (max 100)
      const confidence = Math.min(Math.round(best.score), 95);
      
      if (confidence < 25) return null;

      return {
        classificationId: best.classification.id,
        classificationCode: best.classification.code,
        classificationName: best.classification.name,
        confidence,
        reason: best.reasons.length > 0 
          ? best.reasons.slice(0, 2).join('; ') 
          : `Baseado em ${best.similarTypes.length} tipo(s) similar(es)`,
        similarTypes: best.similarTypes.slice(0, 3),
      };
    };
  }, [documentTypes]);

  // Get warning count for a specific type
  const getTypeWarnings = (typeId: string) => {
    return validationIssues.filter(issue => {
      const type = documentTypes.find(t => t.id === typeId);
      return type && issue.affectedTypes.includes(type.name);
    });
  };

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

  // Filter and sort document types
  const filteredTypes = useMemo(() => {
    let result = documentTypes;
    
    // Apply filter mode
    if (filterMode === "unconfigured") {
      result = result.filter(t => !t.default_classification_id);
    } else if (filterMode === "with-suggestions") {
      result = result.filter(t => !t.default_classification_id && getSuggestionForType(t.id) !== null);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (type) =>
          type.name.toLowerCase().includes(query) ||
          type.code.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        
        if (sortColumn === "name") {
          comparison = a.name.localeCompare(b.name, 'pt');
        } else if (sortColumn === "code") {
          comparison = a.code.localeCompare(b.code);
        } else if (sortColumn === "state") {
          // Sort by: configured (1), with suggestion (2), unconfigured (3)
          const getStateOrder = (type: DocumentType) => {
            if (type.default_classification_id) return 1;
            if (getSuggestionForType(type.id)) return 2;
            return 3;
          };
          comparison = getStateOrder(a) - getStateOrder(b);
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    
    return result;
  }, [documentTypes, searchQuery, filterMode, getSuggestionForType, sortColumn, sortDirection]);

  // Toggle sort function
  const toggleSort = (column: "name" | "code" | "state") => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Stats
  const stats = useMemo(() => {
    const configured = documentTypes.filter(t => t.default_classification_id).length;
    const unconfigured = documentTypes.filter(t => !t.default_classification_id).length;
    const warnings = validationIssues.filter(i => i.type === "warning").length;
    return { configured, unconfigured, total: documentTypes.length, warnings };
  }, [documentTypes, validationIssues]);

  // Get all available suggestions for unconfigured types
  const allSuggestions = useMemo(() => {
    const suggestions: Array<{ typeId: string; typeName: string; suggestion: ClassificationSuggestion }> = [];
    
    documentTypes.forEach(type => {
      if (!type.default_classification_id) {
        const suggestion = getSuggestionForType(type.id);
        if (suggestion) {
          suggestions.push({ typeId: type.id, typeName: type.name, suggestion });
        }
      }
    });
    
    return suggestions;
  }, [documentTypes, getSuggestionForType]);

  // Batch apply all suggestions mutation
  const batchApplySuggestions = useMutation({
    mutationFn: async (suggestions: Array<{ typeId: string; classificationId: string }>) => {
      const errors: string[] = [];
      let successCount = 0;

      for (const { typeId, classificationId } of suggestions) {
        const { error } = await supabase
          .from('document_types')
          .update({ default_classification_id: classificationId })
          .eq('id', typeId);
        
        if (error) {
          errors.push(error.message);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0 && successCount === 0) {
        throw new Error(errors.join('; '));
      }

      return { successCount, errorCount: errors.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['document-types-config'] });
      queryClient.invalidateQueries({ queryKey: ['document-types-with-rules'] });
      toast({
        title: "Sugestões aplicadas em lote",
        description: `${result.successCount} regra(s) configurada(s) com sucesso.${result.errorCount > 0 ? ` (${result.errorCount} erro(s))` : ''}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aplicar sugestões",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyAllSuggestions = () => {
    if (allSuggestions.length === 0) return;
    
    const updates = allSuggestions.map(({ typeId, suggestion }) => ({
      typeId,
      classificationId: suggestion.classificationId,
    }));
    
    batchApplySuggestions.mutate(updates);
  };

  const startEditing = (type: DocumentType) => {
    setEditingTypeId(type.id);
    setSelectedClassificationId(type.default_classification_id || "");
  };

  const startEditingWithSuggestion = (type: DocumentType, suggestion: ClassificationSuggestion) => {
    setEditingTypeId(type.id);
    setSelectedClassificationId(suggestion.classificationId);
    toast({
      title: "Sugestão aplicada",
      description: `Classificação "${suggestion.classificationCode}" sugerida com ${suggestion.confidence}% confiança.`,
    });
  };

  const applySuggestionDirectly = (typeId: string, suggestion: ClassificationSuggestion) => {
    updateDefaultClassification.mutate({
      typeId,
      classificationId: suggestion.classificationId,
    });
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
          <div className="grid grid-cols-4 gap-3">
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
            <div className={`p-3 rounded-lg border ${stats.warnings > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50 border-border'}`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className={`h-4 w-4 ${stats.warnings > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${stats.warnings > 0 ? 'text-destructive' : ''}`}>Alertas</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${stats.warnings > 0 ? 'text-destructive' : ''}`}>{stats.warnings}</p>
            </div>
          </div>

          {/* Batch Apply Suggestions Card */}
          {allSuggestions.length > 0 && (
            <div className="p-4 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Wand2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Aplicar Sugestões Automáticas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {allSuggestions.length} tipo(s) de documento têm sugestões baseadas em tipos similares
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {allSuggestions.slice(0, 4).map(({ typeName, suggestion }) => (
                        <TooltipProvider key={typeName}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-xs">
                                {typeName}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Sugestão: <span className="font-mono">{suggestion.classificationCode}</span> ({suggestion.confidence}%)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {allSuggestions.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{allSuggestions.length - 4} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={applyAllSuggestions}
                  disabled={batchApplySuggestions.isPending}
                  className="shrink-0"
                >
                  {batchApplySuggestions.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A aplicar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Aplicar Todas ({allSuggestions.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Validation Issues */}
          {validationIssues.length > 0 && (
            <Collapsible open={showValidation} onOpenChange={setShowValidation}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">
                      {validationIssues.length} problema(s) detectado(s)
                    </span>
                  </div>
                  {showValidation ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {validationIssues.map((issue, index) => (
                  <Alert
                    key={index}
                    className={
                      issue.type === "warning"
                        ? "border-warning/50 bg-warning/5"
                        : "border-info/50 bg-info/5"
                    }
                  >
                    {issue.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <Info className="h-4 w-4 text-info" />
                    )}
                    <AlertTitle className={issue.type === "warning" ? "text-warning" : "text-info"}>
                      {issue.title}
                      {issue.classificationCode && (
                        <Badge variant="outline" className="ml-2 font-mono text-xs">
                          {issue.classificationCode}
                        </Badge>
                      )}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {issue.description}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {issue.affectedTypes.slice(0, 5).map((typeName, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {typeName}
                          </Badge>
                        ))}
                        {issue.affectedTypes.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{issue.affectedTypes.length - 5} mais
                          </Badge>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar tipos de documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterMode} onValueChange={(value: "all" | "unconfigured" | "with-suggestions") => setFilterMode(value)}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    Todos os tipos
                    <Badge variant="secondary" className="text-xs">{stats.total}</Badge>
                  </span>
                </SelectItem>
                <SelectItem value="unconfigured">
                  <span className="flex items-center gap-2">
                    Sem regra
                    <Badge variant="outline" className="text-xs text-warning">{stats.unconfigured}</Badge>
                  </span>
                </SelectItem>
                <SelectItem value="with-suggestions">
                  <span className="flex items-center gap-2">
                    Com sugestões
                    <Badge variant="outline" className="text-xs text-primary">{allSuggestions.length}</Badge>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead className="w-[200px]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => toggleSort("name")}
                      >
                        Tipo de Documento
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortColumn === "name" ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => toggleSort("code")}
                      >
                        Classificação Padrão
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortColumn === "code" ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[80px] text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => toggleSort("state")}
                      >
                        Estado
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortColumn === "state" ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[150px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type) => {
                    const typeWarnings = getTypeWarnings(type.id);
                    const hasWarnings = typeWarnings.length > 0;
                    const suggestion = !type.default_classification_id ? getSuggestionForType(type.id) : null;
                    
                    return (
                      <TableRow key={type.id} className={hasWarnings ? "bg-warning/5" : suggestion ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${hasWarnings ? 'bg-warning/10' : 'bg-primary/10'}`}>
                              <FileType className={`h-4 w-4 ${hasWarnings ? 'text-warning' : 'text-primary'}`} />
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
                                      <Badge 
                                        variant={code.level === 1 ? "destructive" : "outline"} 
                                        className="text-xs ml-2"
                                      >
                                        Nível {code.level}
                                        {code.level === 1 && " (genérico)"}
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
                              {type.default_classification.level === 1 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="secondary" className="text-xs">
                                        Genérico
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Classificação de nível 1 - considere uma mais específica
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          ) : suggestion ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-primary" />
                                <Badge variant="outline" className="font-mono border-primary/50 text-primary">
                                  {suggestion.classificationCode}
                                </Badge>
                                <span className="text-sm text-primary">{suggestion.classificationName}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                        {suggestion.confidence}%
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <div className="space-y-2">
                                        <p className="font-medium text-xs">Sugestão automática</p>
                                        <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                                        {suggestion.similarTypes.length > 0 && (
                                          <div className="pt-1 border-t border-border">
                                            <p className="text-xs text-muted-foreground mb-1">Tipos similares:</p>
                                            <div className="flex flex-wrap gap-1">
                                              {suggestion.similarTypes.map((name, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                  {name}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <p className="text-xs text-muted-foreground pl-6">{suggestion.reason}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Sem classificação definida
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasWarnings ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="border-warning text-warning">
                                    <AlertTriangle className="h-3 w-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    {typeWarnings.map((w, i) => (
                                      <p key={i} className="text-xs">{w.title}</p>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : type.default_classification_id ? (
                            <Badge variant="outline" className="border-success text-success">
                              <CheckCircle2 className="h-3 w-3" />
                            </Badge>
                          ) : suggestion ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="border-primary text-primary">
                                    <Sparkles className="h-3 w-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Sugestão disponível</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                              <Info className="h-3 w-3" />
                            </Badge>
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
                              {suggestion && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-primary/90 hover:bg-primary"
                                        onClick={() => applySuggestionDirectly(type.id, suggestion)}
                                        disabled={updateDefaultClassification.isPending}
                                      >
                                        <Wand2 className="h-4 w-4 mr-1" />
                                        Aplicar
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Aplicar sugestão: {suggestion.classificationCode}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => suggestion ? startEditingWithSuggestion(type, suggestion) : startEditing(type)}
                              >
                                <Settings2 className="h-4 w-4 mr-1" />
                                {suggestion ? "Revisar" : "Editar"}
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
                    );
                  })}
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
