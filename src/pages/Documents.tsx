import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadModal } from "@/components/documents/UploadModal";
import { CreateProcessFromDocumentModal, DocumentInfo } from "@/components/documents/CreateProcessFromDocumentModal";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  Grid3X3, 
  List,
  MoreVertical,
  Download,
  Eye,
  Pencil,
  Trash2,
  Plus,
  FolderPlus,
  X,
  Archive,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const documents = [
  { id: 1, name: "Relatório Orçamental Anual 2024", type: "PDF", size: "2,4 MB", status: "approved", date: "1 Dez, 2024", author: "Sara Ferreira" },
  { id: 2, name: "Plano de Desenvolvimento de Infra-estruturas", type: "DOCX", size: "1,8 MB", status: "pending", date: "28 Nov, 2024", author: "Miguel Costa" },
  { id: 3, name: "Avaliação de Impacto Ambiental", type: "PDF", size: "5,2 MB", status: "in-progress", date: "25 Nov, 2024", author: "Ana Rodrigues" },
  { id: 4, name: "Proposta de Iniciativa de Saúde Pública", type: "DOCX", size: "890 KB", status: "draft", date: "22 Nov, 2024", author: "David Mendes" },
  { id: 5, name: "Alteração à Política de Transportes", type: "PDF", size: "1,2 MB", status: "rejected", date: "20 Nov, 2024", author: "Lígia Santos" },
  { id: 6, name: "Directrizes de Reforma Educativa", type: "PDF", size: "3,1 MB", status: "approved", date: "18 Nov, 2024", author: "Tiago Oliveira" },
  { id: 7, name: "Análise de Receita Fiscal T3", type: "XLSX", size: "756 KB", status: "approved", date: "15 Nov, 2024", author: "Maria Garcia" },
  { id: 8, name: "Protocolo de Resposta a Emergências", type: "PDF", size: "2,8 MB", status: "pending", date: "12 Nov, 2024", author: "Roberto Silva" },
];

const statusMap: Record<string, "approved" | "pending" | "in-progress" | "draft" | "rejected"> = {
  approved: "approved",
  pending: "pending",
  "in-progress": "in-progress",
  draft: "draft",
  rejected: "rejected",
};

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  "in-progress": "Em Curso",
  draft: "Rascunho",
  rejected: "Rejeitado",
};

