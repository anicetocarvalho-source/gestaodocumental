import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Archive as ArchiveIcon,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  FileText,
  FolderArchive,
  Clock,
  Building2,
  RotateCcw,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ArchivedDocument = {
  id: string;
  title: string;
  type: string;
  archivedDate: string;
  originalDate: string;
  unit: string;
  retentionYears: number;
  status: "archived" | "permanent" | "pending_destruction";
  classification: string;
};

type AuditLogEntry = {
  id: string;
  action: string;
  documentId: string;
  documentTitle: string;
  timestamp: Date;
  user: string;
  details: string;
};

const initialArchivedDocs: ArchivedDocument[] = [
  {
    id: "ARQ-2024-001",
    title: "Relatório Anual de Actividades 2020",
    type: "Relatório",
    archivedDate: "2024-01-15",
    originalDate: "2020-12-31",
    unit: "Gabinete do Ministro",
    retentionYears: 10,
    status: "archived",
    classification: "Administrativo",
  },
  {
    id: "ARQ-2024-002",
    title: "Contrato de Fornecimento - Equipamentos Agrícolas",
    type: "Contrato",
    archivedDate: "2024-02-20",
    originalDate: "2019-06-15",
    unit: "Direcção de Logística",
    retentionYears: 15,
    status: "permanent",
    classification: "Jurídico",
  },
  {
    id: "ARQ-2024-003",
    title: "Actas de Reunião - Conselho Directivo 2018",
    type: "Acta",
    archivedDate: "2024-03-10",
    originalDate: "2018-12-20",
    unit: "Secretaria-Geral",
    retentionYears: 20,
    status: "archived",
    classification: "Institucional",
  },
  {
    id: "ARQ-2024-004",
    title: "Processos de Licenciamento Florestal 2017",
    type: "Processo",
    archivedDate: "2024-01-05",
    originalDate: "2017-08-30",
    unit: "Direcção Florestal",
    retentionYears: 5,
    status: "pending_destruction",
    classification: "Operacional",
  },
  {
    id: "ARQ-2024-005",
    title: "Correspondência Oficial - Protocolo Internacional",
    type: "Correspondência",
    archivedDate: "2024-04-01",
    originalDate: "2021-03-15",
    unit: "Gabinete de Relações Internacionais",
    retentionYears: 25,
    status: "permanent",
    classification: "Diplomático",
  },
];

const stats = [
  { label: "Total Arquivado", value: "12.847", icon: FolderArchive, color: "text-primary" },
  { label: "Arquivo Permanente", value: "3.421", icon: ArchiveIcon, color: "text-success" },
  { label: "Pendente Eliminação", value: "234", icon: Clock, color: "text-warning" },
  { label: "Consultados (Mês)", value: "156", icon: Eye, color: "text-info" },
];

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [archivedDocs, setArchivedDocs] = useState<ArchivedDocument[]>(initialArchivedDocs);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ArchivedDocument | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const filteredDocs = archivedDocs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRestoreClick = (doc: ArchivedDocument) => {
    setSelectedDocument(doc);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = () => {
    if (!selectedDocument) return;

    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      action: "RESTORE",
      documentId: selectedDocument.id,
      documentTitle: selectedDocument.title,
      timestamp: new Date(),
      user: "Utilizador Actual",
      details: `Documento restaurado do arquivo para o sistema activo. Classificação: ${selectedDocument.classification}. Unidade: ${selectedDocument.unit}.`,
    };

    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Remove from archived documents
    setArchivedDocs((prev) => prev.filter((doc) => doc.id !== selectedDocument.id));

    toast.success("Documento restaurado com sucesso", {
      description: `${selectedDocument.title} foi movido para o sistema activo.`,
    });

    setRestoreDialogOpen(false);
    setSelectedDocument(null);
  };

  const getStatusBadge = (status: ArchivedDocument["status"]) => {
    switch (status) {
      case "archived":
        return <Badge variant="secondary">Arquivado</Badge>;
      case "permanent":
        return <Badge className="bg-success/10 text-success border-success/20">Permanente</Badge>;
      case "pending_destruction":
        return <Badge variant="destructive">Pendente Eliminação</Badge>;
    }
  };

  return (
    <DashboardLayout
      title="Arquivo"
      subtitle="Gestão de documentos e processos arquivados"
    >
      <PageBreadcrumb items={[{ label: "Arquivo" }]} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl bg-muted flex items-center justify-center", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar no arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Relatório">Relatório</SelectItem>
                <SelectItem value="Contrato">Contrato</SelectItem>
                <SelectItem value="Acta">Acta</SelectItem>
                <SelectItem value="Processo">Processo</SelectItem>
                <SelectItem value="Correspondência">Correspondência</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
                <SelectItem value="permanent">Permanente</SelectItem>
                <SelectItem value="pending_destruction">Pendente Eliminação</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showAuditLog ? "default" : "outline"}
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Auditoria ({auditLogs.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Panel */}
      {showAuditLog && (
        <Card className="mb-6 border-info/30 bg-info/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-info" />
              Registo de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum registo de auditoria disponível.
              </p>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-background rounded-lg border"
                  >
                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <RotateCcw className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {log.action === "RESTORE" ? "Documento Restaurado" : log.action}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleString("pt-PT")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {log.documentId} - {log.documentTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderArchive className="h-4 w-4" />
              Documentos Arquivados
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredDocs.length} documento(s)
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Unidade</TableHead>
                <TableHead className="hidden md:table-cell">Data Arquivo</TableHead>
                <TableHead className="hidden lg:table-cell">Retenção</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-xs">{doc.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate max-w-[200px]">{doc.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{doc.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.archivedDate).toLocaleDateString("pt-PT")}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{doc.retentionYears} anos</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {doc.status === "archived" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleRestoreClick(doc)}
                          title="Restaurar documento"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja restaurar o documento{" "}
              <strong>{selectedDocument?.title}</strong> para o sistema activo?
              <br />
              <br />
              Esta acção será registada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} className="bg-success hover:bg-success/90">
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Archive;
