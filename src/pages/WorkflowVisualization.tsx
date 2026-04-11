import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BPMNWorkflowViewer,
  WorkflowNode,
  demoWorkflowNodes,
} from "@/components/workflow/BPMNWorkflowViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Shuffle, FileJson, Edit, Loader2, Database, Layers } from "lucide-react";
import { toast } from "sonner";
import { useWorkflows } from "@/hooks/useWorkflows";

// Convert saved workflow nodes to BPMNViewer format
function convertToBPMNNodes(
  savedNodes: any[],
  savedConnections: any[]
): WorkflowNode[] {
  return savedNodes.map((node) => {
    const outConnections = savedConnections
      .filter((c: any) => c.from === node.id)
      .map((c: any) => c.to);

    return {
      id: node.id,
      type: node.type as WorkflowNode["type"],
      name: node.name,
      assignee: node.assignee,
      sla: node.sla,
      status: "pending" as const,
      connections: outConnections,
      gatewayLabel: node.type === "gateway" ? (node.condition || "Decisão") : undefined,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    };
  });
}

// Generate large workflow for demo
const generateLargeWorkflow = (nodeCount: number): WorkflowNode[] => {
  const nodes: WorkflowNode[] = [];
  nodes.push({
    id: "start", type: "start", name: "Início", status: "completed",
    connections: ["task1"], metadata: { createdAt: "2024-01-15 09:00" },
  });

  const assignees = ["Maria Silva", "João Santos", "Ana Costa", "Pedro Oliveira", "Carlos Diretor"];
  const taskNames = ["Análise Documental", "Parecer Jurídico", "Validação Técnica", "Revisão de Conformidade",
    "Aprovação Setorial", "Elaborar Despacho", "Assinatura", "Publicação", "Arquivamento", "Notificação"];
  const statuses: ("pending" | "in_progress" | "completed")[] = ["completed", "completed", "in_progress", "pending", "pending"];

  let taskIndex = 1;
  let previousLevelNodes: string[] = ["start"];
  let currentLevelNodes: string[] = [];
  let tasksInCurrentLevel = 0;

  while (taskIndex <= nodeCount - 2) {
    const isGateway = tasksInCurrentLevel > 0 && Math.random() > 0.7;
    const nodeId = isGateway ? `gateway${taskIndex}` : `task${taskIndex}`;
    const statusIndex = Math.min(Math.floor(taskIndex / (nodeCount / 4)), statuses.length - 1);

    nodes.push({
      id: nodeId,
      type: isGateway ? "gateway" : "task",
      name: isGateway ? "Decisão" : taskNames[(taskIndex - 1) % taskNames.length],
      assignee: isGateway ? undefined : assignees[(taskIndex - 1) % assignees.length],
      sla: isGateway ? undefined : `${Math.floor(Math.random() * 5) + 1} dias`,
      status: statuses[statusIndex],
      gatewayLabel: isGateway ? "Aprovado?" : undefined,
      connections: [],
      metadata: { createdAt: `2024-01-${15 + Math.floor(taskIndex / 3)}` },
    });

    currentLevelNodes.push(nodeId);
    tasksInCurrentLevel++;
    taskIndex++;

    if (currentLevelNodes.length === 1) {
      previousLevelNodes.forEach((prevId) => {
        const prevNode = nodes.find((n) => n.id === prevId);
        if (prevNode) prevNode.connections.push(nodeId);
      });
    }

    if (tasksInCurrentLevel >= 3 || taskIndex > nodeCount - 2) {
      previousLevelNodes = [...currentLevelNodes];
      currentLevelNodes = [];
      tasksInCurrentLevel = 0;
    }
  }

  const endNode: WorkflowNode = { id: "end", type: "end", name: "Fim", status: "pending", connections: [] };
  previousLevelNodes.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) node.connections.push("end");
  });
  nodes.push(endNode);
  return nodes;
};

export default function WorkflowVisualization() {
  const navigate = useNavigate();
  const { workflows, isLoading } = useWorkflows();
  const [selectedSource, setSelectedSource] = useState<string>("demo_simple");
  const [customNodeCount, setCustomNodeCount] = useState(10);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>(demoWorkflowNodes);

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);

    if (value === "demo_simple") {
      setWorkflowNodes(demoWorkflowNodes);
    } else if (value === "demo_medium") {
      setWorkflowNodes(generateLargeWorkflow(20));
    } else if (value === "demo_large") {
      setWorkflowNodes(generateLargeWorkflow(40));
    } else {
      // It's a saved workflow id
      const wf = workflows.find(w => w.id === value);
      if (wf) {
        const bpmnNodes = convertToBPMNNodes(wf.nodes, wf.connections);
        setWorkflowNodes(bpmnNodes);
      }
    }
  };

  const handleGenerateCustom = () => {
    const custom = generateLargeWorkflow(customNodeCount);
    setWorkflowNodes(custom);
    setSelectedSource("custom");
    toast.success(`Workflow gerado com ${customNodeCount} nós`);
  };

  const handleNodeClick = (node: WorkflowNode) => {
    toast.info(`Nó selecionado: ${node.name}`, {
      description: `Tipo: ${node.type} | Status: ${node.status}`,
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(workflowNodes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exportado como JSON");
  };

  const savedWorkflows = workflows.filter(w => w.nodes.length > 0);

  return (
    <DashboardLayout title="Visualização de Workflow" subtitle="Visualização BPMN de fluxos de trabalho">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <Label>Origem do Workflow</Label>
                <Select value={selectedSource} onValueChange={handleSourceChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo_simple">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3" /> Demo Simples (10 nós)
                      </div>
                    </SelectItem>
                    <SelectItem value="demo_medium">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3" /> Demo Médio (20 nós)
                      </div>
                    </SelectItem>
                    <SelectItem value="demo_large">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3" /> Demo Grande (40 nós)
                      </div>
                    </SelectItem>
                    {isLoading && (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> A carregar...
                        </div>
                      </SelectItem>
                    )}
                    {savedWorkflows.map(wf => (
                      <SelectItem key={wf.id} value={wf.id}>
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" /> {wf.name} ({wf.nodes.length} nós)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gerar Customizado ({customNodeCount} nós)</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[customNodeCount]} onValueChange={([v]) => setCustomNodeCount(v)} min={5} max={40} step={1} className="w-32" />
                  <Button size="sm" onClick={handleGenerateCustom}>
                    <Shuffle className="h-4 w-4 mr-1" /> Gerar
                  </Button>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleExportJson}>
                <FileJson className="h-4 w-4 mr-1" /> Exportar JSON
              </Button>

              {selectedSource && !selectedSource.startsWith("demo_") && selectedSource !== "custom" && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/workflow-builder?id=${selectedSource}`)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar no Builder
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Diagrama BPMN</CardTitle>
              <Badge variant="outline">{workflowNodes.length} nós</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <BPMNWorkflowViewer nodes={workflowNodes} orientation="horizontal" onNodeClick={handleNodeClick} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
