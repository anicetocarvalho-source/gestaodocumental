import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layers,
  FolderTree,
  Save,
  RotateCcw,
  Info,
  ExternalLink,
  Loader2,
  Copy,
  Search,
  Filter,
  History,
  Clock,
  User,
  Eye,
  Calendar,
  Building2,
  FileType,
  X,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ClassificationHistoryEntry {
  id: string;
  document_id: string;
  old_classification_id: string | null;
  new_classification_id: string;
  changed_by: string;
  change_reason: string | null;
  created_at: string;
  old_classification?: ClassificationCode | null;
  new_classification?: ClassificationCode | null;
  profile?: { full_name: string } | null;
}

interface ClassificationCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: number;
  parent_id: string | null;
  is_active: boolean;
  retention_years: number | null;
  final_destination: string | null;
}

interface Document {
  id: string;
  entry_number: string;
  title: string;
  classification_id: string | null;
  status: string;
  created_at: string;
  selected: boolean;
  classification?: ClassificationCode | null;
}

interface ValidationError {
  field: string;
  message: string;
  type: "error" | "warning";
}

const DocumentClassification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubclass, setSelectedSubclass] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState<string>("all");
  const [historyUserFilter, setHistoryUserFilter] = useState<string>("all");
  const [aiSuggestion, setAiSuggestion] = useState<{
    classificationId: string;
    code: string;
    name: string;
    confidence: number;
    path: string[];
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [changeReason, setChangeReason] = useState("");
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  // Fetch current user profile
  const { data: currentProfile } = useQuery({
    queryKey: ['current-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch classification codes
  const { data: classificationCodes = [] } = useQuery({
    queryKey: ['classification-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_codes')
        .select('*')
        .eq('is_active', true)
        .order('code');
      
      if (error) throw error;
      return data as ClassificationCode[];
    }
  });

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents-for-classification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          entry_number,
          title,
          classification_id,
          status,
          created_at,
          classification:classification_codes(id, code, name, level)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(doc => ({
        ...doc,
        selected: false,
        classification: doc.classification as ClassificationCode | null
      })) as Document[];
    }
  });

  // Fetch classification history
  const { data: classificationHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['classification-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_history')
        .select(`
          id,
          document_id,
          old_classification_id,
          new_classification_id,
          changed_by,
          change_reason,
          created_at,
          old_classification:classification_codes!classification_history_old_classification_id_fkey(id, code, name),
          new_classification:classification_codes!classification_history_new_classification_id_fkey(id, code, name),
          profile:profiles!classification_history_changed_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ClassificationHistoryEntry[];
    },
    enabled: showHistory
  });

  // Fetch document preview details
  const { data: previewDocument, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['document-preview', previewDocId],
    queryFn: async () => {
      if (!previewDocId) return null;
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          entry_number,
          title,
          description,
          status,
          priority,
          confidentiality,
          created_at,
          entry_date,
          origin,
          sender_name,
          sender_institution,
          external_reference,
          classification_id,
          classification:classification_codes(id, code, name, description),
          document_type:document_types(id, code, name),
          origin_unit:organizational_units!documents_origin_unit_id_fkey(id, name, code),
          current_unit:organizational_units!documents_current_unit_id_fkey(id, name, code),
          created_by_profile:profiles!documents_created_by_fkey(id, full_name),
          responsible_user:profiles!documents_responsible_user_id_fkey(id, full_name)
        `)
        .eq('id', previewDocId)
        .single();
      
      if (error) throw error;
      
      // Fetch document files
      const { data: files } = await supabase
        .from('document_files')
        .select('*')
        .eq('document_id', previewDocId)
        .order('created_at', { ascending: false });
      
      return { ...data, files: files || [] };
    },
    enabled: !!previewDocId
  });

  const historyUsers = useMemo(() => {
    const users = new Map<string, string>();
    classificationHistory.forEach(entry => {
      if (entry.changed_by && entry.profile?.full_name) {
        users.set(entry.changed_by, entry.profile.full_name);
      }
    });
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, [classificationHistory]);

  // Filter history by period and user
  const filteredHistory = useMemo(() => {
    return classificationHistory.filter(entry => {
      // Filter by period
      if (historyPeriod !== "all") {
        const entryDate = new Date(entry.created_at);
        const now = new Date();
        
        switch (historyPeriod) {
          case "today":
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (entryDate < todayStart) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (entryDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (entryDate < monthAgo) return false;
            break;
        }
      }
      
      // Filter by user
      if (historyUserFilter !== "all" && entry.changed_by !== historyUserFilter) {
        return false;
      }
      
      return true;
    });
  }, [classificationHistory, historyPeriod, historyUserFilter]);

  // Build classification hierarchy
  const classHierarchy = useMemo(() => {
    const level1 = classificationCodes.filter(c => c.level === 1);
    const level2 = classificationCodes.filter(c => c.level === 2);
    const level3 = classificationCodes.filter(c => c.level === 3);
    
    return { level1, level2, level3 };
  }, [classificationCodes]);

  // Get subclasses for selected class
  const availableSubclasses = useMemo(() => {
    if (!selectedClass) return [];
    return classHierarchy.level2.filter(c => c.parent_id === selectedClass);
  }, [selectedClass, classHierarchy.level2]);

  // Get tipos for selected subclass
  const availableTipos = useMemo(() => {
    if (!selectedSubclass) return [];
    return classHierarchy.level3.filter(c => c.parent_id === selectedSubclass);
  }, [selectedSubclass, classHierarchy.level3]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchQuery === "" || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.entry_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "classified" && doc.classification_id) ||
        (statusFilter === "unclassified" && !doc.classification_id);
      
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const classified = documents.filter(d => d.classification_id).length;
    const unclassified = documents.filter(d => !d.classification_id).length;
    const total = documents.length;
    const progress = total > 0 ? Math.round((classified / total) * 100) : 0;
    return { classified, unclassified, total, progress };
  }, [documents]);

  const selectedCount = selectedDocIds.size;

  // Get full classification code
  const fullClassificationCode = useMemo(() => {
    const code = classificationCodes.find(c => 
      c.id === selectedTipo || c.id === selectedSubclass || c.id === selectedClass
    );
    return code?.code || "";
  }, [selectedClass, selectedSubclass, selectedTipo, classificationCodes]);

  const selectedClassificationId = selectedTipo || selectedSubclass || selectedClass;

  // Fetch reason suggestions based on selected classification
  const { data: reasonSuggestions = [] } = useQuery({
    queryKey: ['reason-suggestions', selectedClassificationId],
    queryFn: async () => {
      if (!selectedClassificationId) return [];
      
      const { data, error } = await supabase
        .from('classification_history')
        .select('change_reason')
        .eq('new_classification_id', selectedClassificationId)
        .not('change_reason', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Get unique reasons with count, filtered for minimum length
      const reasonCounts = new Map<string, number>();
      data.forEach(entry => {
        const reason = entry.change_reason?.trim();
        if (reason && reason.length >= 5) {
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        }
      });
      
      // Sort by frequency and return top 5
      return Array.from(reasonCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));
    },
    enabled: !!selectedClassificationId
  });

  const updateClassification = useMutation({
    mutationFn: async ({ documentIds, classificationId, reason }: { documentIds: string[], classificationId: string, reason: string }) => {
      if (!currentProfile?.id) throw new Error("Utilizador não autenticado");

      // Get current classifications for history
      const docsToUpdate = documents.filter(d => documentIds.includes(d.id));
      
      // Update documents
      const { error: updateError } = await supabase
        .from('documents')
        .update({ classification_id: classificationId })
        .in('id', documentIds);
      
      if (updateError) throw updateError;

      // Insert history entries with reason
      const historyEntries = docsToUpdate.map(doc => ({
        document_id: doc.id,
        old_classification_id: doc.classification_id,
        new_classification_id: classificationId,
        changed_by: currentProfile.id,
        change_reason: reason.trim(),
      }));

      const { error: historyError } = await supabase
        .from('classification_history')
        .insert(historyEntries);
      
      if (historyError) {
        console.error('Failed to insert history:', historyError);
        // Don't throw - classification was successful
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-for-classification'] });
      queryClient.invalidateQueries({ queryKey: ['classification-history'] });
      setSelectedDocIds(new Set());
      resetClassification();
      toast({
        title: "Classificação guardada",
        description: `${selectedCount} documento(s) classificado(s) com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao guardar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleDocument = (id: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedDocIds(new Set(filteredDocuments.map(d => d.id)));
  };

  const deselectAll = () => {
    setSelectedDocIds(new Set());
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubclass("");
    setSelectedTipo("");
    setAiSuggestion(null);
    validateClassification(value, "", "");
  };

  const handleSubclassChange = (value: string) => {
    setSelectedSubclass(value);
    setSelectedTipo("");
    validateClassification(selectedClass, value, "");
  };

  const handleTipoChange = (value: string) => {
    setSelectedTipo(value);
    validateClassification(selectedClass, selectedSubclass, value);
  };

  const validateClassification = (classVal: string, subclass: string, tipo: string) => {
    const errors: ValidationError[] = [];

    if (!classVal) {
      errors.push({ field: "class", message: "Classe é obrigatória", type: "error" });
    }

    if (classVal && !subclass) {
      errors.push({ field: "subclass", message: "Subclasse é recomendada para classificação completa", type: "warning" });
    }

    setValidationErrors(errors);
  };

  const handleAiAnalysis = async () => {
    if (selectedDocIds.size === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      // Get first selected document for analysis
      const docId = Array.from(selectedDocIds)[0];
      const doc = documents.find(d => d.id === docId);
      
      if (!doc) throw new Error("Documento não encontrado");

      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { ocrText: doc.title + " " + (doc.entry_number || "") }
      });

      if (error) throw error;

      // Find matching classification
      const suggestedCode = data.analysis?.classification_suggestion?.code;
      if (suggestedCode) {
        const matchingClass = classificationCodes.find(c => 
          c.code.startsWith(suggestedCode.split('.')[0])
        );
        
        if (matchingClass) {
          setAiSuggestion({
            classificationId: matchingClass.id,
            code: matchingClass.code,
            name: matchingClass.name,
            confidence: Math.round((data.analysis?.confidence || 0.7) * 100),
            path: [matchingClass.name]
          });
        }
      } else {
        // Fallback suggestion based on document title patterns
        const fallbackClass = classHierarchy.level1[0];
        if (fallbackClass) {
          setAiSuggestion({
            classificationId: fallbackClass.id,
            code: fallbackClass.code,
            name: fallbackClass.name,
            confidence: 65,
            path: [fallbackClass.name]
          });
        }
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      // Provide fallback suggestion
      const fallbackClass = classHierarchy.level1[0];
      if (fallbackClass) {
        setAiSuggestion({
          classificationId: fallbackClass.id,
          code: fallbackClass.code,
          name: fallbackClass.name,
          confidence: 60,
          path: [fallbackClass.name]
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setSelectedClass(aiSuggestion.classificationId);
      setSelectedSubclass("");
      setSelectedTipo("");
      validateClassification(aiSuggestion.classificationId, "", "");
      toast({
        title: "Sugestão aplicada",
        description: "A classificação sugerida pela IA foi aplicada.",
      });
    }
  };

  const resetClassification = () => {
    setSelectedClass("");
    setSelectedSubclass("");
    setSelectedTipo("");
    setAiSuggestion(null);
    setValidationErrors([]);
    setChangeReason("");
  };

  const saveClassification = () => {
    const hasErrors = validationErrors.some((e) => e.type === "error");
    if (hasErrors) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros antes de guardar.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClassificationId) {
      toast({
        title: "Classificação incompleta",
        description: "Seleccione pelo menos uma classe.",
        variant: "destructive",
      });
      return;
    }

    const trimmedReason = changeReason.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      toast({
        title: "Motivo obrigatório",
        description: "Indique um motivo para a classificação (mínimo 5 caracteres).",
        variant: "destructive",
      });
      return;
    }

    if (trimmedReason.length > 500) {
      toast({
        title: "Motivo demasiado longo",
        description: "O motivo não pode exceder 500 caracteres.",
        variant: "destructive",
      });
      return;
    }

    updateClassification.mutate({
      documentIds: Array.from(selectedDocIds),
      classificationId: selectedClassificationId,
      reason: trimmedReason
    });
  };

  const copyCode = () => {
    if (fullClassificationCode) {
      navigator.clipboard.writeText(fullClassificationCode);
      toast({
        title: "Código copiado",
        description: fullClassificationCode,
      });
    }
  };

  const getClassificationPath = () => {
    const parts: string[] = [];
    if (selectedClass) {
      const cls = classificationCodes.find((c) => c.id === selectedClass);
      if (cls) parts.push(cls.name);
    }
    if (selectedSubclass) {
      const sub = classificationCodes.find((s) => s.id === selectedSubclass);
      if (sub) parts.push(sub.name);
    }
    if (selectedTipo) {
      const tipo = classificationCodes.find((t) => t.id === selectedTipo);
      if (tipo) parts.push(tipo.name);
    }
    return parts;
  };

  return (
    <DashboardLayout title="Classificação de Documentos" subtitle="Módulo de classificação segundo taxonomia ministerial">
      {/* Progress Overview */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">{stats.classified} classificados</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">{stats.unclassified} pendentes</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{stats.progress}% completo</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Documentos</CardTitle>
                  <CardDescription>{selectedCount} seleccionado(s)</CardDescription>
                </div>
                <Badge variant="outline">{filteredDocuments.length} de {documents.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search and Filter */}
              <div className="px-4 pb-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar documentos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os documentos</SelectItem>
                    <SelectItem value="unclassified">Por classificar</SelectItem>
                    <SelectItem value="classified">Classificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 px-4 pb-3">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                  Seleccionar todos
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll}>
                  Limpar selecção
                </Button>
              </div>
              <Separator />
              <ScrollArea className="h-[400px]">
                {isLoadingDocs ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum documento encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedDocIds.has(doc.id)}
                          onCheckedChange={() => toggleDocument(doc.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleDocument(doc.id)}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {doc.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.entry_number}</p>
                          {doc.classification ? (
                            <div className="mt-1 flex items-center gap-1.5">
                              <Badge variant="outline" className="text-xs font-mono">
                                {doc.classification.code}
                              </Badge>
                              <span className="text-xs text-muted-foreground">classificado</span>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Por classificar
                            </Badge>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDocId(doc.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pré-visualizar documento</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Classification Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Suggestion */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Sugestão Automática</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing || selectedCount === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A analisar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analisar Conteúdo
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {aiSuggestion && (
              <CardContent className="pt-0">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Confiança: {aiSuggestion.confidence}%
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        Classificação sugerida: <span className="font-mono font-medium">{aiSuggestion.code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {aiSuggestion.path.join(' → ')}
                      </p>
                    </div>
                    <Button size="sm" onClick={applyAiSuggestion}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Manual Classification */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Classificação Manual</CardTitle>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manual de Classificação
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Manual de Classificação Documental</SheetTitle>
                      <SheetDescription>
                        Taxonomia oficial do Ministério para classificação de documentos
                      </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
                      <div className="space-y-6">
                        {classHierarchy.level1.map((cls) => (
                          <div key={cls.id} className="space-y-2">
                            <h4 className="font-medium text-sm">
                              <span className="font-mono text-muted-foreground mr-2">{cls.code}</span>
                              {cls.name}
                            </h4>
                            <p className="text-xs text-muted-foreground pl-12">{cls.description}</p>
                            {classHierarchy.level2.filter(s => s.parent_id === cls.id).length > 0 && (
                              <div className="pl-6 space-y-1">
                                {classHierarchy.level2.filter(s => s.parent_id === cls.id).map((sub) => (
                                  <div key={sub.id}>
                                    <p className="text-xs">
                                      <span className="font-mono text-muted-foreground mr-2">{sub.code}</span>
                                      {sub.name}
                                    </p>
                                    {sub.retention_years && (
                                      <p className="text-xs text-muted-foreground ml-16">
                                        Retenção: {sub.retention_years} anos
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hierarchical Dropdowns */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Classe <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classHierarchy.level1.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{option.code}</span>
                            <span>{option.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subclasse</Label>
                  <Select
                    value={selectedSubclass}
                    onValueChange={handleSubclassChange}
                    disabled={!selectedClass || availableSubclasses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a subclasse" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubclasses.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{option.code}</span>
                            <span>{option.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select
                    value={selectedTipo}
                    onValueChange={handleTipoChange}
                    disabled={!selectedSubclass || availableTipos.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTipos.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{option.code}</span>
                            <span>{option.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Classification Path Visualization */}
              {selectedClass && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Hierarquia de Classificação
                    </span>
                    {fullClassificationCode && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCode}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar código</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getClassificationPath().map((part, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <Badge variant="outline" className="font-normal">
                          {part}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {fullClassificationCode && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Código:</span>
                        <span className="font-mono font-medium text-foreground">{fullClassificationCode}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Alerts */}
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <Alert
                      key={index}
                      className={
                        error.type === "error"
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-warning/50 bg-warning/5"
                      }
                    >
                      {error.type === "error" ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <AlertTitle className={error.type === "error" ? "text-destructive" : "text-warning"}>
                        {error.type === "error" ? "Erro" : "Aviso"}
                      </AlertTitle>
                      <AlertDescription className="text-sm">{error.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Change Reason Field */}
              {selectedClass && selectedCount > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Motivo da Classificação <span className="text-destructive">*</span>
                  </Label>
                  
                  {/* Reason Suggestions */}
                  {reasonSuggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Sugestões baseadas em classificações anteriores:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {reasonSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setChangeReason(suggestion.reason)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-accent hover:text-accent-foreground transition-colors border border-border"
                            title={`Usado ${suggestion.count} vez(es)`}
                          >
                            <span className="max-w-[200px] truncate">{suggestion.reason}</span>
                            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                              {suggestion.count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <textarea
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Indique o motivo para esta classificação (obrigatório, mínimo 5 caracteres)"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {changeReason.trim().length < 5 && changeReason.length > 0 && (
                        <span className="text-destructive">Mínimo 5 caracteres</span>
                      )}
                    </span>
                    <span>{changeReason.length}/500</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={resetClassification}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                <div className="flex items-center gap-2">
                  {selectedCount > 1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="gap-1">
                            <Info className="h-3 w-3" />
                            Modo em lote
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          A classificação será aplicada a {selectedCount} documentos
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button 
                    onClick={saveClassification} 
                    disabled={selectedCount === 0 || !selectedClass || updateClassification.isPending}
                  >
                    {updateClassification.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Classificação
                    {selectedCount > 1 && <span className="ml-1">({selectedCount})</span>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.classified}</p>
                  <p className="text-xs text-muted-foreground">Classificados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.unclassified}</p>
                  <p className="text-xs text-muted-foreground">Por classificar</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{selectedCount}</p>
                  <p className="text-xs text-muted-foreground">Seleccionados</p>
                </div>
              </div>
            </Card>
            <Card 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" 
              onClick={() => setShowHistory(!showHistory)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ver Histórico</p>
                  <p className="text-xs text-muted-foreground">Alterações recentes</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Classification History Panel */}
          {showHistory && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Histórico de Classificações</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {filteredHistory.length} de {classificationHistory.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Select value={historyPeriod} onValueChange={setHistoryPeriod}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <Clock className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={historyUserFilter} onValueChange={setHistoryUserFilter}>
                    <SelectTrigger className="h-8 w-[160px]">
                      <User className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os utilizadores</SelectItem>
                      {historyUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(historyPeriod !== "all" || historyUserFilter !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8"
                      onClick={() => {
                        setHistoryPeriod("all");
                        setHistoryUserFilter("all");
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                      <History className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {classificationHistory.length > 0 
                          ? "Nenhum resultado para os filtros aplicados" 
                          : "Nenhum histórico disponível"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredHistory.map((entry) => {
                        const doc = documents.find(d => d.id === entry.document_id);
                        return (
                          <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {doc?.title || 'Documento removido'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {doc?.entry_number || entry.document_id}
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {entry.old_classification ? (
                                    <>
                                      <Badge variant="outline" className="text-xs font-mono">
                                        {entry.old_classification.code}
                                      </Badge>
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    </>
                                  ) : (
                                    <>
                                      <Badge variant="secondary" className="text-xs">
                                        Sem classificação
                                      </Badge>
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    </>
                                  )}
                                  <Badge className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
                                    {entry.new_classification?.code || 'N/A'}
                                  </Badge>
                                </div>
                                {entry.change_reason && (
                                  <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
                                    "{entry.change_reason}"
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{entry.profile?.full_name || 'Utilizador'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Document Preview Sheet */}
      <Sheet open={!!previewDocId} onOpenChange={(open) => !open && setPreviewDocId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pré-visualização do Documento
            </SheetTitle>
            <SheetDescription>
              Detalhes do documento antes de classificar
            </SheetDescription>
          </SheetHeader>
          
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewDocument ? (
            <div className="space-y-6 mt-6">
              {/* Title and Status */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg leading-tight">{previewDocument.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono">
                    {previewDocument.entry_number}
                  </Badge>
                  <Badge variant={previewDocument.status === 'em_tramite' ? 'default' : 'secondary'}>
                    {previewDocument.status}
                  </Badge>
                  {previewDocument.priority && previewDocument.priority !== 'normal' && (
                    <Badge variant={previewDocument.priority === 'urgente' ? 'destructive' : 'warning'}>
                      {previewDocument.priority}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              {previewDocument.description && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <p className="text-sm">{previewDocument.description}</p>
                </div>
              )}

              {/* Current Classification */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <FolderTree className="h-3 w-3" />
                  Classificação Atual
                </Label>
                {previewDocument.classification ? (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {(previewDocument.classification as { code: string }).code}
                      </Badge>
                      <span className="text-sm font-medium">
                        {(previewDocument.classification as { name: string }).name}
                      </span>
                    </div>
                    {(previewDocument.classification as { description: string | null }).description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(previewDocument.classification as { description: string | null }).description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <span className="text-sm text-warning">Documento não classificado</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data de Entrada
                  </Label>
                  <p className="text-sm font-medium">
                    {format(new Date(previewDocument.entry_date), "dd/MM/yyyy", { locale: pt })}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Criado em
                  </Label>
                  <p className="text-sm font-medium">
                    {format(new Date(previewDocument.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                  </p>
                </div>
                {previewDocument.document_type && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileType className="h-3 w-3" />
                      Tipo de Documento
                    </Label>
                    <p className="text-sm font-medium">
                      {(previewDocument.document_type as { name: string }).name}
                    </p>
                  </div>
                )}
                {previewDocument.origin && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Origem
                    </Label>
                    <p className="text-sm font-medium">{previewDocument.origin}</p>
                  </div>
                )}
                {previewDocument.origin_unit && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Unidade de Origem
                    </Label>
                    <p className="text-sm font-medium">
                      {(previewDocument.origin_unit as { name: string }).name}
                    </p>
                  </div>
                )}
                {previewDocument.current_unit && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Unidade Atual
                    </Label>
                    <p className="text-sm font-medium">
                      {(previewDocument.current_unit as { name: string }).name}
                    </p>
                  </div>
                )}
                {previewDocument.sender_name && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Remetente
                    </Label>
                    <p className="text-sm font-medium">{previewDocument.sender_name}</p>
                    {previewDocument.sender_institution && (
                      <p className="text-xs text-muted-foreground">{previewDocument.sender_institution}</p>
                    )}
                  </div>
                )}
                {previewDocument.responsible_user && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Responsável
                    </Label>
                    <p className="text-sm font-medium">
                      {(previewDocument.responsible_user as { full_name: string }).full_name}
                    </p>
                  </div>
                )}
              </div>

              {/* Attached Files */}
              {previewDocument.files && previewDocument.files.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Ficheiros Anexados ({previewDocument.files.length})
                    </Label>
                    <div className="space-y-2">
                      {previewDocument.files.map((file: {
                        id: string;
                        file_name: string;
                        file_size: number;
                        mime_type: string;
                        is_main_file: boolean;
                      }) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.file_size / 1024).toFixed(1)} KB
                                {file.is_main_file && (
                                  <Badge variant="outline" className="ml-2 text-xs">Principal</Badge>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex items-center gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!selectedDocIds.has(previewDocument.id)) {
                      setSelectedDocIds(prev => new Set(prev).add(previewDocument.id));
                    }
                    setPreviewDocId(null);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Selecionar para Classificar
                </Button>
                <Button variant="outline" onClick={() => setPreviewDocId(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Documento não encontrado</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default DocumentClassification;
