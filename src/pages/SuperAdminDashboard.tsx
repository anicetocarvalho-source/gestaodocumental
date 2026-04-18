import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizations, usePlatformStats, usePlatformSettings } from "@/hooks/useSuperAdmin";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Building2, Users, FileText, HardDrive, Activity, Plus, Pencil, Trash2, AlertTriangle, Settings2, Globe, Shield,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SuperAdminDashboard = () => {
  usePageTitle("Super-Admin");

  return (
    <DashboardLayout title="Super-Admin" subtitle="Gestão global da plataforma multi-institucional">
      <div className="space-y-4">

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="organizations">Organizações</TabsTrigger>
            <TabsTrigger value="storage">Armazenamento</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="seed">Dados de Teste</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="organizations"><OrganizationsTab /></TabsContent>
          <TabsContent value="storage"><StorageTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="seed"><SeedDataTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

/* ───── Overview ───── */
function OverviewTab() {
  const { data: stats, isLoading } = usePlatformStats();

  const cards = [
    { label: "Organizações", value: stats?.totalOrganizations ?? 0, sub: `${stats?.activeOrganizations ?? 0} activas`, icon: Building2, color: "text-primary" },
    { label: "Utilizadores", value: stats?.totalUsers ?? 0, sub: "registados", icon: Users, color: "text-info" },
    { label: "Documentos", value: stats?.totalDocuments ?? 0, sub: "no sistema", icon: FileText, color: "text-success" },
    { label: "Armazenamento", value: `${((stats?.totalStorageUsedMb ?? 0) / 1024).toFixed(1)} GB`, sub: `de ${((stats?.totalStorageQuotaMb ?? 0) / 1024).toFixed(1)} GB`, icon: HardDrive, color: "text-warning" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "…" : c.value}</div>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ───── Organizations ───── */
function OrganizationsTab() {
  const { data: orgs, isLoading, createOrganization, updateOrganization, deleteOrganization } = useOrganizations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", plan: "standard", storage_quota_mb: 5120, max_users: 50, contact_email: "", domain: "", notes: "", admin_email: "", admin_password: "", admin_full_name: "" });

  const openNew = () => { setEditing(null); setForm({ name: "", code: "", plan: "standard", storage_quota_mb: 5120, max_users: 50, contact_email: "", domain: "", notes: "", admin_email: "", admin_password: "", admin_full_name: "" }); setDialogOpen(true); };
  const openEdit = (org: any) => { setEditing(org); setForm({ name: org.name, code: org.code, plan: org.plan, storage_quota_mb: org.storage_quota_mb, max_users: org.max_users, contact_email: org.contact_email || "", domain: org.domain || "", notes: org.notes || "", admin_email: "", admin_password: "", admin_full_name: "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast({ title: "Preencha nome e código", variant: "destructive" }); return; }
    if (editing) {
      await updateOrganization.mutateAsync({ id: editing.id, name: form.name, code: form.code, plan: form.plan, storage_quota_mb: form.storage_quota_mb, max_users: form.max_users, contact_email: form.contact_email, domain: form.domain, notes: form.notes });
    } else {
      if (!form.admin_email || !form.admin_password || !form.admin_full_name) {
        toast({ title: "Preencha os dados do administrador da organização", variant: "destructive" }); return;
      }
      await createOrganization.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que pretende remover esta organização?")) return;
    await deleteOrganization.mutateAsync(id);
  };

  const planLabels: Record<string, string> = { basic: "Básico", standard: "Standard", premium: "Premium", enterprise: "Enterprise" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Organizações</h2>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Organização</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead>Máx. Users</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
            ) : !orgs?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma organização registada</TableCell></TableRow>
            ) : orgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{org.code}</code></TableCell>
                <TableCell><Badge variant="outline">{planLabels[org.plan] || org.plan}</Badge></TableCell>
                <TableCell>{(org.storage_quota_mb / 1024).toFixed(1)} GB</TableCell>
                <TableCell>{org.max_users}</TableCell>
                <TableCell>
                  <Badge variant={org.is_active ? "default" : "secondary"}>{org.is_active ? "Activa" : "Inactiva"}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(org)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(org.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Organização" : "Nova Organização"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editing} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Domínio</Label>
                <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="exemplo.gov.ao" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quota (MB)</Label>
                <Input type="number" value={form.storage_quota_mb} onChange={(e) => setForm({ ...form, storage_quota_mb: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Máx. Utilizadores</Label>
                <Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email de Contacto</Label>
              <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            {!editing && (
              <>
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold mb-3">Administrador da Organização</h4>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input value={form.admin_full_name} onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })} placeholder="Nome do administrador" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@org.ao" />
                      </div>
                      <div className="space-y-2">
                        <Label>Palavra-passe *</Label>
                        <Input type="password" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} placeholder="Min. 8 caracteres" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createOrganization.isPending || updateOrganization.isPending}>
              {editing ? "Guardar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───── Storage ───── */
function StorageTab() {
  const { data: orgs, isLoading } = useOrganizations();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Armazenamento por Organização</h2>
      {isLoading ? (
        <p className="text-muted-foreground">A carregar…</p>
      ) : !orgs?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma organização registada</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {orgs.map((org) => {
            const pct = org.storage_quota_mb > 0 ? (org.storage_used_mb / org.storage_quota_mb) * 100 : 0;
            const isWarning = pct >= 80;
            const isCritical = pct >= 95;
            return (
              <Card key={org.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{org.name}</span>
                      {!org.is_active && <Badge variant="secondary">Inactiva</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCritical && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {isWarning && !isCritical && <AlertTriangle className="h-4 w-4 text-warning" />}
                      <span className="text-sm text-muted-foreground">
                        {(org.storage_used_mb / 1024).toFixed(2)} / {(org.storage_quota_mb / 1024).toFixed(1)} GB
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    variant={isCritical ? "error" : isWarning ? "warning" : "default"}
                    size="sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% utilizado</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───── Settings ───── */
function SettingsTab() {
  const { data: settings, isLoading, updateSetting } = usePlatformSettings();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const getValue = (s: any) => editValues[s.id] ?? s.setting_value ?? "";

  const handleChange = (id: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (s: any) => {
    const val = editValues[s.id];
    if (val === undefined) return;
    await updateSetting.mutateAsync({ id: s.id, setting_value: val });
    setEditValues((prev) => { const n = { ...prev }; delete n[s.id]; return n; });
  };

  const settingLabels: Record<string, string> = {
    max_upload_size_mb: "Tamanho Máx. Upload (MB)",
    maintenance_mode: "Modo Manutenção",
    platform_version: "Versão da Plataforma",
    default_storage_quota_mb: "Quota Padrão (MB)",
    max_users_per_org: "Máx. Users/Organização",
    session_timeout_minutes: "Timeout Sessão (min)",
    allow_self_registration: "Auto-Registo",
  };

  const settingIcons: Record<string, any> = {
    maintenance_mode: Activity,
    platform_version: Globe,
    max_upload_size_mb: HardDrive,
    default_storage_quota_mb: HardDrive,
    max_users_per_org: Users,
    session_timeout_minutes: Settings2,
    allow_self_registration: Shield,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Configurações Globais</h2>
      {isLoading ? (
        <p className="text-muted-foreground">A carregar…</p>
      ) : (
        <div className="grid gap-3">
          {settings?.map((s) => {
            const Icon = settingIcons[s.setting_key] || Settings2;
            const isBoolean = s.setting_type === "boolean";
            const isDirty = editValues[s.id] !== undefined;
            return (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{settingLabels[s.setting_key] || s.setting_key}</p>
                      {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBoolean ? (
                      <Switch
                        checked={getValue(s) === "true"}
                        onCheckedChange={(checked) => {
                          handleChange(s.id, String(checked));
                          updateSetting.mutate({ id: s.id, setting_value: String(checked) });
                        }}
                      />
                    ) : (
                      <>
                        <Input
                          className="w-40"
                          type={s.setting_type === "number" ? "number" : "text"}
                          value={getValue(s)}
                          onChange={(e) => handleChange(s.id, e.target.value)}
                        />
                        {isDirty && (
                          <Button size="sm" onClick={() => handleSave(s)} disabled={updateSetting.isPending}>
                            Guardar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───── Seed Data ───── */
function SeedDataTab() {
  const [loading, setLoading] = useState<"seed" | "clear" | null>(null);
  const [result, setResult] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState<"seed" | "clear" | null>(null);

  const run = async (action: "seed" | "clear") => {
    setLoading(action);
    setResult(null);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("seed-test-data", { body: { action } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast({ title: action === "seed" ? "Dados de teste carregados" : "Dados de teste removidos" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setConfirmOpen(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados de Teste</CardTitle>
          <CardDescription>
            Carrega registos representativos (documentos, despachos, processos, protocolo, digitalização, retenção, notificações)
            para validar end-to-end todos os fluxos da plataforma com os 4 perfis de utilizador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-warning/30 bg-warning-muted/30 p-3 text-sm">
            <p className="font-medium text-warning">Atenção</p>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground space-y-0.5 text-xs">
              <li>Os registos seed são marcados com <code className="text-xs">[SEED]</code> e podem ser removidos a qualquer momento.</li>
              <li>Recarregar substitui os registos seed anteriores (operação idempotente).</li>
              <li>Os ficheiros físicos não são carregados — apenas os metadados.</li>
              <li>Os utilizadores de teste (gestor, técnico, consulta) são associados às unidades criadas.</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setConfirmOpen("seed")} disabled={loading !== null}>
              {loading === "seed" ? "A carregar…" : "Carregar Dados de Teste"}
            </Button>
            <Button variant="outline" onClick={() => setConfirmOpen("clear")} disabled={loading !== null}>
              {loading === "clear" ? "A limpar…" : "Limpar Dados de Teste"}
            </Button>
          </div>

          {result?.summary && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-sm font-medium mb-2">Resumo da operação</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(result.summary).map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded bg-background px-2 py-1 border">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-mono font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.cleared && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <p className="font-medium mb-1">Registos removidos</p>
              <pre className="text-muted-foreground">{JSON.stringify(result.cleared, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen !== null} onOpenChange={(o) => !o && setConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmOpen === "seed" ? "Confirmar carregamento" : "Confirmar limpeza"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmOpen === "seed"
              ? "Esta operação remove dados seed anteriores e cria novos registos de teste. Continuar?"
              : "Esta operação remove todos os registos marcados como [SEED]. Esta acção é irreversível. Continuar?"}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(null)}>Cancelar</Button>
            <Button
              variant={confirmOpen === "clear" ? "destructive" : "default"}
              onClick={() => confirmOpen && run(confirmOpen)}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SuperAdminDashboard;
