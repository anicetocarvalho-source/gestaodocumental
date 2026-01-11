import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Clock,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  useSLARules,
  useSLAPriorities,
  useCreateSLARule,
  useUpdateSLARule,
  useDeleteSLARule,
  useUpdateSLAPriority,
  SLARule,
  SLAPriority,
} from "@/hooks/useSLAConfiguration";

// Types for form
interface EscalationRule {
  id: string;
  triggerAfter: number;
  triggerUnit: "hours" | "days" | "percent";
  notifyRole: string;
  action: string;
}

interface AlertConfig {
  email: boolean;
  sms: boolean;
  system: boolean;
  reminderBefore: number;
  reminderUnit: "hours" | "days";
}

interface SimulationState {
  isRunning: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  escalationsTriggered: string[];
  currentPhase: "normal" | "warning" | "critical" | "expired";
}

const processTypes = [
  { id: "licitacao", name: "Licitação" },
  { id: "contrato", name: "Contrato" },
  { id: "rh", name: "Recursos Humanos" },
  { id: "financeiro", name: "Financeiro" },
  { id: "juridico", name: "Jurídico" },
  { id: "administrativo", name: "Administrativo" },
  { id: "protocolo", name: "Protocolo Geral" },
];

const roles = [
  { id: "supervisor", name: "Supervisor Imediato" },
  { id: "gerente", name: "Gerente de Setor" },
  { id: "diretor", name: "Diretor" },
  { id: "secretario", name: "Secretário" },
];

