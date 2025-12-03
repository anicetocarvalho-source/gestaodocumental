import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Sparkles,
  Loader2,
  FileText,
  Calendar,
  Building,
  User,
  Tag,
  Filter,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  document_type: string;
  date: string;
  sender: string;
  recipient: string;
  unit: string;
  relevance_score: number;
  excerpt: string;
  status: string;
  tags: string[];
}

interface SearchResponse {
  search: {
    query_understanding: string;
    filters_applied: {
      document_types: string[];
      date_range: { start: string | null; end: string | null };
      sender: string | null;
      recipient: string | null;
      unit: string | null;
      keywords: string[];
      subject: string | null;
    };
    search_terms: string[];
    suggested_refinements: Array<{ label: string; query: string }>;
  };
  results: SearchResult[];
  total_count: number;
  grouped_results: {
    by_type: Record<string, number>;
    by_unit: Record<string, number>;
    by_year: Record<string, number>;
    by_status: Record<string, number>;
  };
}

const documentTypeLabels: Record<string, string> = {
  oficio: "Ofício",
  memorando: "Memorando",
  processo: "Processo",
  contrato: "Contrato",
  parecer: "Parecer",
  despacho: "Despacho",
  relatorio: "Relatório",
  nota_fiscal: "Nota Fiscal",
  ata: "Ata",
  portaria: "Portaria",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  em_andamento: { label: "Em Andamento", icon: <Clock className="h-3 w-3" />, color: "text-blue-600 bg-blue-50" },
  concluido: { label: "Concluído", icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600 bg-green-50" },
  arquivado: { label: "Arquivado", icon: <FileText className="h-3 w-3" />, color: "text-gray-600 bg-gray-50" },
  pendente: { label: "Pendente", icon: <AlertCircle className="h-3 w-3" />, color: "text-amber-600 bg-amber-50" },
};

export default function IntelligentSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      toast.error("Por favor, insira uma consulta de pesquisa");
      return;
    }

    setIsSearching(true);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke("intelligent-search", {
        body: { query: q },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResponse(data);
      toast.success(`${data.total_count} resultado(s) encontrado(s)`);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error(error instanceof Error ? error.message : "Erro na pesquisa");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefinement = (refinedQuery: string) => {
    setQuery(refinedQuery);
    handleSearch(refinedQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <DashboardLayout
      title="Pesquisa Inteligente"
      subtitle="Busca avançada com processamento de linguagem natural"
    >
      <div className="space-y-6">
        {/* Search Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Ex: processos sobre licenciamento florestal enviados ao INCA em 2023"
                  className="pl-10 h-12 text-base"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button
                size="lg"
                onClick={() => handleSearch()}
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pesquisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Pesquisar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use linguagem natural para pesquisar documentos, processos e arquivos
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        {response && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Results */}
            <div className="lg:col-span-3 space-y-4">
              {/* Query Understanding */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Interpretação da Consulta</p>
                      <p className="text-sm text-muted-foreground">
                        {response.search.query_understanding}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Applied Filters */}
              {(response.search.filters_applied.document_types?.length > 0 ||
                response.search.filters_applied.unit ||
                response.search.filters_applied.keywords?.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                  {response.search.filters_applied.document_types?.map((type) => (
                    <Badge key={type} variant="secondary">
                      {documentTypeLabels[type] || type}
                    </Badge>
                  ))}
                  {response.search.filters_applied.unit && (
                    <Badge variant="secondary">
                      <Building className="h-3 w-3 mr-1" />
                      {response.search.filters_applied.unit}
                    </Badge>
                  )}
                  {response.search.filters_applied.keywords?.map((kw) => (
                    <Badge key={kw} variant="outline">
                      {kw}
                    </Badge>
                  ))}
                  {response.search.filters_applied.date_range?.start && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {response.search.filters_applied.date_range.start}
                      {response.search.filters_applied.date_range.end &&
                        ` - ${response.search.filters_applied.date_range.end}`}
                    </Badge>
                  )}
                </div>
              )}

              {/* Results List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Resultados ({response.total_count})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {response.results.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum documento correspondente encontrado.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {response.results.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {documentTypeLabels[result.document_type] || result.document_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {result.id}
                                </span>
                                {statusConfig[result.status] && (
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      statusConfig[result.status].color
                                    )}
                                  >
                                    {statusConfig[result.status].icon}
                                    <span className="ml-1">
                                      {statusConfig[result.status].label}
                                    </span>
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-sm mb-1 truncate">
                                {result.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.excerpt}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {result.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {result.sender}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {result.unit}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {result.tags.slice(0, 4).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0"
                                  >
                                    <Tag className="h-2.5 w-2.5 mr-0.5" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {Math.round(result.relevance_score * 100)}%
                              </div>
                              <p className="text-xs text-muted-foreground">relevância</p>
                              <Button variant="ghost" size="sm" className="mt-2">
                                Abrir
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Suggested Refinements */}
              {response.search.suggested_refinements?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Sugestões de Pesquisa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {response.search.suggested_refinements.map((ref, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleRefinement(ref.query)}
                      >
                        <Search className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{ref.label}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Grouped Results */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Agrupamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* By Type */}
                  {Object.keys(response.grouped_results.by_type).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Por Tipo
                      </p>
                      <div className="space-y-1">
                        {Object.entries(response.grouped_results.by_type).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{documentTypeLabels[type] || type}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* By Unit */}
                  {Object.keys(response.grouped_results.by_unit).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Por Unidade
                      </p>
                      <div className="space-y-1">
                        {Object.entries(response.grouped_results.by_unit).map(
                          ([unit, count]) => (
                            <div
                              key={unit}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{unit}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* By Year */}
                  {Object.keys(response.grouped_results.by_year).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Por Ano
                      </p>
                      <div className="space-y-1">
                        {Object.entries(response.grouped_results.by_year).map(
                          ([year, count]) => (
                            <div
                              key={year}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{year}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* By Status */}
                  {Object.keys(response.grouped_results.by_status).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Por Status
                      </p>
                      <div className="space-y-1">
                        {Object.entries(response.grouped_results.by_status).map(
                          ([status, count]) => (
                            <div
                              key={status}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {statusConfig[status]?.label || status}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!response && !isSearching && (
          <Card className="py-16">
            <CardContent className="text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Pesquisa Inteligente</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use linguagem natural para encontrar documentos. Por exemplo:
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "ofícios enviados ao INCA em 2023",
                  "processos de licenciamento florestal",
                  "pareceres jurídicos sobre contratos",
                  "memorandos do gabinete do ministro",
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(example);
                      handleSearch(example);
                    }}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
