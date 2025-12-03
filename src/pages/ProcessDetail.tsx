import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Calendar,
  FileText,
  Download,
  CheckCircle,
  Circle,
  ArrowRight,
  MessageSquare,
  Building2,
  AlertTriangle,
  Send,
  Forward,
  FileOutput,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Eye,
  Trash2,
  Plus,
  History,
  ChevronRight,
  User,
  Paperclip
} from "lucide-react";

// Process data
const processData = {
  number: "PROC-2024-0001",
  subject: "Licitação - Aquisição de Equipamentos de TI",
  description: "Processo de licitação para aquisição de computadores e periféricos para modernização do parque tecnológico.",
  status: "em_andamento",
  priority: "alta",
  deadline: "20 Dez 2024",
  created: "15 Nov 2024",
  requester: "Maria Silva",
  currentUnit: "Setor de Compras",
  type: "Licitação",
  slaRemaining: 15,
};

// Workflow stages with visual nodes
const workflowStages = [
  { 
    id: 1, 
    name: "Abertura", 
    status: "completed",
    date: "15 Nov 2024",
    user: "Maria Silva",
    unit: "Gabinete",
    duration: "1 dia"
  },
  { 
    id: 2, 
    name: "Análise Técnica", 
    status: "completed",
    date: "18 Nov 2024",
    user: "Carlos Mendes",
    unit: "Setor Técnico",
    duration: "3 dias"
  },
  { 
    id: 3, 
    name: "Parecer Jurídico", 
    status: "completed",
    date: "22 Nov 2024",
    user: "Ana Costa",
    unit: "Procuradoria",
    duration: "4 dias"
  },
  { 
    id: 4, 
    name: "Aprovação", 
    status: "current",
    date: "Em andamento",
    user: "João Santos",
    unit: "Setor de Compras",
    duration: "-"
  },
  { 
    id: 5, 
    name: "Publicação", 
    status: "pending",
    date: "Pendente",
    user: null,
    unit: "Comunicação",
    duration: "-"
  },
  { 
    id: 6, 
    name: "Encerramento", 
    status: "pending",
    date: "Pendente",
    user: null,
    unit: "Arquivo",
    duration: "-"
  },
];

// Attached documents
const documents = [
  { id: 1, name: "Termo de Referência.pdf", size: "2.4 MB", type: "PDF", date: "15 Nov 2024", author: "Maria Silva" },
  { id: 2, name: "Planilha de Custos.xlsx", size: "856 KB", type: "XLSX", date: "16 Nov 2024", author: "Carlos Mendes" },
  { id: 3, name: "Parecer Técnico.pdf", size: "1.2 MB", type: "PDF", date: "18 Nov 2024", author: "Carlos Mendes" },
  { id: 4, name: "Parecer Jurídico.pdf", size: "945 KB", type: "PDF", date: "22 Nov 2024", author: "Ana Costa" },
  { id: 5, name: "Minuta do Edital.docx", size: "445 KB", type: "DOCX", date: "25 Nov 2024", author: "João Santos" },
];

// Pareceres e despachos
const pareceres = [
  {
    id: 1,
    type: "Parecer Técnico",
    number: "PAR-TEC-2024-0089",
    date: "18 Nov 2024",
    author: "Carlos Mendes",
    unit: "Setor Técnico",
    summary: "Parecer favorável à aquisição dos equipamentos conforme especificações técnicas apresentadas no Termo de Referência.",
    status: "favoravel"
  },
  {
    id: 2,
    type: "Parecer Jurídico",
    number: "PAR-JUR-2024-0156",
    date: "22 Nov 2024",
    author: "Ana Costa",
    unit: "Procuradoria",
    summary: "Processo em conformidade com a legislação vigente. Autorizada a continuidade do processo licitatório.",
    status: "favoravel"
  },
  {
    id: 3,
    type: "Despacho",
    number: "DESP-2024-0234",
    date: "25 Nov 2024",
    author: "João Santos",
    unit: "Setor de Compras",
    summary: "Encaminho para aprovação da autoridade competente conforme pareceres técnico e jurídico favoráveis.",
    status: "encaminhado"
  },
];

// Comentários internos
const comentarios = [
  {
    id: 1,
    author: "João Santos",
    avatar: "JS",
    date: "01 Dez 2024, 14:30",
    text: "Aguardando retorno da Secretaria de Administração para validação do orçamento disponível.",
    isInternal: true
  },
  {
    id: 2,
    author: "Ana Costa",
    avatar: "AC",
    date: "28 Nov 2024, 10:15",
    text: "Recomendo atenção especial aos prazos de publicação conforme Lei 14.133/2021.",
    isInternal: true
  },
  {
    id: 3,
    author: "Carlos Mendes",
    avatar: "CM",
    date: "20 Nov 2024, 09:00",
    text: "Especificações técnicas validadas. Valores dentro da média de mercado.",
    isInternal: false
  },
];

