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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
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
  Settings2,
  TrendingUp,
  Timer,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Info,
} from "lucide-react";

// Types
interface SLARule {
  id: string;
  processType: string;
  duration: number;
  unit: "hours" | "days";
  businessDaysOnly: boolean;
  priority: "low" | "medium" | "high" | "critical";
  escalationRules: EscalationRule[];
  alerts: AlertConfig;
  isActive: boolean;
}

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

// Mock data
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

const initialSLARules: SLARule[] = [
  {
    id: "1",
    processType: "licitacao",
    duration: 30,
    unit: "days",
    businessDaysOnly: true,
    priority: "high",
    escalationRules: [
      { id: "e1", triggerAfter: 50, triggerUnit: "percent", notifyRole: "supervisor", action: "Notificar supervisor" },
      { id: "e2", triggerAfter: 75, triggerUnit: "percent", notifyRole: "gerente", action: "Escalar para gerente" },
      { id: "e3", triggerAfter: 90, triggerUnit: "percent", notifyRole: "diretor", action: "Alerta urgente ao diretor" },
    ],
    alerts: { email: true, sms: true, system: true, reminderBefore: 2, reminderUnit: "days" },
    isActive: true,
  },
  {
    id: "2",
    processType: "contrato",
    duration: 15,
    unit: "days",
    businessDaysOnly: true,
    priority: "medium",
    escalationRules: [
      { id: "e4", triggerAfter: 70, triggerUnit: "percent", notifyRole: "supervisor", action: "Notificar supervisor" },
    ],
    alerts: { email: true, sms: false, system: true, reminderBefore: 1, reminderUnit: "days" },
    isActive: true,
  },
  {
    id: "3",
    processType: "protocolo",
    duration: 48,
    unit: "hours",
    businessDaysOnly: false,
    priority: "low",
    escalationRules: [],
    alerts: { email: true, sms: false, system: true, reminderBefore: 4, reminderUnit: "hours" },
    isActive: true,
  },
  {
    id: "4",
    processType: "juridico",
    duration: 5,
    unit: "days",
    businessDaysOnly: true,
    priority: "critical",
    escalationRules: [
      { id: "e5", triggerAfter: 24, triggerUnit: "hours", notifyRole: "supervisor", action: "Alerta imediato" },
      { id: "e6", triggerAfter: 48, triggerUnit: "hours", notifyRole: "gerente", action: "Escalar urgente" },
      { id: "e7", triggerAfter: 72, triggerUnit: "hours", notifyRole: "diretor", action: "Situação crítica" },
    ],
    alerts: { email: true, sms: true, system: true, reminderBefore: 12, reminderUnit: "hours" },
    isActive: true,
  },
];

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500", textColor: "text-slate-500", bgMuted: "bg-slate-500/10" },
  medium: { label: "Média", color: "bg-blue-500", textColor: "text-blue-500", bgMuted: "bg-blue-500/10" },
  high: { label: "Alta", color: "bg-amber-500", textColor: "text-amber-500", bgMuted: "bg-amber-500/10" },
  critical: { label: "Crítica", color: "bg-red-500", textColor: "text-red-500", bgMuted: "bg-red-500/10" },
};