const Documents = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createProcessModalOpen, setCreateProcessModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectDocument = (docId: number, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleCreateProcessFromSelection = () => {
    if (selectedDocuments.length > 0) {
      setCreateProcessModalOpen(true);
    }
  };

  const handleCreateProcessFromSingleDoc = (doc: typeof documents[0]) => {
    setSelectedDocuments([doc.id]);
    setCreateProcessModalOpen(true);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const getSelectedDocumentsInfo = (): DocumentInfo[] => {
    return selectedDocuments.map(id => {
      const doc = documents.find(d => d.id === id)!;
      return {
        number: `DOC-2024-${String(doc.id).padStart(6, '0')}`,
        title: doc.name,
        type: doc.type,
        origin: "Interno",
        subject: doc.name,
        author: doc.author,
      };
    });
  };

  const handleBulkDownload = async () => {
    setIsProcessing(true);
    // Simulate download preparation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const count = selectedDocuments.length;
    toast.success(`${count} documento${count > 1 ? 's' : ''} preparado${count > 1 ? 's' : ''} para download`, {
      description: "O download iniciará automaticamente.",
    });
    setIsProcessing(false);
    clearSelection();
  };

  const handleBulkArchive = async () => {
    setIsProcessing(true);
    // Simulate archive operation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const count = selectedDocuments.length;
    toast.success(`${count} documento${count > 1 ? 's' : ''} arquivado${count > 1 ? 's' : ''}`, {
      description: "Os documentos foram movidos para o arquivo.",
    });
    setIsProcessing(false);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    // Simulate delete operation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const count = selectedDocuments.length;
    toast.success(`${count} documento${count > 1 ? 's' : ''} eliminado${count > 1 ? 's' : ''}`, {
      description: "Os documentos foram removidos permanentemente.",
    });
    setIsProcessing(false);
    setDeleteDialogOpen(false);
    clearSelection();
  };

  const isAllSelected = selectedDocuments.length === documents.length;
  const hasSelection = selectedDocuments.length > 0;

  return (
    <DashboardLayout 
      title="Documentos" 
      subtitle="Gerir e organizar todos os documentos"
    >
      <PageBreadcrumb items={[{ label: "Documentos" }]} />

      {/* Selection Bar */}
      {hasSelection && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="font-medium">
              {selectedDocuments.length} documento{selectedDocuments.length > 1 ? 's' : ''} selecionado{selectedDocuments.length > 1 ? 's' : ''}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2" disabled={isProcessing}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkDownload}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descarregar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkArchive}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
              Arquivar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isProcessing}
              className="text-error hover:text-error hover:bg-error/10 border-error/30"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button size="sm" onClick={handleCreateProcessFromSelection} disabled={isProcessing}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Criar Processo
            </Button>
          </div>
        </div>
      )}

      {/* Barra de Ferramentas */}
      <Card variant="toolbar" className="mb-6">
        <CardContent className="py-3">
          <div className="toolbar">
            <div className="toolbar-actions">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar documentos..." 
                  className="pl-10 h-9"
                />
              </div>
              <Button variant="outline" size="icon-sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="toolbar-buttons">
              <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
                <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 bg-background shadow-sm">
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Carregar
              </Button>
              <Button size="sm" asChild>
                <Link to="/documents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Documento
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Documentos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <Checkbox 
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th>Documento</th>
                  <th className="w-20">Tipo</th>
                  <th className="w-24">Tamanho</th>
                  <th className="w-28">Estado</th>
                  <th className="w-36">Autor</th>
                  <th className="w-28">Data</th>
                  <th className="w-20 text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className={selectedDocuments.includes(doc.id) ? "bg-primary/5" : ""}>
                    <td>
                      <Checkbox 
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                      />
                    </td>
                    <td>
                      <Link to={`/documents/${doc.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{doc.name}</span>
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{doc.type}</td>
                    <td className="text-muted-foreground">{doc.size}</td>
                    <td>
                      <Badge variant={statusMap[doc.status]}>
                        {statusLabels[doc.status]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground">{doc.author}</td>
                    <td className="text-muted-foreground">{doc.date}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to={`/documents/${doc.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> Ver
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Descarregar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCreateProcessFromSingleDoc(doc)}>
                            <FolderPlus className="mr-2 h-4 w-4" /> Criar Processo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-error focus:text-error">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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

      {/* Paginação */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          A mostrar 1-8 de 156 documentos
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="default" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            Seguinte
          </Button>
        </div>
      </div>

      {/* Referência ao Registo de Auditoria */}
      <div className="mt-6">
        <AuditLogReference context="Ver histórico de actividade de documentos" />
      </div>

      {/* Modal de Carregamento */}
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />

      {/* Modal de Criar Processo */}
      {selectedDocuments.length > 0 && (
        <CreateProcessFromDocumentModal
          open={createProcessModalOpen}
          onOpenChange={(open) => {
            setCreateProcessModalOpen(open);
            if (!open) {
              setSelectedDocuments([]);
            }
          }}
          documents={getSelectedDocumentsInfo()}
        />
      )}

      {/* Dialog de Confirmação de Eliminação */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documentos?</AlertDialogTitle>
            <AlertDialogDescription>
              Está prestes a eliminar {selectedDocuments.length} documento{selectedDocuments.length > 1 ? 's' : ''}. 
              Esta ação não pode ser desfeita e os documentos serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-error hover:bg-error/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A eliminar...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Documents;