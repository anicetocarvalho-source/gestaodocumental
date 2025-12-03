import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Plus, Shuffle, FileJson } from "lucide-react";
import { toast } from "sonner";

// Extended demo for larger workflows
const generateLargeWorkflow = (nodeCount: number): WorkflowNode[] => {
  const nodes: WorkflowNode[] = [];
  
  // Start
  nodes.push({
    id: "start",
    type: "start",
    name: "Início",
    status: "completed",
    connections: ["task1"],
    metadata: { createdAt: "2024-01-15 09:00" },
  });

  const assignees = [
    "Maria Silva",
    "João Santos",
    "Ana Costa",
    "Pedro Oliveira",
    "Carlos Diretor",
    "Fernanda Lima",
    "Ricardo Souza",
    "Juliana Pereira",
  ];

  const taskNames = [
    "Análise Documental",
    "Parecer Jurídico",
    "Validação Técnica",
    "Revisão de Conformidade",
    "Aprovação Setorial",
    "Elaborar Despacho",
    "Assinatura",
    "Publicação",
    "Arquivamento",
    "Notificação",
    "Registro no Sistema",
    "Verificação de Requisitos",
    "Emissão de Certidão",
    "Conferência de Dados",
    "Distribuição",
  ];

  const statuses: ("pending" | "in_progress" | "completed")[] = [
    "completed",
    "completed",
    "in_progress",
    "pending",
    "pending",
  ];

  let taskIndex = 1;
  let currentLevel = 0;
  const maxTasksPerLevel = 3;
  let tasksInCurrentLevel = 0;
  let previousLevelNodes: string[] = ["start"];
  let currentLevelNodes: string[] = [];

  while (taskIndex <= nodeCount - 2) {
    // Reserve 2 for start and end
    const isGateway = tasksInCurrentLevel > 0 && Math.random() > 0.7;
    const nodeId = isGateway ? `gateway${taskIndex}` : `task${taskIndex}`;

    const statusIndex = Math.min(
      Math.floor(taskIndex / (nodeCount / 4)),
      statuses.length - 1
    );

    const node: WorkflowNode = {
      id: nodeId,
      type: isGateway ? "gateway" : "task",
      name: isGateway
        ? "Decisão"
        : taskNames[(taskIndex - 1) % taskNames.length],
      assignee: isGateway
        ? undefined
        : assignees[(taskIndex - 1) % assignees.length],
      sla: isGateway ? undefined : `${Math.floor(Math.random() * 5) + 1} dias`,
      status: statuses[statusIndex],
      gatewayLabel: isGateway ? "Aprovado?" : undefined,
      connections: [],
      metadata: {
        createdAt: `2024-01-${15 + Math.floor(taskIndex / 3)} ${9 + (taskIndex % 8)}:00`,
        startedAt:
          statusIndex > 0
            ? `2024-01-${15 + Math.floor(taskIndex / 3)} ${10 + (taskIndex % 8)}:00`
            : undefined,
        completedAt:
          statusIndex === 0
            ? `2024-01-${16 + Math.floor(taskIndex / 3)} ${14 + (taskIndex % 8)}:00`
            : undefined,
        lastAction:
          statusIndex === 0
            ? "Concluído"
            : statusIndex === 1
            ? "Em análise"
            : undefined,
        actionBy:
          statusIndex <= 1
            ? assignees[(taskIndex - 1) % assignees.length]
            : undefined,
      },
    };

    nodes.push(node);
    currentLevelNodes.push(nodeId);
    tasksInCurrentLevel++;
    taskIndex++;

    // Connect previous level to current
    if (currentLevelNodes.length === 1) {
      previousLevelNodes.forEach((prevId) => {
        const prevNode = nodes.find((n) => n.id === prevId);
        if (prevNode) {
          prevNode.connections.push(nodeId);
        }
      });
    }

    // Move to next level
    if (tasksInCurrentLevel >= maxTasksPerLevel || taskIndex > nodeCount - 2) {
      previousLevelNodes = [...currentLevelNodes];
      currentLevelNodes = [];
      tasksInCurrentLevel = 0;
      currentLevel++;
    }
  }

  // End
  const endNode: WorkflowNode = {
    id: "end",
    type: "end",
    name: "Fim",
    status: "pending",
    connections: [],
  };

  // Connect last level to end
  previousLevelNodes.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      node.connections.push("end");
    }
  });

  nodes.push(endNode);

  return nodes;
};

const predefinedWorkflows = {
  simple: demoWorkflowNodes,
  medium: generateLargeWorkflow(20),
  large: generateLargeWorkflow(40),
};

export default function WorkflowVisualization() {
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<keyof typeof predefinedWorkflows>("simple");
  const [customNodeCount, setCustomNodeCount] = useState(10);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>(
    predefinedWorkflows.simple
  );

  const handleWorkflowChange = (value: keyof typeof predefinedWorkflows) => {
    setSelectedWorkflow(value);
    setWorkflowNodes(predefinedWorkflows[value]);
  };

  const handleGenerateCustom = () => {
    const custom = generateLargeWorkflow(customNodeCount);
    setWorkflowNodes(custom);
    toast.success(`Workflow gerado com ${customNodeCount} nós`);
  };

  const handleNodeClick = (node: WorkflowNode) => {
    toast.info(`Nó selecionado: ${node.name}`, {
      description: `Tipo: ${node.type} | Status: ${node.status}`,
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(workflowNodes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exportado como JSON");
  };

  return (
    <DashboardLayout
      title="Visualização de Workflow"
      subtitle="Visualização BPMN de fluxos de trabalho"
    >
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <Label>Workflow Predefinido</Label>
                <Select
                  value={selectedWorkflow}
                  onValueChange={(v) =>
                    handleWorkflowChange(v as keyof typeof predefinedWorkflows)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples (10 nós)</SelectItem>
                    <SelectItem value="medium">Médio (20 nós)</SelectItem>
                    <SelectItem value="large">Grande (40 nós)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gerar Customizado ({customNodeCount} nós)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[customNodeCount]}
                    onValueChange={([v]) => setCustomNodeCount(v)}
                    min={5}
                    max={40}
                    step={1}
                    className="w-32"
                  />
                  <Button size="sm" onClick={handleGenerateCustom}>
                    <Shuffle className="h-4 w-4 mr-1" />
                    Gerar
                  </Button>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleExportJson}>
                <FileJson className="h-4 w-4 mr-1" />
                Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Viewer */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Diagrama BPMN</CardTitle>
              <Badge variant="outline">{workflowNodes.length} nós</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <BPMNWorkflowViewer
              nodes={workflowNodes}
              orientation="horizontal"
              onNodeClick={handleNodeClick}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
