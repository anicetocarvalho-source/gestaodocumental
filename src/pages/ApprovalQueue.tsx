import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { DispatchApprovalModal } from "@/components/dispatches/DispatchApprovalModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useApprovalQueue, ApprovalItem } from "@/hooks/useApprovalQueue";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  User,
  Building2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Loader2,
  Inbox
} from "lucide-react";

const priorityLabels = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

const dispatchTypeLabels: Record<string, string> = {
  informativo: "Informativo",
  determinativo: "Determinativo",
  autorizativo: "Autorizativo",
  homologativo: "Homologativo",
  decisorio: "Decisório",
};

interface ApprovalHistoryItem {
  user: string;
  action: string;
  date: string;
  status: string;
}

const ApprovalQueue = () => {
  const navigate = useNavigate();
  const { 
    approvalItems, 
    stats, 
    isLoading, 
    processApproval, 
    isProcessing,
    getApprovalHistory 
  } = useApprovalQueue();
  
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [currentApprovalItem, setCurrentApprovalItem] = useState<ApprovalItem | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'priority'>('recent');

  // Set first item as selected when data loads
  useEffect(() => {
    if (approvalItems.length > 0 && !selectedItem) {
      setSelectedItem(approvalItems[0]);
    }
  }, [approvalItems, selectedItem]);

  // Load approval history when selected item changes
  useEffect(() => {
    if (selectedItem?.referenceId) {
      getApprovalHistory(selectedItem.referenceId).then(setApprovalHistory);
    }
  }, [selectedItem?.referenceId]);

  const statCards = [
    { icon: Clock, label: "Pendentes", value: stats.pending, color: "text-warning" },
    { icon: AlertTriangle, label: "Urgentes", value: stats.urgent, color: "text-error" },
    { icon: CheckCircle, label: "Aprovados Hoje", value: stats.approvedToday, color: "text-success" },
    { icon: XCircle, label: "Rejeitados", value: stats.rejected, color: "text-muted-foreground" },
  ];

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleApproveClick = (item: ApprovalItem) => {
    setCurrentApprovalItem(item);
    setApprovalModalOpen(true);
  };

  const handleApprovalSubmit = async (decision: 'aprovado' | 'rejeitado' | 'devolvido', comments?: string) => {
    if (!currentApprovalItem?.approvalId) return;
    
    processApproval({
      approvalId: currentApprovalItem.approvalId,
      decision,
      comments,
    });
    
    // Clear selected item if it was processed
    if (selectedItem?.id === currentApprovalItem.id) {
      setSelectedItem(null);
    }
  };

  const handleViewDetails = (item: ApprovalItem) => {
    if (item.type === 'dispatch') {
      navigate(`/dispatches/${item.referenceId}`);
    }
  };

  // Sort items
  const sortedItems = [...approvalItems].sort((a, b) => {
    if (sortOrder === 'recent') {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    } else {
      const priorityOrder = { urgente: 0, alta: 1, normal: 2, baixa: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
  });

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgente':
      case 'alta':
        return 'error';
      case 'normal':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dispatch':
        return Send;
      case 'process':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dispatch':
        return 'Despacho';
      case 'process':
        return 'Processo';
      case 'document':
        return 'Documento';
      default:
        return type;
    }
  };

  return (
    <DashboardLayout 
      title="Fila de Aprovações" 
      subtitle="Rever e aprovar itens pendentes"
    >
      <PageBreadcrumb items={[{ label: "Fila de Aprovações" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} variant="stat" className="p-5">
              <div className="flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl bg-muted/80 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  )}
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
                <TabsTrigger value="all">Todos ({approvalItems.length})</TabsTrigger>
                <TabsTrigger value="dispatches">
                  Despachos ({approvalItems.filter(i => i.type === 'dispatch').length})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 border border-border rounded-md bg-background text-sm"
                  aria-label="Ordenar por"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest' | 'priority')}
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="oldest">Mais Antigos</option>
                  <option value="priority">Prioridade</option>
                </select>
              </div>
            </div>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Lista da Fila - 8 colunas */}
                <div className="lg:col-span-8 space-y-3">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="p-4">
                        <div className="flex gap-4">
                          <Skeleton className="h-5 w-5" />
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-8 w-48" />
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : sortedItems.length === 0 ? (
                    // Empty state
                    <Card className="p-12">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                          <Inbox className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">Nenhuma aprovação pendente</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Não tem itens a aguardar a sua aprovação de momento.
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    sortedItems.map((item) => {
                      const TypeIcon = getTypeIcon(item.type);
                      return (
                        <Card 
                          key={item.id} 
                          variant="interactive"
                          className={`p-4 cursor-pointer transition-all ${
                            selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex gap-4">
                            <Checkbox 
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => handleSelectItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Seleccionar ${item.title}`} 
                            />
                            <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                              <TypeIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                                    <Badge variant={getPriorityVariant(item.priority)}>
                                      {priorityLabels[item.priority]}
                                    </Badge>
                                    {item.urgent && (
                                      <Badge variant="error-solid" className="text-xs">Urgente</Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">{item.submitted}</span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" aria-hidden="true" />
                                  <span>{item.submitter}</span>
                                </div>
                                {item.department && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" aria-hidden="true" />
                                    <span>{item.department}</span>
                                  </div>
                                )}
                                <Badge variant="outline" className="capitalize">
                                  {getTypeLabel(item.type)}
                                </Badge>
                                {item.dispatchNumber && (
                                  <span className="font-mono text-xs">{item.dispatchNumber}</span>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveClick(item);
                                  }}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <ThumbsUp className="h-3 w-3 mr-1" aria-hidden="true" />
                                  )}
                                  Aprovar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentApprovalItem(item);
                                    setApprovalModalOpen(true);
                                  }}
                                  disabled={isProcessing}
                                >
                                  <ThumbsDown className="h-3 w-3 mr-1" aria-hidden="true" />
                                  Rejeitar
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(item);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                                  Ver Detalhes
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                  
                  {/* Paginação */}
                  {sortedItems.length > 0 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        A mostrar {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Painel de Pré-visualização - 4 colunas */}
                <div className="lg:col-span-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Pré-visualização</CardTitle>
                        {selectedItem && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(selectedItem)}
                          >
                            <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                            Ver Completo
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedItem ? (
                        <>
                          {/* Pré-visualização do Documento */}
                          <div className="h-48 bg-muted border border-border rounded-lg mb-4 flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Send className="h-8 w-8 text-muted-foreground mx-auto" aria-hidden="true" />
                              <p className="text-xs text-muted-foreground">
                                {selectedItem.dispatchNumber || 'Despacho'}
                              </p>
                              {selectedItem.dispatchType && (
                                <Badge variant="outline">
                                  {dispatchTypeLabels[selectedItem.dispatchType] || selectedItem.dispatchType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Detalhes */}
                          <div className="space-y-3">
                            {[
                              { label: "Título", value: selectedItem.title },
                              { label: "Tipo", value: getTypeLabel(selectedItem.type) },
                              { label: "Remetente", value: selectedItem.submitter },
                              { label: "Departamento", value: selectedItem.department || '-' },
                              { label: "Submetido", value: selectedItem.submitted },
                              { label: "Prioridade", value: priorityLabels[selectedItem.priority] },
                            ].map((item, i) => (
                              <div key={i} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-medium text-foreground capitalize truncate max-w-[150px]">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                          Seleccione um item para ver detalhes
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Histórico de Aprovação */}
                  {selectedItem && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Histórico de Aprovação</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {approvalHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sem histórico disponível</p>
                        ) : (
                          approvalHistory.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                                {item.user.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{item.user}</span>
                                  <Badge 
                                    variant={
                                      item.status === 'aprovado' ? 'approved' : 
                                      item.status === 'rejeitado' ? 'error' : 
                                      item.status === 'devolvido' ? 'warning' : 'pending'
                                    } 
                                    className="text-xs"
                                  >
                                    {item.action}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.date}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Acções Rápidas */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full"
                      disabled={selectedItems.size === 0 || isProcessing}
                      onClick={() => {
                        // Bulk approve - open modal for first selected
                        const firstSelected = approvalItems.find(i => selectedItems.has(i.id));
                        if (firstSelected) {
                          setCurrentApprovalItem(firstSelected);
                          setApprovalModalOpen(true);
                        }
                      }}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" aria-hidden="true" />
                      Aprovar Seleccionados ({selectedItems.size})
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={selectedItems.size === 0 || isProcessing}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" aria-hidden="true" />
                      Rejeitar Seleccionados
                    </Button>
                    <Button variant="ghost" className="w-full" disabled={selectedItems.size === 0}>
                      <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                      Comentário em Massa
                    </Button>
                  </div>

                  {/* Referência ao Registo de Auditoria */}
                  <AuditLogReference context="Ver actividade de aprovação" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dispatches" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3">
                  {sortedItems.filter(i => i.type === 'dispatch').length === 0 ? (
                    <Card className="p-12">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                          <Send className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">Nenhum despacho pendente</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Não tem despachos a aguardar a sua aprovação.
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    sortedItems.filter(i => i.type === 'dispatch').map((item) => (
                      <Card 
                        key={item.id} 
                        variant="interactive"
                        className={`p-4 cursor-pointer transition-all ${
                          selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex gap-4">
                          <Checkbox 
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Seleccionar ${item.title}`} 
                          />
                          <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                            <Send className="h-6 w-6 text-primary" aria-hidden="true" />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                                  <Badge variant={getPriorityVariant(item.priority)}>
                                    {priorityLabels[item.priority]}
                                  </Badge>
                                  {item.urgent && (
                                    <Badge variant="error-solid" className="text-xs">Urgente</Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">{item.submitted}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" aria-hidden="true" />
                                <span>{item.submitter}</span>
                              </div>
                              {item.department && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" aria-hidden="true" />
                                  <span>{item.department}</span>
                                </div>
                              )}
                              {item.dispatchNumber && (
                                <span className="font-mono text-xs">{item.dispatchNumber}</span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveClick(item);
                                }}
                                disabled={isProcessing}
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" aria-hidden="true" />
                                Aprovar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentApprovalItem(item);
                                  setApprovalModalOpen(true);
                                }}
                                disabled={isProcessing}
                              >
                                <ThumbsDown className="h-3 w-3 mr-1" aria-hidden="true" />
                                Rejeitar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(item);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
                <div className="lg:col-span-4">
                  {/* Same preview panel */}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Approval Modal */}
      <DispatchApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        dispatchNumber={currentApprovalItem?.dispatchNumber || currentApprovalItem?.title || ''}
        approverName=""
        onApprove={handleApprovalSubmit}
        isLoading={isProcessing}
      />
    </DashboardLayout>
  );
};

export default ApprovalQueue;