// Audit log
const auditLog = [
  { action: "Visualização do processo", user: "João Santos", date: "01 Dez 2024, 14:35", ip: "192.168.1.45" },
  { action: "Comentário adicionado", user: "João Santos", date: "01 Dez 2024, 14:30", ip: "192.168.1.45" },
  { action: "Despacho emitido", user: "João Santos", date: "25 Nov 2024, 16:00", ip: "192.168.1.45" },
  { action: "Parecer jurídico anexado", user: "Ana Costa", date: "22 Nov 2024, 11:30", ip: "192.168.1.22" },
  { action: "Processo tramitado", user: "Carlos Mendes", date: "18 Nov 2024, 15:00", ip: "192.168.1.33" },
  { action: "Parecer técnico anexado", user: "Carlos Mendes", date: "18 Nov 2024, 14:45", ip: "192.168.1.33" },
  { action: "Documento anexado", user: "Maria Silva", date: "15 Nov 2024, 10:00", ip: "192.168.1.10" },
  { action: "Processo criado", user: "Maria Silva", date: "15 Nov 2024, 09:30", ip: "192.168.1.10" },
];

const statusConfig = {
  em_andamento: { label: "Em Andamento", variant: "info" as const },
  concluido: { label: "Concluído", variant: "success" as const },
  urgente: { label: "Urgente", variant: "warning" as const },
  atrasado: { label: "Atrasado", variant: "error" as const },
  suspenso: { label: "Suspenso", variant: "secondary" as const },
};

const priorityConfig = {
  alta: { label: "Alta", variant: "error" as const },
  média: { label: "Média", variant: "warning" as const },
  baixa: { label: "Baixa", variant: "info" as const },
};

