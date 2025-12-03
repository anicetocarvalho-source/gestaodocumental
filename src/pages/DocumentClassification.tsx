import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClassificationLevel {
  code: string;
  name: string;
  description?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  currentClassification?: string;
  selected: boolean;
}

const classOptions: ClassificationLevel[] = [
  { code: "100", name: "Organização e Funcionamento", description: "Documentos relativos à organização administrativa" },
  { code: "200", name: "Recursos Humanos", description: "Gestão de pessoal e carreiras" },
  { code: "300", name: "Recursos Financeiros", description: "Gestão orçamental e contabilística" },
  { code: "400", name: "Recursos Patrimoniais", description: "Gestão de património e equipamentos" },
  { code: "500", name: "Comunicação e Documentação", description: "Gestão documental e arquivo" },
];

const subclassOptions: Record<string, ClassificationLevel[]> = {
  "100": [
    { code: "100.10", name: "Planeamento e Organização" },
    { code: "100.20", name: "Regulamentação e Normalização" },
    { code: "100.30", name: "Relações Institucionais" },
  ],
  "200": [
    { code: "200.10", name: "Recrutamento e Seleção" },
    { code: "200.20", name: "Formação Profissional" },
    { code: "200.30", name: "Avaliação de Desempenho" },
  ],
  "300": [
    { code: "300.10", name: "Orçamento" },
    { code: "300.20", name: "Contabilidade" },
    { code: "300.30", name: "Tesouraria" },
  ],
  "400": [
    { code: "400.10", name: "Aquisições" },
    { code: "400.20", name: "Gestão de Inventário" },
    { code: "400.30", name: "Manutenção" },
  ],
  "500": [
    { code: "500.10", name: "Correspondência" },
    { code: "500.20", name: "Arquivo" },
    { code: "500.30", name: "Comunicação Interna" },
  ],
};

const tipoOptions: Record<string, ClassificationLevel[]> = {
  "100.10": [
    { code: "100.10.01", name: "Planos Estratégicos" },
    { code: "100.10.02", name: "Planos de Actividades" },
  ],
  "100.20": [
    { code: "100.20.01", name: "Regulamentos Internos" },
    { code: "100.20.02", name: "Normas e Procedimentos" },
  ],
  "200.10": [
    { code: "200.10.01", name: "Concursos Públicos" },
    { code: "200.10.02", name: "Mobilidade Interna" },
  ],
  "300.10": [
    { code: "300.10.01", name: "Propostas Orçamentais" },
    { code: "300.10.02", name: "Alterações Orçamentais" },
  ],
  "500.10": [
    { code: "500.10.01", name: "Correspondência Recebida" },
    { code: "500.10.02", name: "Correspondência Expedida" },
  ],
};

const subtipoOptions: Record<string, ClassificationLevel[]> = {
  "100.10.01": [
    { code: "100.10.01.01", name: "Plano Estratégico Plurianual" },
    { code: "100.10.01.02", name: "Revisão do Plano Estratégico" },
  ],
  "200.10.01": [
    { code: "200.10.01.01", name: "Abertura de Procedimento" },
    { code: "200.10.01.02", name: "Lista de Candidatos" },
  ],
  "500.10.01": [
    { code: "500.10.01.01", name: "Ofícios Recebidos" },
    { code: "500.10.01.02", name: "Requerimentos" },
  ],
};

const mockDocuments: Document[] = [
  { id: "1", name: "Contrato_Prestacao_Servicos_2024.pdf", type: "PDF", selected: true },
  { id: "2", name: "Despacho_Ministerial_0045.pdf", type: "PDF", selected: true, currentClassification: "100.20.02" },
  { id: "3", name: "Relatorio_Financeiro_Q4.pdf", type: "PDF", selected: false },
  { id: "4", name: "Acta_Reuniao_Conselho.pdf", type: "PDF", selected: false },
  { id: "5", name: "Circular_Interna_2024_001.pdf", type: "PDF", selected: true },
];

interface ValidationError {
  field: string;
  message: string;
  type: "error" | "warning";
}