const SLAConfiguration = () => {
  const { data: slaRules = [], isLoading: rulesLoading } = useSLARules();
  const { data: priorities = [], isLoading: prioritiesLoading } = useSLAPriorities();
  const createRule = useCreateSLARule();
  const updateRule = useUpdateSLARule();
  const deleteRule = useDeleteSLARule();
  const updatePriority = useUpdateSLAPriority();

  const [editingRule, setEditingRule] = useState<SLARule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: false,
    elapsedSeconds: 0,
    totalSeconds: 120,
    escalationsTriggered: [],
    currentPhase: "normal",
  });
  const [selectedSimulationRule, setSelectedSimulationRule] = useState<string>("");
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    process_type: string;
    priority: string;
    duration_hours: number;
    warning_threshold: number;
    critical_threshold: number;
    escalation_rules: EscalationRule[];
    alert_config: AlertConfig;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    process_type: "",
    priority: "normal",
    duration_hours: 48,
    warning_threshold: 75,
    critical_threshold: 90,
    escalation_rules: [],
    alert_config: { email: true, sms: false, system: true, reminderBefore: 1, reminderUnit: "days" },
    is_active: true,
  });

  useEffect(() => {
    if (slaRules.length > 0 && !selectedSimulationRule) {
      setSelectedSimulationRule(slaRules[0].id);
    }
  }, [slaRules, selectedSimulationRule]);

  // Simulation logic
  useEffect(() => {
    if (simulation.isRunning) {
      simulationIntervalRef.current = setInterval(() => {
        setSimulation((prev) => {
          const newElapsed = prev.elapsedSeconds + 1;
          const percentComplete = (newElapsed / prev.totalSeconds) * 100;
          
          let phase: SimulationState["currentPhase"] = "normal";
          if (percentComplete >= 100) phase = "expired";
          else if (percentComplete >= 90) phase = "critical";
          else if (percentComplete >= 70) phase = "warning";

          const selectedRule = slaRules.find((r) => r.id === selectedSimulationRule);
          const newEscalations = [...prev.escalationsTriggered];
          
          if (selectedRule) {
            const escalationRules = (selectedRule.escalation_rules || []) as EscalationRule[];
            escalationRules.forEach((esc) => {
              const escId = esc.id;
              if (!newEscalations.includes(escId)) {
                let shouldTrigger = false;
                if (esc.triggerUnit === "percent" && percentComplete >= esc.triggerAfter) {
                  shouldTrigger = true;
                }
                
                if (shouldTrigger) {
                  newEscalations.push(escId);
                  toast.info(`Escalação: ${esc.action}`);
                }
              }
            });
          }

          if (newElapsed >= prev.totalSeconds) {
            clearInterval(simulationIntervalRef.current!);
            return { ...prev, elapsedSeconds: prev.totalSeconds, isRunning: false, escalationsTriggered: newEscalations, currentPhase: "expired" };
          }

          return { ...prev, elapsedSeconds: newElapsed, escalationsTriggered: newEscalations, currentPhase: phase };
        });
      }, 100);
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [simulation.isRunning, selectedSimulationRule, slaRules]);

  const startSimulation = () => {
    setSimulation({
      isRunning: true,
      elapsedSeconds: 0,
      totalSeconds: 120,
      escalationsTriggered: [],
      currentPhase: "normal",
    });
  };

  const pauseSimulation = () => {
    setSimulation((prev) => ({ ...prev, isRunning: false }));
  };

  const resetSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setSimulation({
      isRunning: false,
      elapsedSeconds: 0,
      totalSeconds: 120,
      escalationsTriggered: [],
      currentPhase: "normal",
    });
  };

  const handleSaveRule = () => {
    if (!formData.name || !formData.process_type) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const ruleData = {
      name: formData.name,
      description: formData.description,
      process_type: formData.process_type,
      priority: formData.priority,
      duration_hours: formData.duration_hours,
      warning_threshold: formData.warning_threshold,
      critical_threshold: formData.critical_threshold,
      escalation_rules: formData.escalation_rules,
      alert_config: formData.alert_config,
      is_active: formData.is_active,
    };

    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...ruleData }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingRule(null);
          resetFormData();
        }
      });
    } else {
      createRule.mutate(ruleData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetFormData();
        }
      });
    }
  };

  const handleDeleteRule = (id: string) => {
    deleteRule.mutate(id);
  };

  const handleEditRule = (rule: SLARule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      process_type: rule.process_type,
      priority: rule.priority,
      duration_hours: rule.duration_hours,
      warning_threshold: rule.warning_threshold,
      critical_threshold: rule.critical_threshold,
      escalation_rules: (rule.escalation_rules || []) as EscalationRule[],
      alert_config: (rule.alert_config || { email: true, sms: false, system: true, reminderBefore: 1, reminderUnit: "days" }) as AlertConfig,
      is_active: rule.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
      process_type: "",
      priority: "normal",
      duration_hours: 48,
      warning_threshold: 75,
      critical_threshold: 90,
      escalation_rules: [],
      alert_config: { email: true, sms: false, system: true, reminderBefore: 1, reminderUnit: "days" },
      is_active: true,
    });
  };

  const addEscalationRule = () => {
    const newEsc: EscalationRule = {
      id: Date.now().toString(),
      triggerAfter: 50,
      triggerUnit: "percent",
      notifyRole: "supervisor",
      action: "Notificar responsável",
    };
    setFormData((prev) => ({
      ...prev,
      escalation_rules: [...prev.escalation_rules, newEsc],
    }));
  };

  const removeEscalationRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      escalation_rules: prev.escalation_rules.filter((e) => e.id !== id),
    }));
  };

  const updateEscalationRule = (id: string, field: keyof EscalationRule, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      escalation_rules: prev.escalation_rules.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  };

  const simulationProgress = (simulation.elapsedSeconds / simulation.totalSeconds) * 100;
  const selectedRuleForSim = slaRules.find((r) => r.id === selectedSimulationRule);

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      baixa: { label: "Baixa", variant: "secondary" },
      normal: { label: "Normal", variant: "default" },
      alta: { label: "Alta", variant: "destructive" },
      urgente: { label: "Urgente", variant: "destructive" },
    };
    const p = config[priority] || config.normal;
    return <Badge variant={p.variant}>{p.label}</Badge>;
  };

  if (rulesLoading || prioritiesLoading) {
    return (
      <DashboardLayout title="Configuração de SLA" subtitle="Gerenciar prazos e escalações">
        <PageBreadcrumb items={[{ label: "Configurações", href: "/settings" }, { label: "SLA" }]} />
        <div className="space-y-6">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configuração de SLA" subtitle="Gerenciar prazos e escalações">
      <PageBreadcrumb items={[{ label: "Configurações", href: "/settings" }, { label: "SLA" }]} />

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="rules">Regras de SLA</TabsTrigger>
          <TabsTrigger value="priorities">Prioridades</TabsTrigger>
          <TabsTrigger value="simulation">Simulação</TabsTrigger>
        </TabsList>

        {/* Tab 1: SLA Rules */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Regras de SLA por Tipo de Processo</h2>
              <p className="text-sm text-muted-foreground">Configure prazos e escalações para cada tipo de processo</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingRule(null); resetFormData(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRule ? "Editar Regra de SLA" : "Nova Regra de SLA"}</DialogTitle>
                  <DialogDescription>Configure os parâmetros de SLA para o tipo de processo</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Regra *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: SLA Licitação Urgente"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Processo *</Label>
                      <Select
                        value={formData.process_type}
                        onValueChange={(v) => setFormData({ ...formData, process_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {processTypes.map((pt) => (
                            <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(v) => setFormData({ ...formData, priority: v })}
                      >
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
                      <Label>Prazo (horas) *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alerta de Aviso (%)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.warning_threshold}
                        onChange={(e) => setFormData({ ...formData, warning_threshold: parseInt(e.target.value) || 75 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alerta Crítico (%)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.critical_threshold}
                        onChange={(e) => setFormData({ ...formData, critical_threshold: parseInt(e.target.value) || 90 })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Escalation Rules */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Regras de Escalação</Label>
                        <p className="text-xs text-muted-foreground">Defina quando e para quem escalar</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={addEscalationRule}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {formData.escalation_rules.map((esc, idx) => (
                      <Card key={esc.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Disparar em</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-16"
                                  value={esc.triggerAfter}
                                  onChange={(e) => updateEscalationRule(esc.id, "triggerAfter", parseInt(e.target.value) || 0)}
                                />
                                <Select
                                  value={esc.triggerUnit}
                                  onValueChange={(v) => updateEscalationRule(esc.id, "triggerUnit", v)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">%</SelectItem>
                                    <SelectItem value="hours">Horas</SelectItem>
                                    <SelectItem value="days">Dias</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Notificar</Label>
                              <Select
                                value={esc.notifyRole}
                                onValueChange={(v) => updateEscalationRule(esc.id, "notifyRole", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Ação</Label>
                              <Input
                                value={esc.action}
                                onChange={(e) => updateEscalationRule(esc.id, "action", e.target.value)}
                                placeholder="Descreva a ação..."
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeEscalationRule(esc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Alerts */}
                  <div className="space-y-4">
                    <Label className="text-base">Configuração de Alertas</Label>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.alert_config.email}
                          onCheckedChange={(v) => setFormData({ ...formData, alert_config: { ...formData.alert_config, email: v } })}
                        />
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Email</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.alert_config.sms}
                          onCheckedChange={(v) => setFormData({ ...formData, alert_config: { ...formData.alert_config, sms: v } })}
                        />
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">SMS</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.alert_config.system}
                          onCheckedChange={(v) => setFormData({ ...formData, alert_config: { ...formData.alert_config, system: v } })}
                        />
                        <div className="flex items-center gap-1">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Sistema</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    />
                    <Label>Regra activa</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveRule}
                    disabled={createRule.isPending || updateRule.isPending}
                  >
                    {(createRule.isPending || updateRule.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingRule ? "Guardar Alterações" : "Criar Regra"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {slaRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma regra SLA configurada</h3>
                <p className="text-muted-foreground mb-4">Crie a primeira regra de SLA para gerir prazos</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Regra
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo de Processo</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Escalações</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{processTypes.find(p => p.id === rule.process_type)?.name || rule.process_type}</TableCell>
                      <TableCell>{rule.duration_hours}h</TableCell>
                      <TableCell>{getPriorityBadge(rule.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {((rule.escalation_rules || []) as EscalationRule[]).length} regras
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEditRule(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Priorities */}
        <TabsContent value="priorities" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Configuração de Prioridades</h2>
            <p className="text-sm text-muted-foreground">Defina os multiplicadores de tempo e escalação inicial para cada prioridade</p>
          </div>

          <div className="grid gap-4">
            {priorities.map((priority) => (
              <Card key={priority.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${priority.color}20` }}
                      >
                        <Zap className="h-5 w-5" style={{ color: priority.color }} />
                      </div>
                      <div>
                        <p className="font-medium">{priority.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Multiplicador: {priority.time_multiplier}x
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Escalação Inicial</p>
                        <p className="font-medium">
                          {roles.find(r => r.id === priority.initial_escalation_role)?.name || "Não definido"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Simulation */}
        <TabsContent value="simulation" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Simulação de SLA</h2>
            <p className="text-sm text-muted-foreground">Teste as escalações e alertas antes de ativar as regras</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Controles de Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Regra de SLA a Simular</Label>
                  <Select value={selectedSimulationRule} onValueChange={setSelectedSimulationRule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma regra" />
                    </SelectTrigger>
                    <SelectContent>
                      {slaRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  {simulation.isRunning ? (
                    <Button variant="outline" onClick={pauseSimulation}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  ) : (
                    <Button onClick={startSimulation} disabled={!selectedSimulationRule}>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetSimulation}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reiniciar
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{Math.round(simulationProgress)}%</span>
                  </div>
                  <Progress 
                    value={simulationProgress} 
                    className={cn(
                      simulation.currentPhase === "warning" && "bg-warning/20",
                      simulation.currentPhase === "critical" && "bg-destructive/20",
                      simulation.currentPhase === "expired" && "bg-destructive/20"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {simulation.currentPhase === "normal" && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {simulation.currentPhase === "warning" && <AlertTriangle className="h-4 w-4 text-warning" />}
                    {simulation.currentPhase === "critical" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {simulation.currentPhase === "expired" && <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="text-sm capitalize">{simulation.currentPhase}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escalation Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log de Escalações</CardTitle>
              </CardHeader>
              <CardContent>
                {simulation.escalationsTriggered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma escalação disparada ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {simulation.escalationsTriggered.map((escId, idx) => {
                      const esc = (selectedRuleForSim?.escalation_rules as EscalationRule[] || []).find(e => e.id === escId);
                      return (
                        <div key={escId} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Zap className="h-4 w-4 text-warning" />
                          <span className="text-sm">{esc?.action || "Escalação"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SLAConfiguration;
