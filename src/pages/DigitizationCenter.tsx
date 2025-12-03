import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ScanLine,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Sparkles,
  MoreVertical,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Trash2,
  Download,
  Tags,
  FolderOpen,
  Layers,
  Zap,
  Settings,
  ChevronRight,
  FileCheck,
  FileX,
  ImageIcon,
  Search,
  Filter,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface ScanDocument {
  id: string;
  name: string;
  pages: number;
  status: "pendente" | "em_processamento" | "concluido" | "erro" | "revisao";
  ocrProgress: number;
  operator: string | null;
  priority: "baixa" | "normal" | "alta" | "urgente";
  batch: string;
  createdAt: string;
  suggestedTags: string[];
  classification: string | null;
  errorMessage?: string;
}

interface Batch {
  id: string;
  name: string;
  documents: number;
  completed: number;
  status: "activo" | "pausado" | "concluido";
  operator: string;
  createdAt: string;
}

// Sample Data
const scanQueue: ScanDocument[] = [
  { id: "SCAN-001", name: "Ofício MINEC 2024-0145.pdf", pages: 12, status: "em_processamento", ocrProgress: 67, operator: "Maria Santos", priority: "alta", batch: "BATCH-001", createdAt: "2024-01-15 09:30", suggestedTags: ["Ofício", "MINEC", "2024"], classification: "130.01" },
  { id: "SCAN-002", name: "Contrato Prestação Serviços.pdf", pages: 28, status: "pendente", ocrProgress: 0, operator: null, priority: "normal", batch: "BATCH-001", createdAt: "2024-01-15 09:25", suggestedTags: ["Contrato", "Serviços"], classification: null },
  { id: "SCAN-003", name: "Relatório Financeiro Q4.pdf", pages: 45, status: "concluido", ocrProgress: 100, operator: "João Silva", priority: "normal", batch: "BATCH-001", createdAt: "2024-01-15 09:20", suggestedTags: ["Relatório", "Finanças", "Q4", "2024"], classification: "220.02" },
  { id: "SCAN-004", name: "Acta Reunião Direcção.pdf", pages: 8, status: "erro", ocrProgress: 34, operator: "Ana Costa", priority: "urgente", batch: "BATCH-002", createdAt: "2024-01-15 09:15", suggestedTags: ["Acta", "Reunião"], classification: null, errorMessage: "Qualidade de imagem insuficiente nas páginas 5-7" },
  { id: "SCAN-005", name: "Despacho DG 001-2024.pdf", pages: 3, status: "revisao", ocrProgress: 100, operator: "Carlos Pereira", priority: "alta", batch: "BATCH-002", createdAt: "2024-01-15 09:10", suggestedTags: ["Despacho", "DG", "Autorização"], classification: "110.01" },
  { id: "SCAN-006", name: "Factura Fornecedor ABC.pdf", pages: 2, status: "pendente", ocrProgress: 0, operator: null, priority: "baixa", batch: "BATCH-002", createdAt: "2024-01-15 09:05", suggestedTags: ["Factura", "Fornecedor"], classification: null },
  { id: "SCAN-007", name: "Parecer Jurídico 2024-012.pdf", pages: 15, status: "em_processamento", ocrProgress: 23, operator: "Teresa Gomes", priority: "normal", batch: "BATCH-003", createdAt: "2024-01-15 09:00", suggestedTags: ["Parecer", "Jurídico"], classification: "320" },
];

const batches: Batch[] = [
  { id: "BATCH-001", name: "Correspondência Janeiro", documents: 45, completed: 32, status: "activo", operator: "Maria Santos", createdAt: "2024-01-15 08:00" },
  { id: "BATCH-002", name: "Contratos 2024", documents: 28, completed: 15, status: "activo", operator: "João Silva", createdAt: "2024-01-14 14:30" },
  { id: "BATCH-003", name: "Arquivo Histórico", documents: 120, completed: 45, status: "pausado", operator: "Ana Costa", createdAt: "2024-01-13 10:00" },
  { id: "BATCH-004", name: "Pareceres Jurídicos", documents: 35, completed: 35, status: "concluido", operator: "Carlos Pereira", createdAt: "2024-01-12 09:00" },
];

const operators = ["Maria Santos", "João Silva", "Ana Costa", "Carlos Pereira", "Teresa Gomes", "António Ribeiro"];

const classifications = [
  { code: "110.01", name: "Regulamentos Internos" },
  { code: "110.02", name: "Estrutura Organizacional" },
  { code: "130.01", name: "Correspondência Oficial" },
  { code: "220.02", name: "Relatórios Financeiros" },
  { code: "310.01", name: "Contratos de Prestação de Serviços" },
  { code: "320", name: "Contencioso" },
];