const DocumentClassification = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubclass, setSelectedSubclass] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedSubtipo, setSelectedSubtipo] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    class: string;
    subclass: string;
    tipo: string;
    confidence: number;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const selectedCount = documents.filter((d) => d.selected).length;
  const fullClassificationCode = [selectedClass, selectedSubclass, selectedTipo, selectedSubtipo]
    .filter(Boolean)
    .pop() || "";

  const toggleDocument = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const selectAll = () => {
    setDocuments((prev) => prev.map((d) => ({ ...d, selected: true })));
  };

  const deselectAll = () => {
    setDocuments((prev) => prev.map((d) => ({ ...d, selected: false })));
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubclass("");
    setSelectedTipo("");
    setSelectedSubtipo("");
    validateClassification(value, "", "", "");
  };

  const handleSubclassChange = (value: string) => {
    setSelectedSubclass(value);
    setSelectedTipo("");
    setSelectedSubtipo("");
    validateClassification(selectedClass, value, "", "");
  };

  const handleTipoChange = (value: string) => {
    setSelectedTipo(value);
    setSelectedSubtipo("");
    validateClassification(selectedClass, selectedSubclass, value, "");
  };

  const handleSubtipoChange = (value: string) => {
    setSelectedSubtipo(value);
    validateClassification(selectedClass, selectedSubclass, selectedTipo, value);
  };

  const validateClassification = (
    classVal: string,
    subclass: string,
    tipo: string,
    subtipo: string
  ) => {
    const errors: ValidationError[] = [];

    if (!classVal) {
      errors.push({ field: "class", message: "Classe é obrigatória", type: "error" });
    }

    if (classVal && !subclass) {
      errors.push({ field: "subclass", message: "Subclasse é recomendada para classificação completa", type: "warning" });
    }

    // Simulated conflict check
    if (classVal === "300" && documents.some((d) => d.selected && d.name.toLowerCase().includes("contrato"))) {
      errors.push({
        field: "conflict",
        message: "Documento 'Contrato' pode pertencer a classe diferente (100 - Organização)",
        type: "warning",
      });
    }

    setValidationErrors(errors);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setAiSuggestion({
      class: "500",
      subclass: "500.10",
      tipo: "500.10.01",
      confidence: 87,
    });
    setIsAnalyzing(false);
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setSelectedClass(aiSuggestion.class);
      setSelectedSubclass(aiSuggestion.subclass);
      setSelectedTipo(aiSuggestion.tipo);
      setSelectedSubtipo("");
      validateClassification(aiSuggestion.class, aiSuggestion.subclass, aiSuggestion.tipo, "");
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
    setSelectedSubtipo("");
    setAiSuggestion(null);
    setValidationErrors([]);
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

    toast({
      title: "Classificação guardada",
      description: `${selectedCount} documento(s) classificado(s) com o código ${fullClassificationCode}`,
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
    const parts = [];
    if (selectedClass) {
      const cls = classOptions.find((c) => c.code === selectedClass);
      if (cls) parts.push(cls.name);
    }
    if (selectedSubclass && subclassOptions[selectedClass]) {
      const sub = subclassOptions[selectedClass].find((s) => s.code === selectedSubclass);
      if (sub) parts.push(sub.name);
    }
    if (selectedTipo && tipoOptions[selectedSubclass]) {
      const tipo = tipoOptions[selectedSubclass].find((t) => t.code === selectedTipo);
      if (tipo) parts.push(tipo.name);
    }
    if (selectedSubtipo && subtipoOptions[selectedTipo]) {
      const subtipo = subtipoOptions[selectedTipo].find((s) => s.code === selectedSubtipo);
      if (subtipo) parts.push(subtipo.name);
    }
    return parts;
  };

  return (
    <DashboardLayout title="Classificação de Documentos" subtitle="Módulo de classificação segundo taxonomia ministerial">
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
                <Badge variant="outline">{documents.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                <div className="divide-y divide-border">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={doc.selected}
                        onCheckedChange={() => toggleDocument(doc.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {doc.name}
                          </span>
                        </div>
                        {doc.currentClassification && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs font-mono">
                              {doc.currentClassification}
                            </Badge>
                            <span className="text-xs text-muted-foreground">classificado</span>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
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
                        Classificação sugerida: <span className="font-mono font-medium">{aiSuggestion.tipo}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Comunicação e Documentação → Correspondência → Correspondência Recebida
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
                        {classOptions.map((cls) => (
                          <div key={cls.code} className="space-y-2">
                            <h4 className="font-medium text-sm">
                              <span className="font-mono text-muted-foreground mr-2">{cls.code}</span>
                              {cls.name}
                            </h4>
                            <p className="text-xs text-muted-foreground pl-12">{cls.description}</p>
                            {subclassOptions[cls.code] && (
                              <div className="pl-6 space-y-1">
                                {subclassOptions[cls.code].map((sub) => (
                                  <p key={sub.code} className="text-xs">
                                    <span className="font-mono text-muted-foreground mr-2">{sub.code}</span>
                                    {sub.name}
                                  </p>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Classe <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
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
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a subclasse" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClass &&
                        subclassOptions[selectedClass]?.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
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
                    disabled={!selectedSubclass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSubclass &&
                        tipoOptions[selectedSubclass]?.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
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
                  <Label className="text-sm font-medium">Subtipo</Label>
                  <Select
                    value={selectedSubtipo}
                    onValueChange={handleSubtipoChange}
                    disabled={!selectedTipo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o subtipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTipo &&
                        subtipoOptions[selectedTipo]?.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
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
                  <Button onClick={saveClassification} disabled={selectedCount === 0 || !selectedClass}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Classificação
                    {selectedCount > 1 && <span className="ml-1">({selectedCount})</span>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {documents.filter((d) => d.currentClassification).length}
                  </p>
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
                  <p className="text-2xl font-semibold text-foreground">
                    {documents.filter((d) => !d.currentClassification).length}
                  </p>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentClassification;
