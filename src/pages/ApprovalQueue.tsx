import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  User,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from "lucide-react";

const stats = [
  { icon: Clock, label: "Pendentes", value: 12, color: "text-warning" },
  { icon: AlertTriangle, label: "Urgentes", value: 5, color: "text-error" },
  { icon: CheckCircle, label: "Aprovados Hoje", value: 28, color: "text-success" },
  { icon: XCircle, label: "Rejeitados", value: 3, color: "text-muted-foreground" },
];

const approvalItems = [
  {
    id: 1,
    type: "document",
    title: "Relatório Orçamental Anual 2024",
    description: "Alocação final do orçamento para o ano fiscal 2025 incluindo discriminação por departamento",
    submitter: "Sara Ferreira",
    department: "Finanças",
    submitted: "há 2 horas",
    priority: "high",
    urgent: true,
  },
  {
    id: 2,
    type: "process",
    title: "Renovação de Contrato - Fornecedor ABC",
    description: "Renovação do acordo de serviço para manutenção de infra-estrutura de TI",
    submitter: "Miguel Costa",
    department: "Aquisições",
    submitted: "há 4 horas",
    priority: "medium",
    urgent: true,
  },
  {
    id: 3,
    type: "document",
    title: "Avaliação de Impacto Ambiental",
    description: "Relatório de avaliação para novo projecto de construção no distrito 7",
    submitter: "Ana Rodrigues",
    department: "Ambiente",
    submitted: "há 1 dia",
    priority: "medium",
    urgent: false,
  },
  {
    id: 4,
    type: "dispatch",
    title: "Pedido de Expedição de Equipamento",
    description: "Transferência de equipamento de emergência para escritório regional",
    submitter: "David Mendes",
    department: "Operações",
    submitted: "há 1 dia",
    priority: "high",
    urgent: false,
  },
  {
    id: 5,
    type: "document",
    title: "Proposta de Alteração de Política",
    description: "Actualizações aos protocolos de comunicação interna",
    submitter: "Lígia Santos",
    department: "RH",
    submitted: "há 2 dias",
    priority: "low",
    urgent: false,
  },
  {
    id: 6,
    type: "process",
    title: "Integração de Novo Fornecedor",
    description: "Aprovação para integrar TechCorp como parceiro tecnológico",
    submitter: "Tiago Oliveira",
    department: "Aquisições",
    submitted: "há 2 dias",
    priority: "medium",
    urgent: false,
  },
];

const selectedItem = approvalItems[0];

const approvalHistory = [
  { user: "João Silva", action: "Revisto", date: "há 1 hora", status: "pending" },
  { user: "Equipa Financeira", action: "Verificado", date: "há 3 horas", status: "approved" },
  { user: "Sara Ferreira", action: "Submetido", date: "há 2 dias", status: "submitted" },
];

const priorityLabels = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const ApprovalQueue = () => {
  return (
    <DashboardLayout 
      title="Fila de Aprovações" 
      subtitle="Rever e aprovar itens pendentes"
    >
      <PageBreadcrumb items={[{ label: "Fila de Aprovações" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat" className="p-5">
              <div className="flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl bg-muted/80 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Separadores e Filtro */}
        <div className="lg:col-span-12">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="processes">Processos</TabsTrigger>
                <TabsTrigger value="dispatches">Expedições</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 border border-border rounded-md bg-background text-sm"
                  aria-label="Ordenar por"
                >
                  <option>Mais Recentes</option>
                  <option>Mais Antigos</option>
                  <option>Prioridade</option>
                </select>
              </div>
            </div>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Lista da Fila - 8 colunas */}
                <div className="lg:col-span-8 space-y-3">
                  {approvalItems.map((item) => (
                    <Card 
                      key={item.id} 
                      variant="interactive"
                      className={`p-4 ${item.id === selectedItem.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex gap-4">
                        <Checkbox aria-label={`Seleccionar ${item.title}`} />
                        <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                                <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'info'}>
                                  {priorityLabels[item.priority as keyof typeof priorityLabels]}
                                </Badge>
                                {item.urgent && (
                                  <Badge variant="error-solid" className="text-xs">Urgente</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{item.submitted}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" aria-hidden="true" />
                              <span>{item.submitter}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                              <span>{item.department}</span>
                            </div>
                            <Badge variant="outline" className="capitalize">{item.type === 'document' ? 'Documento' : item.type === 'process' ? 'Processo' : 'Expedição'}</Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button size="sm">
                              <ThumbsUp className="h-3 w-3 mr-1" aria-hidden="true" />
                              Aprovar
                            </Button>
                            <Button variant="outline" size="sm">
                              <ThumbsDown className="h-3 w-3 mr-1" aria-hidden="true" />
                              Rejeitar
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-3 w-3 mr-1" aria-hidden="true" />
                              Pedir Informação
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {/* Paginação */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      A mostrar 1-6 de 12 itens
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>Anterior</Button>
                      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">Seguinte</Button>
                    </div>
                  </div>
                </div>

                {/* Painel de Pré-visualização - 4 colunas */}
                <div className="lg:col-span-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Pré-visualização</CardTitle>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                          Ver Completo
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Pré-visualização do Documento */}
                      <div className="h-48 bg-muted border border-border rounded-lg mb-4 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto" aria-hidden="true" />
                          <p className="text-xs text-muted-foreground">Pré-visualização do documento</p>
                        </div>
                      </div>
                      
                      {/* Detalhes */}
                      <div className="space-y-3">
                        {[
                          { label: "Título", value: selectedItem.title },
                          { label: "Tipo", value: selectedItem.type === 'document' ? 'Documento' : selectedItem.type === 'process' ? 'Processo' : 'Expedição' },
                          { label: "Remetente", value: selectedItem.submitter },
                          { label: "Departamento", value: selectedItem.department },
                          { label: "Submetido", value: selectedItem.submitted },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-foreground capitalize truncate max-w-[150px]">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Histórico de Aprovação */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Histórico de Aprovação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {approvalHistory.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                            {item.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.user}</span>
                              <Badge variant={item.status === 'approved' ? 'approved' : item.status === 'pending' ? 'pending' : 'draft'} className="text-xs">
                                {item.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Acções Rápidas */}
                  <div className="space-y-2">
                    <Button className="w-full">
                      <ThumbsUp className="h-4 w-4 mr-2" aria-hidden="true" />
                      Aprovar Seleccionados
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ThumbsDown className="h-4 w-4 mr-2" aria-hidden="true" />
                      Rejeitar Seleccionados
                    </Button>
                    <Button variant="ghost" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                      Comentário em Massa
                    </Button>
                  </div>

                  {/* Referência ao Registo de Auditoria */}
                  <AuditLogReference context="Ver actividade de aprovação" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApprovalQueue;
