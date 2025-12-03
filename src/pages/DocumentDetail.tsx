import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { 
  FileText, 
  Download, 
  Send,
  Forward,
  UserPlus,
  Archive,
  FolderPlus,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Calendar,
  Building2,
  Tag,
  Hash,
  Paperclip,
  MessageSquare,
  History,
  ChevronRight,
  Eye,
  Trash2,
  Plus
} from "lucide-react";
import { ClassificationPanel } from "@/components/documents/ClassificationPanel";

// Document metadata
const documentInfo = {
  entryNumber: "DOC-2024-001234",
  title: "Ofício nº 123/2024 - Secretaria de Educação",
  type: "Ofício",
  origin: "Secretaria de Educação",
  subject: "Solicitação de Recursos",
  description: "Solicitação de recursos adicionais para reforma das escolas municipais do distrito norte.",
  status: "Em Análise",
  author: "Maria Silva",
  department: "Gabinete",
  created: "15 Nov 2024",
  modified: "01 Dez 2024",
  priority: "Alta",
  classification: "Público",
};

// Workflow timeline stages
const workflowStages = [
  { 
    id: 1, 
    stage: "Recebido", 
    status: "completed", 
    date: "15 Nov 2024, 09:30",
    user: "Sistema",
    description: "Documento registrado no sistema"
  },
  { 
    id: 2, 
    stage: "Validado", 
    status: "completed", 
    date: "15 Nov 2024, 10:15",
    user: "Ana Costa",
    description: "Documento validado e classificado"
  },
  { 
    id: 3, 
    stage: "Atribuído", 
    status: "current", 
    date: "15 Nov 2024, 14:00",
    user: "Carlos Mendes",
    description: "Atribuído para análise técnica"
  },
  { 
    id: 4, 
    stage: "Arquivado", 
    status: "pending", 
    date: null,
    user: null,
    description: "Aguardando conclusão"
  },
];

// Attached documents
const attachments = [
  { id: 1, name: "Ofício Original.pdf", size: "2.4 MB", type: "PDF", date: "15 Nov 2024" },
  { id: 2, name: "Planilha Orçamentária.xlsx", size: "456 KB", type: "XLSX", date: "15 Nov 2024" },
  { id: 3, name: "Projeto Arquitetônico.dwg", size: "12.8 MB", type: "DWG", date: "16 Nov 2024" },
];

// Comments and internal notes
const comments = [
  { 
    id: 1,
    author: "Carlos Mendes", 
    avatar: "CM", 
    date: "01 Dez 2024, 14:30",
    type: "comment",
    text: "Verificado orçamento disponível. Aguardando parecer da área técnica." 
  },
  { 
    id: 2,
    author: "Ana Costa", 
    avatar: "AC", 
    date: "28 Nov 2024, 09:15",
    type: "note",
    text: "NOTA INTERNA: Prioridade alta conforme determinação do gabinete." 
  },
  { 
    id: 3,
    author: "Maria Silva", 
    avatar: "MS", 
    date: "15 Nov 2024, 10:00",
    type: "comment",
    text: "Documento recebido e protocolado. Encaminhado para validação." 
  },
];

// Audit log entries
const auditLog = [
  { action: "Visualização", user: "Carlos Mendes", date: "01 Dez 2024, 14:35", ip: "192.168.1.45" },
  { action: "Comentário adicionado", user: "Carlos Mendes", date: "01 Dez 2024, 14:30", ip: "192.168.1.45" },
  { action: "Atribuição alterada", user: "Ana Costa", date: "15 Nov 2024, 14:00", ip: "192.168.1.22" },
  { action: "Documento validado", user: "Ana Costa", date: "15 Nov 2024, 10:15", ip: "192.168.1.22" },
  { action: "Documento criado", user: "Sistema", date: "15 Nov 2024, 09:30", ip: "Sistema" },
];

