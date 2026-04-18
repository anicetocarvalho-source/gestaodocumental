import { Check, X, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { actionPermissions, navigationPermissions } from "@/lib/permissions";
import { AppRole } from "@/hooks/useUserRole";
import { usePageTitle } from "@/hooks/usePageTitle";

const ROLES: { key: AppRole; label: string; color: string }[] = [
  { key: "admin", label: "Admin", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  { key: "gestor", label: "Gestor", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  { key: "tecnico", label: "Técnico", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
  { key: "consulta", label: "Consulta", color: "bg-muted text-muted-foreground border-border" },
];

const MODULE_LABELS: Record<string, string> = {
  documents: "Documentos",
  processes: "Processos",
  dispatches: "Despachos",
  archive: "Arquivo",
  reports: "Relatórios",
  digitization: "Digitalização",
  users: "Utilizadores",
  settings: "Configurações",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Eliminar",
  archive: "Arquivar",
  download: "Descarregar",
  classify: "Classificar",
  validate: "Validar",
  reject: "Rejeitar",
  dispatch: "Despachar",
  requestCorrection: "Pedir correcção",
  attachToProcess: "Anexar a processo",
  returnToOrigin: "Devolver à origem",
  sign: "Assinar",
  createProcess: "Criar processo",
  addAttachment: "Adicionar anexo",
  addComment: "Adicionar comentário",
  approve: "Aprovar",
  forward: "Encaminhar",
  requestInfo: "Pedir informação",
  assign: "Atribuir",
  close: "Fechar",
  addDocument: "Adicionar documento",
  addParecer: "Adicionar parecer",
  cancel: "Cancelar",
  addApprover: "Adicionar aprovador",
  removeApprover: "Remover aprovador",
  addRecipient: "Adicionar destinatário",
  emit: "Emitir",
  markForDestruction: "Marcar para destruição",
  approveDestruction: "Aprovar destruição",
  executeDestruction: "Executar destruição",
  cancelDestruction: "Cancelar destruição",
  extendRetention: "Estender retenção",
  bulkOperations: "Operações em lote",
  exportReport: "Exportar relatório",
  export: "Exportar",
  schedule: "Agendar",
  configureAlerts: "Configurar alertas",
  viewAnalytics: "Ver analytics",
  viewKPIs: "Ver KPIs",
  createBatch: "Criar lote",
  editBatch: "Editar lote",
  deleteBatch: "Eliminar lote",
  processOCR: "Processar OCR",
  qualityReview: "Revisão de qualidade",
  assignOperator: "Atribuir operador",
};

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <div className="flex items-center justify-center">
      {allowed ? (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-4 w-4 text-primary" />
        </div>
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10">
          <X className="h-4 w-4 text-destructive" />
        </div>
      )}
    </div>
  );
}

function ModuleTable({ module, actions }: { module: string; actions: Record<string, AppRole[]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {MODULE_LABELS[module] ?? module}
        </CardTitle>
        <CardDescription>
          {Object.keys(actions).length} acções definidas neste módulo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[40%] font-semibold">Acção</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r.key} className="text-center">
                    <Badge variant="outline" className={r.color}>{r.label}</Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(actions).map(([action, roles]) => (
                <TableRow key={action} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {ACTION_LABELS[action] ?? action}
                    <span className="ml-2 text-xs text-muted-foreground font-mono">{action}</span>
                  </TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.key}>
                      <PermissionCell allowed={roles.includes(r.key)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RoutesTable() {
  const sorted = Object.entries(navigationPermissions).sort(([a], [b]) => a.localeCompare(b));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Acesso a Rotas
        </CardTitle>
        <CardDescription>{sorted.length} rotas com permissões definidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[40%] font-semibold">Rota</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r.key} className="text-center">
                    <Badge variant="outline" className={r.color}>{r.label}</Badge>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(([path, roles]) => (
                <TableRow key={path} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{path}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.key}>
                      <PermissionCell allowed={roles.includes(r.key)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PermissionsMatrix() {
  usePageTitle("Matriz de Permissões");

  const handleExport = () => {
    const rows: string[] = ["Módulo,Acção,Admin,Gestor,Técnico,Consulta"];
    Object.entries(actionPermissions).forEach(([mod, actions]) => {
      Object.entries(actions as Record<string, AppRole[]>).forEach(([action, roles]) => {
        rows.push([
          MODULE_LABELS[mod] ?? mod,
          ACTION_LABELS[action] ?? action,
          roles.includes("admin") ? "Sim" : "Não",
          roles.includes("gestor") ? "Sim" : "Não",
          roles.includes("tecnico") ? "Sim" : "Não",
          roles.includes("consulta") ? "Sim" : "Não",
        ].join(","));
      });
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matriz-permissoes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modules = Object.entries(actionPermissions);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Matriz de Permissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Auditoria e documentação completa das permissões por perfil de utilizador
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfis do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLES.map((r) => (
              <div key={r.key} className="flex items-center gap-2 p-3 rounded-md border bg-card">
                <Badge variant="outline" className={r.color}>{r.label}</Badge>
                <span className="text-sm text-muted-foreground font-mono">{r.key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions">Acções por Módulo</TabsTrigger>
          <TabsTrigger value="routes">Acesso a Rotas</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-6">
          {modules.map(([module, actions]) => (
            <ModuleTable
              key={module}
              module={module}
              actions={actions as Record<string, AppRole[]>}
            />
          ))}
        </TabsContent>

        <TabsContent value="routes">
          <RoutesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