const DigitizationCenter = () => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [selectedForReview, setSelectedForReview] = useState<ScanDocument | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOperator, setFilterOperator] = useState("");

  // Stats
  const stats = {
    pendentes: scanQueue.filter(d => d.status === "pendente").length,
    emProcessamento: scanQueue.filter(d => d.status === "em_processamento").length,
    concluidos: scanQueue.filter(d => d.status === "concluido").length,
    erros: scanQueue.filter(d => d.status === "erro").length,
    revisao: scanQueue.filter(d => d.status === "revisao").length,
  };

  const toggleDocumentSelection = (id: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocuments(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.size === scanQueue.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(scanQueue.map(d => d.id)));
    }
  };

  const openReviewPanel = (doc: ScanDocument) => {
    setSelectedForReview(doc);
    setReviewPanelOpen(true);
  };

  const getStatusBadge = (status: ScanDocument["status"]) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "em_processamento":
        return <Badge variant="default"><Zap className="h-3 w-3 mr-1" />Em Processamento</Badge>;
      case "concluido":
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case "erro":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case "revisao":
        return <Badge variant="warning"><Eye className="h-3 w-3 mr-1" />Revisão</Badge>;
    }
  };

  const getPriorityBadge = (priority: ScanDocument["priority"]) => {
    switch (priority) {
      case "urgente":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "alta":
        return <Badge variant="warning" className="text-xs">Alta</Badge>;
      case "normal":
        return <Badge variant="outline" className="text-xs">Normal</Badge>;
      case "baixa":
        return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
    }
  };

  const filteredQueue = scanQueue.filter(doc => {
    const matchesStatus = !filterStatus || doc.status === filterStatus;
    const matchesOperator = !filterOperator || doc.operator === filterOperator;
    return matchesStatus && matchesOperator;
  });

  return (
    <DashboardLayout
      title="Centro de Digitalização"
      subtitle="Gestão de documentos digitalizados e OCR"
    >
      <PageBreadcrumb items={[{ label: "Centro de Digitalização" }]} />

      <Tabs defaultValue="queue" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <Layers className="h-4 w-4" />
              Fila de Processamento
            </TabsTrigger>
            <TabsTrigger value="batches" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Lotes
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Carregar Lote
            </Button>
            <Button size="sm">
              <ScanLine className="h-4 w-4 mr-2" />
              Iniciar Digitalização
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.emProcessamento}</p>
                <p className="text-xs text-muted-foreground">Processando</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.concluidos}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.revisao}</p>
                <p className="text-xs text-muted-foreground">Em Revisão</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          {/* Toolbar */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar documentos..." className="pl-9 w-64" />
                  </div>
                  <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_processamento">Em Processamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="revisao">Em Revisão</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterOperator || "all"} onValueChange={(v) => setFilterOperator(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {operators.map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(filterStatus || filterOperator) && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterOperator(""); }}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                {selectedDocuments.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedDocuments.size} seleccionados</span>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Atribuir Operador
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Processar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Tags className="h-4 w-4 mr-2" />
                      Classificar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Queue Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="w-10 px-4 py-3">
                        <Checkbox
                          checked={selectedDocuments.size === scanQueue.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progresso OCR</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operador</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags Sugeridas (IA)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridade</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.map((doc) => (
                      <tr
                        key={doc.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30 transition-colors",
                          doc.status === "erro" && "bg-destructive/5",
                          selectedDocuments.has(doc.id) && "bg-primary/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedDocuments.has(doc.id)}
                            onCheckedChange={() => toggleDocumentSelection(doc.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              doc.status === "concluido" ? "bg-success/10" :
                              doc.status === "erro" ? "bg-destructive/10" :
                              doc.status === "em_processamento" ? "bg-primary/10" : "bg-muted"
                            )}>
                              {doc.status === "concluido" ? <FileCheck className="h-5 w-5 text-success" /> :
                               doc.status === "erro" ? <FileX className="h-5 w-5 text-destructive" /> :
                               <FileText className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.pages} páginas • {doc.batch}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {getStatusBadge(doc.status)}
                            {doc.errorMessage && (
                              <p className="text-xs text-destructive mt-1 max-w-[150px] truncate" title={doc.errorMessage}>
                                {doc.errorMessage}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-36">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">OCR</span>
                              <span className="font-medium">{doc.ocrProgress}%</span>
                            </div>
                            <Progress value={doc.ocrProgress} className="h-2" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {doc.operator ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                {doc.operator.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-sm">{doc.operator}</span>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              <Plus className="h-4 w-4 mr-1" />
                              Atribuir
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {doc.suggestedTags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs gap-1">
                                <Sparkles className="h-3 w-3 text-warning" />
                                {tag}
                              </Badge>
                            ))}
                            {doc.suggestedTags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{doc.suggestedTags.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{getPriorityBadge(doc.priority)}</td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openReviewPanel(doc)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Rever Qualidade
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Play className="h-4 w-4 mr-2" />
                                {doc.status === "erro" ? "Reprocessar" : "Processar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tags className="h-4 w-4 mr-2" />
                                Classificar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <User className="h-4 w-4 mr-2" />
                                Atribuir Operador
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Transferir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <Card key={batch.id} className={cn(
                "hover:border-primary/50 transition-colors",
                batch.status === "concluido" && "bg-success/5 border-success/20"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{batch.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{batch.id} • {batch.createdAt}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Documentos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {batch.status === "pausado" ? (
                            <><Play className="h-4 w-4 mr-2" />Retomar</>
                          ) : (
                            <><Pause className="h-4 w-4 mr-2" />Pausar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      batch.status === "activo" ? "default" :
                      batch.status === "pausado" ? "warning" : "success"
                    }>
                      {batch.status === "activo" ? "Activo" :
                       batch.status === "pausado" ? "Pausado" : "Concluído"}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {batch.operator}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{batch.completed}/{batch.documents}</span>
                    </div>
                    <Progress value={(batch.completed / batch.documents) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {Math.round((batch.completed / batch.documents) * 100)}% concluído
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button variant={batch.status === "concluido" ? "secondary" : "default"} size="sm" className="flex-1">
                      {batch.status === "concluido" ? (
                        <><Download className="h-4 w-4 mr-2" />Exportar</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" />Continuar</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* New Batch Card */}
            <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setUploadDialogOpen(true)}>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <p className="font-medium">Criar Novo Lote</p>
                <p className="text-sm">Carregar documentos para digitalização</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Batch Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Carregar Novo Lote</DialogTitle>
            <DialogDescription>
              Carregar documentos para digitalização e processamento OCR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batchName">Nome do Lote</Label>
              <Input id="batchName" placeholder="Ex: Correspondência Fevereiro 2024" />
            </div>
            <div className="space-y-2">
              <Label>Operador Responsável</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ficheiros</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">Arraste ficheiros ou clique para seleccionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, TIFF, JPG, PNG (máx. 50MB por ficheiro)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-info-muted rounded-lg">
              <Sparkles className="h-4 w-4 text-info" />
              <span className="text-sm text-info">
                A IA irá sugerir tags e classificação automaticamente após o OCR.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setUploadDialogOpen(false)}>
              <Upload className="h-4 w-4 mr-2" />
              Carregar e Processar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality Review Panel */}
      <Sheet open={reviewPanelOpen} onOpenChange={setReviewPanelOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Revisão de Qualidade</SheetTitle>
            <SheetDescription>
              Validar o resultado do OCR e classificação.
            </SheetDescription>
          </SheetHeader>
          {selectedForReview && (
            <div className="py-6 space-y-6">
              {/* Document Info */}
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedForReview.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedForReview.pages} páginas • {selectedForReview.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedForReview.status)}
                  {getPriorityBadge(selectedForReview.priority)}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Pré-visualização do documento</p>
                  </div>
                </div>
              </div>

              {/* OCR Quality */}
              <div className="space-y-2">
                <Label>Qualidade OCR</Label>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confiança do texto</span>
                    <Badge variant="success">92%</Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Qualidade aceitável para arquivamento.
                  </p>
                </div>
              </div>

              {/* AI Suggested Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  Tags Sugeridas pela IA
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedForReview.suggestedTags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="gap-1 cursor-pointer hover:bg-primary/10">
                      <CheckCircle className="h-3 w-3 text-success" />
                      {tag}
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive ml-1" />
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <Label>Classificação Documental</Label>
                <Select defaultValue={selectedForReview.classification || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    {classifications.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Error Details (if applicable) */}
              {selectedForReview.status === "erro" && selectedForReview.errorMessage && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Erro de Processamento</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedForReview.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setReviewPanelOpen(false)}>
                  Cancelar
                </Button>
                {selectedForReview.status === "erro" ? (
                  <Button className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocessar
                  </Button>
                ) : (
                  <Button className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar e Arquivar
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default DigitizationCenter;
