import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { flows, FlowData, FlowStep } from "@/lib/flowData";
import { AppRole, roleLabels } from "@/hooks/useUserRole";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  AlertTriangle,
  Database,
  Monitor,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleTabs: { value: AppRole | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "admin", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "tecnico", label: "Técnico" },
  { value: "consulta", label: "Consulta" },
];

const roleBadgeColors: Record<AppRole, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  gestor: "bg-primary/15 text-primary border-primary/30",
  tecnico: "bg-accent/50 text-accent-foreground border-accent",
  consulta: "bg-muted text-muted-foreground border-border",
};

function FlowDiagram({ steps, onNavigate }: { steps: FlowStep[]; onNavigate: (route: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center gap-2">
          <button
            onClick={() => !step.route.includes(":") && onNavigate(step.route)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm transition-colors min-w-[100px]",
              !step.route.includes(":") && "hover:border-primary hover:bg-primary/5 cursor-pointer",
              step.route.includes(":") && "cursor-default"
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {step.number}
            </span>
            <span className="text-center font-medium text-foreground leading-tight max-w-[120px]">
              {step.action}
            </span>
            <span className="text-muted-foreground text-[10px]">{step.screen}</span>
          </button>
          {i < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

function FlowCard({ flow, onNavigate }: { flow: FlowData; onNavigate: (route: string) => void }) {
  return (
    <AccordionItem value={flow.id} className="border rounded-lg mb-3 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
        <div className="flex flex-1 items-center gap-3 text-left">
          <span className="font-semibold text-foreground">{flow.name}</span>
          <div className="flex gap-1">
            {flow.roles.map((r) => (
              <Badge key={r} variant="outline" className={cn("text-[10px] px-1.5 py-0", roleBadgeColors[r])}>
                {roleLabels[r]}
              </Badge>
            ))}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 space-y-4">
        <p className="text-sm text-muted-foreground">{flow.description}</p>

        {/* Diagrama visual */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Fluxo Visual</h4>
          <ScrollArea className="w-full">
            <FlowDiagram steps={flow.steps} onNavigate={onNavigate} />
          </ScrollArea>
        </div>

        {/* Tabela de passos */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Monitor className="h-3 w-3" /> Passos Detalhados
          </h4>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Acção</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ecrã</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rota</th>
                </tr>
              </thead>
              <tbody>
                {flow.steps.map((step) => (
                  <tr key={step.number} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{step.number}</td>
                    <td className="px-3 py-2 text-foreground">{step.action}</td>
                    <td className="px-3 py-2 text-muted-foreground">{step.screen}</td>
                    <td className="px-3 py-2">
                      {!step.route.includes(":") ? (
                        <button
                          onClick={() => onNavigate(step.route)}
                          className="text-primary hover:underline font-mono text-xs flex items-center gap-1"
                        >
                          {step.route} <ChevronRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">{step.route}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dados necessários */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                <Database className="h-3 w-3" /> Dados Necessários
              </h4>
              <ul className="space-y-1">
                {flow.requiredData.map((d) => (
                  <li key={d} className="text-sm text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Condições de erro */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" /> Condições de Erro
              </h4>
              <ul className="space-y-2">
                {flow.errors.map((e, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-foreground">{e.condition}</span>
                    <span className="text-muted-foreground"> → {e.consequence}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function FlowDocumentation() {
  usePageTitle("Documentação de Fluxos");
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<AppRole | "all">("all");

  const filtered = activeRole === "all"
    ? flows
    : flows.filter((f) => f.roles.includes(activeRole));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentação de Fluxos</h1>
          <p className="text-muted-foreground mt-1">
            Todos os fluxos da plataforma com diagramas interactivos e navegação por perfil
          </p>
        </div>

        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as AppRole | "all")}>
          <TabsList>
            {roleTabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {t.value === "all"
                    ? flows.length
                    : flows.filter((f) => f.roles.includes(t.value as AppRole)).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Single content area — filtering handled by state */}
          <div className="mt-4">
            <Accordion type="multiple" className="space-y-0">
              {filtered.map((flow) => (
                <FlowCard key={flow.id} flow={flow} onNavigate={(r) => navigate(r)} />
              ))}
            </Accordion>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Nenhum fluxo disponível para este perfil.
              </p>
            )}
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