const DocumentDetail = () => {
  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "current":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout 
      title="Detalhes do Documento" 
      subtitle="Visualizar e gerenciar documento"
    >
      <PageBreadcrumb 
        items={[
          { label: "Documentos", href: "/documents" },
          { label: documentInfo.entryNumber }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content - 9 columns */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Section 1: Document Metadata Summary */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-14 w-14 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {documentInfo.entryNumber}
                      </Badge>
                      <Badge variant="warning">{documentInfo.status}</Badge>
                      <Badge variant="destructive">{documentInfo.priority}</Badge>
                    </div>
                    <h1 className="text-lg font-semibold text-foreground">{documentInfo.title}</h1>
                    <p className="text-sm text-muted-foreground">{documentInfo.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to={`/documents/${documentInfo.entryNumber}/view`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    Tipo
                  </div>
                  <p className="text-sm font-medium">{documentInfo.type}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Origem
                  </div>
                  <p className="text-sm font-medium">{documentInfo.origin}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Responsável
                  </div>
                  <p className="text-sm font-medium">{documentInfo.author}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Data de Entrada
                  </div>
                  <p className="text-sm font-medium">{documentInfo.created}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Workflow Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fluxo do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex items-start justify-between">
                  {workflowStages.map((stage, index) => (
                    <div key={stage.id} className="flex flex-col items-center flex-1 relative">
                      {/* Connector line */}
                      {index < workflowStages.length - 1 && (
                        <div 
                          className={`absolute top-3 left-1/2 w-full h-0.5 ${
                            stage.status === "completed" ? "bg-success" : "bg-border"
                          }`}
                        />
                      )}
                      {/* Stage icon */}
                      <div className="relative z-10 bg-background p-1">
                        {getStageIcon(stage.status)}
                      </div>
                      {/* Stage info */}
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          stage.status === "current" ? "text-warning" : 
                          stage.status === "completed" ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {stage.stage}
                        </p>
                        {stage.date && (
                          <p className="text-xs text-muted-foreground mt-1">{stage.date}</p>
                        )}
                        {stage.user && (
                          <p className="text-xs text-muted-foreground">{stage.user}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Attached Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Documentos Anexos
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Anexo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div 
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-muted rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.type} • {attachment.size} • {attachment.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon-sm" aria-label="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Baixar">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Remover">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Comments and Internal Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comentários e Notas Internas
                </CardTitle>
                <Badge variant="secondary">{comments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`flex gap-3 p-3 rounded-lg ${
                    comment.type === "note" ? "bg-warning-muted border border-warning/20" : "bg-muted/30"
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{comment.author}</span>
                      {comment.type === "note" && (
                        <Badge variant="warning" className="text-xs">Nota Interna</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
              
              {/* Add Comment/Note */}
              <Separator />
              <div className="space-y-3">
                <Textarea 
                  placeholder="Adicionar comentário ou nota interna..." 
                  className="min-h-[80px]"
                  aria-label="Adicionar comentário"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="internal-note" className="rounded border-border" />
                    <label htmlFor="internal-note" className="text-sm text-muted-foreground">
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

          {/* Section 5: Audit Log */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Registro de Auditoria
                </CardTitle>
                <Link to="/audit-logs">
                  <Button variant="link" size="sm" className="text-xs h-auto p-0">
                    Ver completo
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLog.map((entry, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">{entry.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{entry.user}</span>
                      <span className="text-xs">{entry.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <Forward className="h-4 w-4 mr-3" />
                Despachar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="h-4 w-4 mr-3" />
                Reatribuir
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Archive className="h-4 w-4 mr-3" />
                Arquivar
              </Button>
              <Separator className="my-3" />
              <Button className="w-full justify-start" variant="success">
                <FolderPlus className="h-4 w-4 mr-3" />
                Criar Processo
              </Button>
            </CardContent>
          </Card>

          {/* Document Classification Panel */}
          <ClassificationPanel 
            documentId={documentInfo.entryNumber}
            currentClassification="100.20.02"
            compact={true}
            onClassificationSaved={(code) => console.log("Classification saved:", code)}
          />

          {/* Document Info Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Assunto</span>
                <span className="text-sm font-medium">{documentInfo.subject}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <Badge variant="destructive">{documentInfo.priority}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Unidade</span>
                <span className="text-sm font-medium">{documentInfo.department}</span>
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Itens Relacionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link 
                to="/processes/1" 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">PROC-2024-0056</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link 
                to="/documents" 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">DOC-2024-001230</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Última atualização</span>
                <span className="font-medium">{documentInfo.modified}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Total de anexos</span>
                <span className="font-medium">{attachments.length}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Comentários</span>
                <span className="font-medium">{comments.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentDetail;