const SLAConfiguration = () => {
  const [slaRules, setSlaRules] = useState<SLARule[]>(initialSLARules);
  const [editingRule, setEditingRule] = useState<SLARule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: false,
    elapsedSeconds: 0,
    totalSeconds: 120, // 2 minutes for demo
    escalationsTriggered: [],
    currentPhase: "normal",
  });
  const [selectedSimulationRule, setSelectedSimulationRule] = useState<string>("1");
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<SLARule>>({
    processType: "",
    duration: 0,
    unit: "days",
    businessDaysOnly: true,
    priority: "medium",
    escalationRules: [],
    alerts: { email: true, sms: false, system: true, reminderBefore: 1, reminderUnit: "days" },
    isActive: true,
  });

  // Simulation logic
  useEffect(() => {
    if (simulation.isRunning) {
      simulationIntervalRef.current = setInterval(() => {
        setSimulation((prev) => {
          const newElapsed = prev.elapsedSeconds + 1;
          const percentComplete = (newElapsed / prev.totalSeconds) * 100;
          
          // Determine phase
          let phase: SimulationState["currentPhase"] = "normal";
          if (percentComplete >= 100) phase = "expired";
          else if (percentComplete >= 90) phase = "critical";
          else if (percentComplete >= 70) phase = "warning";

          // Check escalations
          const selectedRule = slaRules.find((r) => r.id === selectedSimulationRule);
          const newEscalations = [...prev.escalationsTriggered];
          
          if (selectedRule) {
            selectedRule.escalationRules.forEach((esc) => {
              const escId = esc.id;
              if (!newEscalations.includes(escId)) {
                let shouldTrigger = false;
                if (esc.triggerUnit === "percent" && percentComplete >= esc.triggerAfter) {
                  shouldTrigger = true;
                } else if (esc.triggerUnit === "hours") {
                  const hoursElapsed = (newElapsed / prev.totalSeconds) * (selectedRule.unit === "hours" ? selectedRule.duration : selectedRule.duration * 24);
                  if (hoursElapsed >= esc.triggerAfter) shouldTrigger = true;
                }
                
                if (shouldTrigger) {
                  newEscalations.push(escId);
                  toast({
                    title: "Escalação Acionada",
                    description: `${esc.action} - ${roles.find((r) => r.id === esc.notifyRole)?.name}`,
                    variant: phase === "critical" ? "destructive" : "default",
                  });
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
      }, 100); // Speed up simulation (100ms = 1 second in sim)
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
    if (!formData.processType || !formData.duration) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (editingRule) {
      setSlaRules((prev) =>
        prev.map((r) => (r.id === editingRule.id ? { ...r, ...formData } as SLARule : r))
      );
      toast({ title: "SLA Atualizado", description: "Regra de SLA atualizada com sucesso" });
    } else {
      const newRule: SLARule = {
        id: Date.now().toString(),
        ...formData,
      } as SLARule;
      setSlaRules((prev) => [...prev, newRule]);
      toast({ title: "SLA Criado", description: "Nova regra de SLA criada com sucesso" });
    }

    setIsDialogOpen(false);
    setEditingRule(null);
    resetFormData();
  };

  const handleDeleteRule = (id: string) => {
    setSlaRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "SLA Removido", description: "Regra de SLA removida com sucesso" });
  };

  const handleEditRule = (rule: SLARule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsDialogOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      processType: "",
      duration: 0,
      unit: "days",
      businessDaysOnly: true,
      priority: "medium",
      escalationRules: [],
      alerts: { email: true, sms: false, system: true, reminderBefore: 1, reminderUnit: "days" },
      isActive: true,
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
      escalationRules: [...(prev.escalationRules || []), newEsc],
    }));
  };

  const removeEscalationRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      escalationRules: prev.escalationRules?.filter((e) => e.id !== id) || [],
    }));
  };

  const updateEscalationRule = (id: string, field: keyof EscalationRule, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      escalationRules: prev.escalationRules?.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ) || [],
    }));
  };

  const simulationProgress = (simulation.elapsedSeconds / simulation.totalSeconds) * 100;
  const selectedRuleForSim = slaRules.find((r) => r.id === selectedSimulationRule);

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
                      <Label>Tipo de Processo *</Label>
                      <Select
                        value={formData.processType}
                        onValueChange={(v) => setFormData({ ...formData, processType: v })}
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
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(v) => setFormData({ ...formData, priority: v as SLARule["priority"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", config.color)} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Prazo de SLA *</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        value={formData.duration || ""}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      />
                      <Select
                        value={formData.unit}
                        onValueChange={(v) => setFormData({ ...formData, unit: v as "hours" | "days" })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Horas</SelectItem>
                          <SelectItem value="days">Dias</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={formData.businessDaysOnly}
                          onCheckedChange={(v) => setFormData({ ...formData, businessDaysOnly: v })}
                        />
                        <Label className="text-sm">Somente dias úteis</Label>
                      </div>
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
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {formData.escalationRules?.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                        Nenhuma regra de escalação configurada
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.escalationRules?.map((esc, index) => (
                          <div key={esc.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                            <span className="text-sm">Após</span>
                            <Input
                              type="number"
                              min={1}
                              className="w-16 h-8"
                              value={esc.triggerAfter}
                              onChange={(e) => updateEscalationRule(esc.id, "triggerAfter", parseInt(e.target.value) || 0)}
                            />
                            <Select
                              value={esc.triggerUnit}
                              onValueChange={(v) => updateEscalationRule(esc.id, "triggerUnit", v)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percent">%</SelectItem>
                                <SelectItem value="hours">horas</SelectItem>
                                <SelectItem value="days">dias</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm">→</span>
                            <Select
                              value={esc.notifyRole}
                              onValueChange={(v) => updateEscalationRule(esc.id, "notifyRole", v)}
                            >
                              <SelectTrigger className="w-40 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 ml-auto"
                              onClick={() => removeEscalationRule(esc.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Alert Configuration */}
                  <div className="space-y-4">
                    <Label className="text-base">Configuração de Alertas</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">E-mail</span>
                        </div>
                        <Switch
                          checked={formData.alerts?.email}
                          onCheckedChange={(v) => setFormData({ ...formData, alerts: { ...formData.alerts!, email: v } })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">SMS</span>
                        </div>
                        <Switch
                          checked={formData.alerts?.sms}
                          onCheckedChange={(v) => setFormData({ ...formData, alerts: { ...formData.alerts!, sms: v } })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Sistema</span>
                        </div>
                        <Switch
                          checked={formData.alerts?.system}
                          onCheckedChange={(v) => setFormData({ ...formData, alerts: { ...formData.alerts!, system: v } })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Lembrete</span>
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={formData.alerts?.reminderBefore || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alerts: { ...formData.alerts!, reminderBefore: parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                      <Select
                        value={formData.alerts?.reminderUnit}
                        onValueChange={(v) =>
                          setFormData({ ...formData, alerts: { ...formData.alerts!, reminderUnit: v as "hours" | "days" } })
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">horas antes</SelectItem>
                          <SelectItem value="days">dias antes</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">do vencimento</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveRule}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* SLA Rules Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Processo</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Escalações</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaRules.map((rule) => {
                    const priority = priorityConfig[rule.priority];
                    const processTypeName = processTypes.find((pt) => pt.id === rule.processType)?.name;
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{processTypeName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                            {rule.duration} {rule.unit === "hours" ? "horas" : "dias"}
                            {rule.businessDaysOnly && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-[10px] ml-1">Úteis</Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>Somente dias úteis</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-white", priority.color)}>{priority.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{rule.escalationRules.length} regras</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {rule.alerts.email && <Mail className="h-4 w-4 text-blue-500" />}
                            {rule.alerts.sms && <MessageSquare className="h-4 w-4 text-green-500" />}
                            {rule.alerts.system && <Bell className="h-4 w-4 text-amber-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.isActive ? "success" : "secondary"}>
                            {rule.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEditRule(rule)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteRule(rule.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Priority Configuration */}
        <TabsContent value="priorities" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Codificação de Prioridades</h2>
            <p className="text-sm text-muted-foreground">Configure as cores e tempos de resposta por nível de prioridade</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(priorityConfig).map(([key, config]) => (
              <Card key={key} className="overflow-hidden">
                <div className={cn("h-2", config.color)} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={cn("h-4 w-4 rounded-full", config.color)} />
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Multiplicador de Tempo</Label>
                    <Select defaultValue={key === "low" ? "1.5" : key === "medium" ? "1" : key === "high" ? "0.75" : "0.5"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2x (Dobro)</SelectItem>
                        <SelectItem value="1.5">1.5x</SelectItem>
                        <SelectItem value="1">1x (Padrão)</SelectItem>
                        <SelectItem value="0.75">0.75x</SelectItem>
                        <SelectItem value="0.5">0.5x (Metade)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Nível de Escalação Inicial</Label>
                    <Select defaultValue={key === "critical" ? "gerente" : "supervisor"}>
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
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Auto-escalar</span>
                    <Switch defaultChecked={key === "high" || key === "critical"} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Priority Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legenda de Prioridades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-500/10">
                  <div className="h-10 w-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">Baixa</p>
                    <p className="text-xs text-muted-foreground">Processos rotineiros sem urgência</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-600 dark:text-blue-400">Média</p>
                    <p className="text-xs text-muted-foreground">Processos regulares com prazo padrão</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">Alta</p>
                    <p className="text-xs text-muted-foreground">Processos prioritários com prazo reduzido</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                  <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Crítica</p>
                    <p className="text-xs text-muted-foreground">Processos urgentes com resposta imediata</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Simulation */}
        <TabsContent value="simulation" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Área de Simulação</h2>
            <p className="text-sm text-muted-foreground">Teste o comportamento das regras de SLA e escalação</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation Controls */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Timer className="h-5 w-5 text-primary" />
                      Simulador de SLA
                    </CardTitle>
                    <CardDescription>Simule a contagem regressiva e escalações</CardDescription>
                  </div>
                  <Select value={selectedSimulationRule} onValueChange={setSelectedSimulationRule}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {slaRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>
                          {processTypes.find((pt) => pt.id === rule.processType)?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer Display */}
                <div className="text-center py-8 rounded-lg border bg-muted/30">
                  <div
                    className={cn(
                      "text-6xl font-mono font-bold transition-colors",
                      simulation.currentPhase === "normal" && "text-success",
                      simulation.currentPhase === "warning" && "text-amber-500",
                      simulation.currentPhase === "critical" && "text-orange-500",
                      simulation.currentPhase === "expired" && "text-destructive"
                    )}
                  >
                    {Math.floor((simulation.totalSeconds - simulation.elapsedSeconds) / 60)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {Math.floor((simulation.totalSeconds - simulation.elapsedSeconds) % 60)
                      .toString()
                      .padStart(2, "0")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {simulation.currentPhase === "expired"
                      ? "SLA Expirado"
                      : `Tempo restante (simulado)`}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso do SLA</span>
                    <span className="font-medium">{simulationProgress.toFixed(0)}%</span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={simulationProgress}
                      className={cn(
                        "h-3",
                        simulation.currentPhase === "warning" && "[&>div]:bg-amber-500",
                        simulation.currentPhase === "critical" && "[&>div]:bg-orange-500",
                        simulation.currentPhase === "expired" && "[&>div]:bg-destructive"
                      )}
                    />
                    {/* Escalation markers */}
                    {selectedRuleForSim?.escalationRules
                      .filter((e) => e.triggerUnit === "percent")
                      .map((esc) => (
                        <div
                          key={esc.id}
                          className="absolute top-0 bottom-0 w-0.5 bg-border"
                          style={{ left: `${esc.triggerAfter}%` }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute -top-1 -translate-x-1/2 h-2 w-2 rounded-full border-2 border-background",
                                    simulation.escalationsTriggered.includes(esc.id)
                                      ? "bg-amber-500"
                                      : "bg-muted-foreground"
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {esc.triggerAfter}% - {esc.action}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-3">
                  {!simulation.isRunning ? (
                    <Button onClick={startSimulation} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      {simulation.elapsedSeconds > 0 ? "Continuar" : "Iniciar Simulação"}
                    </Button>
                  ) : (
                    <Button onClick={pauseSimulation} variant="outline" size="lg" className="gap-2">
                      <Pause className="h-5 w-5" />
                      Pausar
                    </Button>
                  )}
                  <Button onClick={resetSimulation} variant="outline" size="lg" className="gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Resetar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Escalation Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                  Log de Escalações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {simulation.escalationsTriggered.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma escalação acionada ainda.
                    <br />
                    Inicie a simulação para ver as escalações.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {simulation.escalationsTriggered.map((escId) => {
                      const esc = selectedRuleForSim?.escalationRules.find((e) => e.id === escId);
                      if (!esc) return null;
                      const role = roles.find((r) => r.id === esc.notifyRole);
                      return (
                        <div key={escId} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{esc.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {esc.triggerAfter}{esc.triggerUnit === "percent" ? "%" : ` ${esc.triggerUnit}`} → {role?.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Simulation Status */}
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        simulation.currentPhase === "normal"
                          ? "success"
                          : simulation.currentPhase === "warning"
                          ? "warning"
                          : "error"
                      }
                    >
                      {simulation.currentPhase === "normal" && "Normal"}
                      {simulation.currentPhase === "warning" && "Atenção"}
                      {simulation.currentPhase === "critical" && "Crítico"}
                      {simulation.currentPhase === "expired" && "Expirado"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Escalações</span>
                    <span className="font-medium">
                      {simulation.escalationsTriggered.length}/{selectedRuleForSim?.escalationRules.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Rule Details */}
          {selectedRuleForSim && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes da Regra Selecionada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Tipo de Processo</p>
                    <p className="font-medium">{processTypes.find((pt) => pt.id === selectedRuleForSim.processType)?.name}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Prazo</p>
                    <p className="font-medium">
                      {selectedRuleForSim.duration} {selectedRuleForSim.unit === "hours" ? "horas" : "dias"}
                      {selectedRuleForSim.businessDaysOnly && " (úteis)"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Prioridade</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", priorityConfig[selectedRuleForSim.priority].color)} />
                      <span className="font-medium">{priorityConfig[selectedRuleForSim.priority].label}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedRuleForSim.alerts.email && <Mail className="h-4 w-4 text-blue-500" />}
                      {selectedRuleForSim.alerts.sms && <MessageSquare className="h-4 w-4 text-green-500" />}
                      {selectedRuleForSim.alerts.system && <Bell className="h-4 w-4 text-amber-500" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SLAConfiguration;
