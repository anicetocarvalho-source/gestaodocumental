import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  KeyRound,
  Plus,
  Loader2,
  Copy,
  Trash2,
  Webhook,
  ShieldCheck,
  Power,
  Code2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_delivery_at: string | null;
  last_delivery_status: number | null;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { id: "movement.created", label: "Movimento físico registado" },
  { id: "document.archived", label: "Documento arquivado" },
  { id: "loan.overdue", label: "Empréstimo em atraso" },
  { id: "document.created", label: "Documento registado" },
];

async function sha256Hex(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const ApiIntegrations = () => {
  const qc = useQueryClient();
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["read"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  const [hookDialog, setHookDialog] = useState(false);
  const [hookName, setHookName] = useState("");
  const [hookUrl, setHookUrl] = useState("");
  const [hookEvents, setHookEvents] = useState<string[]>(["movement.created"]);
  const [hookToDelete, setHookToDelete] = useState<WebhookEndpoint | null>(null);

  const { data: keys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async (): Promise<ApiKey[]> => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, scopes, is_active, last_used_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
  });

  const { data: hooks = [], isLoading: loadingHooks } = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: async (): Promise<WebhookEndpoint[]> => {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("id, name, url, events, is_active, last_delivery_at, last_delivery_status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WebhookEndpoint[];
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const raw = `nod_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
      const hash = await sha256Hex(raw);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("api_keys").insert({
        name: keyName.trim(),
        key_prefix: raw.slice(0, 12),
        key_hash: hash,
        scopes: keyScopes,
        created_by: userData.user?.id,
      });
      if (error) throw error;
      return raw;
    },
    onSuccess: (raw) => {
      setGeneratedKey(raw);
      setKeyName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleKey = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("api_keys").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chave revogada");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: () => toast.error("Não foi possível revogar a chave"),
  });

  const createHook = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("webhook_endpoints").insert({
        name: hookName.trim(),
        url: hookUrl.trim(),
        events: hookEvents,
        secret: crypto.randomUUID().replace(/-/g, ""),
        created_by: userData.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Webhook criado");
      setHookDialog(false);
      setHookName("");
      setHookUrl("");
      qc.invalidateQueries({ queryKey: ["webhook-endpoints"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleHook = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("webhook_endpoints").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });

  const deleteHook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Webhook removido");
      qc.invalidateQueries({ queryKey: ["webhook-endpoints"] });
    },
  });

  const apiBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-api`;

  return (
    <DashboardLayout
      title="Integração com Sistemas Externos"
      subtitle="Chaves de API e webhooks para ligação a ERP e outras plataformas"
    >
      <PageBreadcrumb items={[{ label: "Gestão" }, { label: "Integrações" }]} />

      <Tabs defaultValue="keys">
        <TabsList className="mb-6">
          <TabsTrigger value="keys">Chaves de API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">Chaves de API</CardTitle>
                <CardDescription>
                  A chave só é apresentada uma vez, no momento da criação.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setGeneratedKey(null);
                  setKeyDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova chave
              </Button>
            </CardHeader>
            <CardContent>
              {loadingKeys ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : keys.length === 0 ? (
                <div className="text-center py-12">
                  <KeyRound className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Nenhuma chave criada</p>
                  <p className="text-sm text-muted-foreground">
                    Crie uma chave para permitir o acesso do ERP ao NODIDOC.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Prefixo</TableHead>
                      <TableHead>Âmbitos</TableHead>
                      <TableHead>Última utilização</TableHead>
                      <TableHead>Activa</TableHead>
                      <TableHead className="text-right">Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.name}</TableCell>
                        <TableCell className="font-mono text-xs">{k.key_prefix}…</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {k.scopes.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {k.last_used_at
                            ? format(new Date(k.last_used_at), "dd/MM/yyyy HH:mm", { locale: pt })
                            : "Nunca"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={k.is_active}
                            onCheckedChange={(v) => toggleKey.mutate({ id: k.id, is_active: v })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Revogar"
                            onClick={() => setKeyToRevoke(k)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">Webhooks</CardTitle>
                <CardDescription>
                  Notificações automáticas enviadas para sistemas externos.
                </CardDescription>
              </div>
              <Button onClick={() => setHookDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo webhook
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHooks ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : hooks.length === 0 ? (
                <div className="text-center py-12">
                  <Webhook className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Nenhum webhook configurado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hooks.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{h.name}</p>
                          {h.last_delivery_status && (
                            <Badge
                              variant={h.last_delivery_status < 300 ? "secondary" : "destructive"}
                            >
                              {h.last_delivery_status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">{h.url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {h.events.map((e) => (
                            <Badge key={e} variant="outline" className="text-xs">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Power className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={h.is_active}
                          onCheckedChange={(v) => toggleHook.mutate({ id: h.id, is_active: v })}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remover"
                          onClick={() => setHookToDelete(h)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Endpoints disponíveis
              </CardTitle>
              <CardDescription>
                Autenticação por cabeçalho <code>x-api-key</code> com a chave gerada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border p-4 bg-muted/40 font-mono text-xs overflow-x-auto">
                {apiBase}
              </div>
              <div className="space-y-3">
                {[
                  { m: "GET", p: "/documents", d: "Lista documentos com estado e localização física" },
                  { m: "GET", p: "/documents/{entry_number}", d: "Detalhe de um documento" },
                  { m: "GET", p: "/locations", d: "Estrutura de localizações do arquivo" },
                  { m: "GET", p: "/movements", d: "Histórico de movimentações físicas" },
                  { m: "POST", p: "/movements", d: "Regista um movimento físico (âmbito write)" },
                ].map((e) => (
                  <div key={e.p + e.m} className="flex items-start gap-3 rounded-lg border p-3">
                    <Badge variant={e.m === "GET" ? "secondary" : "default"}>{e.m}</Badge>
                    <div>
                      <p className="font-mono text-xs">{e.p}</p>
                      <p className="text-muted-foreground text-xs mt-1">{e.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Todas as chamadas são registadas e associadas à organização da chave. As chaves são
                  guardadas apenas em forma cifrada (SHA-256).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nova chave */}
      <Dialog
        open={keyDialog}
        onOpenChange={(o) => {
          setKeyDialog(o);
          if (!o) setGeneratedKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{generatedKey ? "Chave criada" : "Nova chave de API"}</DialogTitle>
            <DialogDescription>
              {generatedKey
                ? "Copie a chave agora — não voltará a ser apresentada."
                : "Defina o nome e os âmbitos de acesso."}
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all">
                {generatedKey}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void navigator.clipboard.writeText(generatedKey);
                  toast.success("Chave copiada");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar chave
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ex.: Integração ERP Primavera"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Âmbitos</Label>
                {["read", "write"].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <Checkbox
                      id={`scope-${s}`}
                      checked={keyScopes.includes(s)}
                      onCheckedChange={(v) =>
                        setKeyScopes((prev) =>
                          v ? [...prev, s] : prev.filter((x) => x !== s),
                        )
                      }
                    />
                    <Label htmlFor={`scope-${s}`} className="font-normal">
                      {s === "read" ? "Leitura de dados" : "Registo de movimentos"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedKey ? (
              <Button onClick={() => setKeyDialog(false)}>Concluir</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setKeyDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!keyName.trim()) {
                      toast.error("Indique o nome da chave");
                      return;
                    }
                    createKey.mutate();
                  }}
                  disabled={createKey.isPending}
                >
                  {createKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar chave
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novo webhook */}
      <Dialog open={hookDialog} onOpenChange={setHookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo webhook</DialogTitle>
            <DialogDescription>
              O NODIDOC envia um POST com o evento para o endereço indicado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={hookName}
                onChange={(e) => setHookName(e.target.value)}
                maxLength={100}
                placeholder="Ex.: Notificações ERP"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={hookUrl}
                onChange={(e) => setHookUrl(e.target.value)}
                placeholder="https://erp.exemplo.ao/hooks/nodidoc"
              />
            </div>
            <div className="space-y-2">
              <Label>Eventos</Label>
              {AVAILABLE_EVENTS.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`ev-${e.id}`}
                    checked={hookEvents.includes(e.id)}
                    onCheckedChange={(v) =>
                      setHookEvents((prev) => (v ? [...prev, e.id] : prev.filter((x) => x !== e.id)))
                    }
                  />
                  <Label htmlFor={`ev-${e.id}`} className="font-normal">
                    {e.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHookDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!hookName.trim() || !hookUrl.trim().startsWith("https://")) {
                  toast.error("Indique um nome e um URL https válido");
                  return;
                }
                createHook.mutate();
              }}
              disabled={createHook.isPending}
            >
              {createHook.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!keyToRevoke} onOpenChange={(o) => !o && setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave?</AlertDialogTitle>
            <AlertDialogDescription>
              A chave "{keyToRevoke?.name}" deixará de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (keyToRevoke) deleteKey.mutate(keyToRevoke.id);
                setKeyToRevoke(null);
              }}
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!hookToDelete} onOpenChange={(o) => !o && setHookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover webhook?</AlertDialogTitle>
            <AlertDialogDescription>{hookToDelete?.url}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (hookToDelete) deleteHook.mutate(hookToDelete.id);
                setHookToDelete(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ApiIntegrations;