const ProcessDetail = () => {
  const [activeTab, setActiveTab] = useState("workflow");
  const status = statusConfig[processData.status as keyof typeof statusConfig];
  const priority = priorityConfig[processData.priority as keyof typeof priorityConfig];

  const getStageIcon = (stageStatus: string) => {
    switch (stageStatus) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-success" />;
      case "current":
        return <Clock className="h-6 w-6 text-warning" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout 
      title="Detalhes do Processo" 
      subtitle="Gerenciar e acompanhar processo"
    >
      <PageBreadcrumb 
        items={[
          { label: "Processos", href: "/processes" },
          { label: processData.number }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Process Header */}
        <Card className="lg:col-span-12">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-sm">
                    {processData.number}
                  </Badge>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                </div>
                <h1 className="text-xl font-semibold text-foreground">{processData.subject}</h1>
                <p className="text-sm text-muted-foreground max-w-3xl">{processData.description}</p>
                
                {/* Key Info Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Prazo:</span>
                    <span className="font-medium">{processData.deadline}</span>
                    <Badge variant={processData.slaRemaining > 10 ? "success" : processData.slaRemaining > 3 ? "warning" : "error"} className="text-xs">
                      {processData.slaRemaining} dias
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Unidade:</span>
                    <span className="font-medium">{processData.currentUnit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Responsável:</span>
                    <span className="font-medium">{processData.requester}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs - 9 columns */}
        <div className="lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="workflow" className="text-xs sm:text-sm">
                Workflow
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm">
                Documentos
              </TabsTrigger>
              <TabsTrigger value="pareceres" className="text-xs sm:text-sm">
                Pareceres
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="text-xs sm:text-sm">
                Comentários
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="text-xs sm:text-sm">
                Auditoria
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Workflow Visual */}
            <TabsContent value="workflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Fluxo do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Workflow Visual */}
                  <div className="relative py-4">
                    {workflowStages.map((stage, index) => (
                      <div key={stage.id} className="flex items-start gap-4 mb-6 last:mb-0">
                        {/* Node */}
                        <div className="relative flex flex-col items-center">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${
                            stage.status === "completed" 
                              ? "border-success bg-success-muted" 
                              : stage.status === "current"
                              ? "border-warning bg-warning-muted"
                              : "border-border bg-muted"
                          }`}>
                            {getStageIcon(stage.status)}
                          </div>
                          {/* Connector line */}
                          {index < workflowStages.length - 1 && (
                            <div className={`w-0.5 h-10 mt-2 ${
                              stage.status === "completed" ? "bg-success" : "bg-border"
                            }`} />
                          )}
                        </div>
                        
                        {/* Stage Info */}
                        <div className={`flex-1 p-4 rounded-lg border ${
                          stage.status === "current" 
                            ? "border-warning bg-warning-muted/30" 
                            : "border-border"
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{stage.name}</h4>
                                {stage.status === "current" && (
                                  <Badge variant="warning" className="text-xs">Atual</Badge>
                                )}
                                {stage.status === "completed" && (
                                  <Badge variant="success" className="text-xs">Concluído</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Unidade: {stage.unit}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">{stage.date}</p>
                              {stage.user && (
                                <p className="font-medium">{stage.user}</p>
                              )}
                            </div>
                          </div>
                          {stage.duration !== "-" && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Duração: {stage.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Documentos Anexos */}
            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Documentos Anexos
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Anexar Documento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.type} • {doc.size} • {doc.date} • {doc.author}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Pareceres e Despachos */}
            <TabsContent value="pareceres" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileOutput className="h-4 w-4" />
                      Pareceres e Despachos
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Parecer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pareceres.map((parecer) => (
                      <div 
                        key={parecer.id}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={parecer.type === "Despacho" ? "info" : "secondary"}>
                                {parecer.type}
                              </Badge>
                              <span className="font-mono text-sm text-muted-foreground">
                                {parecer.number}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {parecer.author} • {parecer.unit} • {parecer.date}
                            </p>
                          </div>
                          <Badge 
                            variant={parecer.status === "favoravel" ? "success" : "info"}
                            className="capitalize"
                          >
                            {parecer.status === "favoravel" ? "Favorável" : "Encaminhado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          {parecer.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Completo
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Comentários Internos */}
            <TabsContent value="comentarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentários Internos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comentarios.map((comment) => (
                    <div 
                      key={comment.id}
                      className={`flex gap-3 p-4 rounded-lg ${
                        comment.isInternal ? "bg-warning-muted/30 border border-warning/20" : "bg-muted/30"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                        {comment.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{comment.author}</span>
                          {comment.isInternal && (
                            <Badge variant="warning" className="text-xs">Interno</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Add Comment */}
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Adicionar comentário..." 
                      className="min-h-[80px]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="internal" className="rounded" />
                        <label htmlFor="internal" className="text-sm text-muted-foreground">
                          Marcar como nota interna
                        </label>
                      </div>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Audit Log */}
            <TabsContent value="auditoria" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Registro de Auditoria
                    </CardTitle>
                    <Link to="/audit-logs">
                      <Button variant="link" size="sm" className="text-xs">
                        Ver completo
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {auditLog.map((entry, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm font-medium">{entry.action}</p>
                            <p className="text-xs text-muted-foreground">{entry.user}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{entry.date}</p>
                          <p className="font-mono">{entry.ip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Actions - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Primary Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="default">
                <Send className="h-4 w-4 mr-3" />
                Enviar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Forward className="h-4 w-4 mr-3" />
                Reencaminhar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileOutput className="h-4 w-4 mr-3" />
                Despachar
              </Button>
              <Separator className="my-3" />
              <Button className="w-full justify-start" variant="success">
                <ThumbsUp className="h-4 w-4 mr-3" />
                Aprovar
              </Button>
              <Button className="w-full justify-start" variant="destructive">
                <ThumbsDown className="h-4 w-4 mr-3" />
                Rejeitar
              </Button>
              <Separator className="my-3" />
              <Button className="w-full justify-start" variant="outline">
                <XCircle className="h-4 w-4 mr-3" />
                Encerrar
              </Button>
            </CardContent>
          </Card>

          {/* Process Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium">{processData.type}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">{processData.created}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Prazo</span>
                <span className="font-medium">{processData.deadline}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Solicitante</span>
                <span className="font-medium">{processData.requester}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Documentos</span>
                <span className="font-medium">{documents.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* SLA Indicator */}
          <Card className={processData.slaRemaining <= 3 ? "border-error" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  processData.slaRemaining > 10 
                    ? "bg-success-muted" 
                    : processData.slaRemaining > 3 
                    ? "bg-warning-muted" 
                    : "bg-error-muted"
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${
                    processData.slaRemaining > 10 
                      ? "text-success" 
                      : processData.slaRemaining > 3 
                      ? "text-warning" 
                      : "text-error"
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SLA Restante</p>
                  <p className={`text-xl font-bold ${
                    processData.slaRemaining > 10 
                      ? "text-success" 
                      : processData.slaRemaining > 3 
                      ? "text-warning" 
                      : "text-error"
                  }`}>
                    {processData.slaRemaining} dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Relacionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link 
                to="/documents/1"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">DOC-2024-001234</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProcessDetail;
