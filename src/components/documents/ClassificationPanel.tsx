import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  FolderTree,
  Save,
  RotateCcw,
  ExternalLink,
  Loader2,
  Copy,
  ChevronDown,
  Tags,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClassificationLevel {
  code: string;
  name: string;
  description?: string;
}

interface ValidationError {
  field: string;
  message: string;
  type: "error" | "warning";
}

interface ClassificationPanelProps {
  documentId?: string;
  currentClassification?: string;
  onClassificationSaved?: (code: string) => void;
  compact?: boolean;
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

export const ClassificationPanel = ({
  documentId,
  currentClassification,
  onClassificationSaved,
  compact = false,
}: ClassificationPanelProps) => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubclass, setSelectedSubclass] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedSubtipo, setSelectedSubtipo] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpen, setIsOpen] = useState(!compact);
  const [aiSuggestion, setAiSuggestion] = useState<{
    class: string;
    subclass: string;
    tipo: string;
    confidence: number;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const fullClassificationCode = [selectedClass, selectedSubclass, selectedTipo, selectedSubtipo]
    .filter(Boolean)
    .pop() || "";

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
      errors.push({ field: "subclass", message: "Subclasse é recomendada", type: "warning" });
    }

    setValidationErrors(errors);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
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

    if (!fullClassificationCode) {
      toast({
        title: "Classificação incompleta",
        description: "Seleccione pelo menos a classe principal.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Classificação guardada",
      description: `Código: ${fullClassificationCode}`,
    });
    onClassificationSaved?.(fullClassificationCode);
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

  const classificationPath = getClassificationPath();

  const content = (
    <div className="space-y-4">
      {/* Current Classification */}
      {currentClassification && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Classificação actual</p>
          <Badge variant="outline" className="font-mono">
            {currentClassification}
          </Badge>
        </div>
      )}

      {/* AI Suggestion */}
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={handleAiAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              A analisar...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Sugerir com IA
            </>
          )}
        </Button>

        {aiSuggestion && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                {aiSuggestion.confidence}% confiança
              </Badge>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={applyAiSuggestion}>
                Aplicar
              </Button>
            </div>
            <p className="text-xs font-mono">{aiSuggestion.tipo}</p>
          </div>
        )}
      </div>

      {/* Manual Classification */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            Classe <span className="text-destructive">*</span>
          </label>
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar classe" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {classOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  <span className="font-mono text-muted-foreground mr-2">{option.code}</span>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClass && subclassOptions[selectedClass] && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Subclasse</label>
            <Select value={selectedSubclass} onValueChange={handleSubclassChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar subclasse" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {subclassOptions[selectedClass].map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    <span className="font-mono text-muted-foreground mr-2">{option.code}</span>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedSubclass && tipoOptions[selectedSubclass] && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Tipo</label>
            <Select value={selectedTipo} onValueChange={handleTipoChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {tipoOptions[selectedSubclass].map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    <span className="font-mono text-muted-foreground mr-2">{option.code}</span>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedTipo && subtipoOptions[selectedTipo] && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Subtipo</label>
            <Select value={selectedSubtipo} onValueChange={handleSubtipoChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar subtipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {subtipoOptions[selectedTipo].map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    <span className="font-mono text-muted-foreground mr-2">{option.code}</span>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Classification Code Display */}
      {fullClassificationCode && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-foreground">Código de Classificação</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyCode}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <p className="font-mono text-lg font-bold text-success">{fullClassificationCode}</p>
          {classificationPath.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {classificationPath.join(" → ")}
            </p>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, index) => (
            <Alert
              key={index}
              variant={error.type === "error" ? "destructive" : "default"}
              className="py-2"
            >
              {error.type === "error" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="text-xs">{error.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={resetClassification}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={saveClassification}
          disabled={!fullClassificationCode}
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar
        </Button>
      </div>

      {/* Manual Link */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <BookOpen className="h-4 w-4 mr-2" />
            Ver Manual de Classificação
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
  );

  if (compact) {
    return (
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  Classificação
                </CardTitle>
                <div className="flex items-center gap-2">
                  {fullClassificationCode && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {fullClassificationCode}
                    </Badge>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">{content}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          Classificação do Documento
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
