import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Circle,
  Square,
  Diamond,
  CircleDot,
  ArrowRight,
  Save,
  CheckCircle,
  Trash2,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Grid3X3,
  Move,
  MousePointer,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
type NodeType = "start" | "task" | "gateway" | "end";

interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  name: string;
  description?: string;
  assignee?: string;
  sla?: string;
  condition?: string;
  taskType?: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

const nodeTypes: { type: NodeType; label: string; icon: typeof Circle; color: string }[] = [
  { type: "start", label: "Início", icon: Circle, color: "bg-success text-success-foreground" },
  { type: "task", label: "Tarefa", icon: Square, color: "bg-primary text-primary-foreground" },
  { type: "gateway", label: "Decisão", icon: Diamond, color: "bg-warning text-warning-foreground" },
  { type: "end", label: "Fim", icon: CircleDot, color: "bg-destructive text-destructive-foreground" },
];

const assignees = [
  "Maria Santos",
  "João Costa",
  "Ana Rodrigues",
  "Pedro Almeida",
  "Teresa Gomes",
  "Carlos Ferreira",
];

const taskTypes = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automático" },
  { value: "approval", label: "Aprovação" },
  { value: "notification", label: "Notificação" },
  { value: "script", label: "Script" },
];

const WorkflowBuilder = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedTool, setSelectedTool] = useState<"select" | "connect">("select");
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [workflowName, setWorkflowName] = useState("Novo Workflow");

  // Generate unique ID
  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle drag start from toolbox
  const handleToolDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("nodeType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData("nodeType") as NodeType;
    if (!nodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - 40;
    const y = (e.clientY - rect.top) / zoom - 40;

    const newNode: WorkflowNode = {
      id: generateId(),
      type: nodeType,
      x: Math.max(0, x),
      y: Math.max(0, y),
      name: nodeType === "start" ? "Início" : nodeType === "end" ? "Fim" : nodeType === "gateway" ? "Decisão" : "Nova Tarefa",
      taskType: nodeType === "task" ? "manual" : undefined,
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    toast.success(`${nodeTypes.find(n => n.type === nodeType)?.label} adicionado`);
  };

  // Handle drag over canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Handle node click
  const handleNodeClick = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    
    if (selectedTool === "connect") {
      if (connectingFrom === null) {
        setConnectingFrom(node.id);
        toast.info("Clique no nó de destino para conectar");
      } else if (connectingFrom !== node.id) {
        // Create connection
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: node.id,
        };
        setConnections([...connections, newConnection]);
        setConnectingFrom(null);
        toast.success("Conexão criada");
      } else {
        setConnectingFrom(null);
      }
    } else {
      setSelectedNode(node);
    }
  };

  // Handle node drag
  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    if (selectedTool !== "select") return;
    e.stopPropagation();
    setDraggingNode(node.id);
    setDragOffset({
      x: e.clientX - node.x * zoom,
      y: e.clientY - node.y * zoom,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x + rect.left) / zoom;
    const y = (e.clientY - rect.top - dragOffset.y + rect.top) / zoom;

    setNodes(nodes.map(n =>
      n.id === draggingNode ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n
    ));
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
  };

  // Handle canvas click
  const handleCanvasClick = () => {
    if (selectedTool === "connect") {
      setConnectingFrom(null);
    } else {
      setSelectedNode(null);
    }
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes(nodes.filter(n => n.id !== selectedNode.id));
    setConnections(connections.filter(c => c.from !== selectedNode.id && c.to !== selectedNode.id));
    setSelectedNode(null);
    toast.success("Nó eliminado");
  };

  // Duplicate selected node
  const duplicateSelectedNode = () => {
    if (!selectedNode) return;
    const newNode: WorkflowNode = {
      ...selectedNode,
      id: generateId(),
      x: selectedNode.x + 50,
      y: selectedNode.y + 50,
      name: `${selectedNode.name} (cópia)`,
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    toast.success("Nó duplicado");
  };

  // Update selected node
  const updateSelectedNode = (updates: Partial<WorkflowNode>) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode, ...updates };
    setNodes(nodes.map(n => n.id === selectedNode.id ? updatedNode : n));
    setSelectedNode(updatedNode);
  };

  // Save workflow
  const saveWorkflow = () => {
    console.log("Saving workflow:", { name: workflowName, nodes, connections });
    toast.success("Workflow guardado com sucesso!");
  };

  // Validate workflow
  const validateWorkflow = () => {
    const errors: string[] = [];
    
    const startNodes = nodes.filter(n => n.type === "start");
    const endNodes = nodes.filter(n => n.type === "end");
    
    if (startNodes.length === 0) errors.push("O workflow deve ter pelo menos um nó de início");
    if (startNodes.length > 1) errors.push("O workflow deve ter apenas um nó de início");
    if (endNodes.length === 0) errors.push("O workflow deve ter pelo menos um nó de fim");
    
    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    connections.forEach(c => {
      connectedNodeIds.add(c.from);
      connectedNodeIds.add(c.to);
    });
    
    const disconnectedNodes = nodes.filter(n => !connectedNodeIds.has(n.id) && nodes.length > 1);
    if (disconnectedNodes.length > 0) {
      errors.push(`${disconnectedNodes.length} nó(s) não conectado(s)`);
    }

    // Check for tasks without names
    const unnamedTasks = nodes.filter(n => n.type === "task" && (!n.name || n.name === "Nova Tarefa"));
    if (unnamedTasks.length > 0) {
      errors.push(`${unnamedTasks.length} tarefa(s) sem nome definido`);
    }

    if (errors.length === 0) {
      toast.success("Workflow válido!");
    } else {
      toast.error(
        <div className="space-y-1">
          <p className="font-medium">Erros de validação:</p>
          {errors.map((err, i) => (
            <p key={i} className="text-sm">• {err}</p>
          ))}
        </div>
      );
    }
  };

  // Render node
  const renderNode = (node: WorkflowNode) => {
    const nodeConfig = nodeTypes.find(n => n.type === node.type);
    if (!nodeConfig) return null;
    const Icon = nodeConfig.icon;

    const isSelected = selectedNode?.id === node.id;
    const isConnecting = connectingFrom === node.id;

    let nodeStyle = "";
    let size = "w-20 h-20";

    switch (node.type) {
      case "start":
        nodeStyle = "rounded-full bg-success/20 border-2 border-success";
        size = "w-16 h-16";
        break;
      case "end":
        nodeStyle = "rounded-full bg-destructive/20 border-2 border-destructive";
        size = "w-16 h-16";
        break;
      case "task":
        nodeStyle = "rounded-lg bg-primary/10 border-2 border-primary";
        size = "w-32 h-20";
        break;
      case "gateway":
        nodeStyle = "rotate-45 bg-warning/20 border-2 border-warning";
        size = "w-14 h-14";
        break;
    }

    return (
      <div
        key={node.id}
        className={cn(
          "absolute cursor-pointer transition-all flex items-center justify-center",
          nodeStyle,
          size,
          isSelected && "ring-2 ring-offset-2 ring-primary",
          isConnecting && "ring-2 ring-offset-2 ring-info animate-pulse"
        )}
        style={{
          left: node.x,
          top: node.y,
          transform: node.type === "gateway" ? "rotate(45deg)" : undefined,
        }}
        onClick={(e) => handleNodeClick(e, node)}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
      >
        <div className={cn(
          "flex flex-col items-center gap-1",
          node.type === "gateway" && "-rotate-45"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            node.type === "start" && "text-success",
            node.type === "end" && "text-destructive",
            node.type === "task" && "text-primary",
            node.type === "gateway" && "text-warning"
          )} />
          {(node.type === "task" || node.type === "gateway") && (
            <span className="text-[10px] font-medium text-foreground text-center px-1 truncate max-w-[120px]">
              {node.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render connection
  const renderConnection = (connection: Connection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    if (!fromNode || !toNode) return null;

    // Calculate center points
    const getNodeCenter = (node: WorkflowNode) => {
      let width = 80, height = 80;
      if (node.type === "start" || node.type === "end") { width = 64; height = 64; }
      if (node.type === "task") { width = 128; height = 80; }
      if (node.type === "gateway") { width = 56; height = 56; }
      return { x: node.x + width / 2, y: node.y + height / 2 };
    };

    const from = getNodeCenter(fromNode);
    const to = getNodeCenter(toNode);

    // Calculate arrow angle
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowLength = 10;

    // Shorten line to not overlap with nodes
    const shortenBy = 35;
    const length = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const ratio = shortenBy / length;
    
    const adjustedFrom = {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
    };
    const adjustedTo = {
      x: to.x - (to.x - from.x) * ratio,
      y: to.y - (to.y - from.y) * ratio,
    };

    return (
      <g key={connection.id}>
        <line
          x1={adjustedFrom.x}
          y1={adjustedFrom.y}
          x2={adjustedTo.x}
          y2={adjustedTo.y}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  };

  return (
    <DashboardLayout
      title="Construtor de Workflow"
      subtitle="Desenhe workflows BPMN com arrastar e soltar"
    >
      <PageBreadcrumb
        items={[
          { label: "Processos", href: "/processes" },
          { label: "Construtor de Workflow" }
        ]}
      />

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Left: Toolbox */}
        <Card className="col-span-2 overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm">Elementos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {nodeTypes.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(e) => handleToolDragStart(e, nodeType.type)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border cursor-grab",
                    "hover:border-primary hover:bg-primary/5 transition-all active:cursor-grabbing"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded flex items-center justify-center",
                    nodeType.type === "start" && "bg-success/20 text-success",
                    nodeType.type === "task" && "bg-primary/20 text-primary",
                    nodeType.type === "gateway" && "bg-warning/20 text-warning",
                    nodeType.type === "end" && "bg-destructive/20 text-destructive"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{nodeType.label}</span>
                </div>
              );
            })}

            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Ferramentas
              </p>
              <div className="space-y-2">
                <Button
                  variant={selectedTool === "select" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => { setSelectedTool("select"); setConnectingFrom(null); }}
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  Seleccionar
                </Button>
                <Button
                  variant={selectedTool === "connect" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedTool("connect")}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Vista
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant={showGrid ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {Math.round(zoom * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Center: Canvas */}
        <Card className="col-span-7 overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 border-b border-border flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-64 h-8 text-sm font-medium"
              />
              {connectingFrom && (
                <Badge variant="info" className="animate-pulse">
                  Modo de conexão activo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={validateWorkflow}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar
              </Button>
              <Button size="sm" onClick={saveWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div
              ref={canvasRef}
              className={cn(
                "relative w-full h-full overflow-auto",
                showGrid && "bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:20px_20px]"
              )}
              style={{
                minHeight: "100%",
                cursor: draggingNode ? "grabbing" : selectedTool === "connect" ? "crosshair" : "default",
              }}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  minWidth: "1500px",
                  minHeight: "1000px",
                  position: "relative",
                }}
              >
                {/* SVG for connections */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ minWidth: "1500px", minHeight: "1000px" }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="hsl(var(--muted-foreground))"
                      />
                    </marker>
                  </defs>
                  {connections.map(renderConnection)}
                </svg>

                {/* Nodes */}
                {nodes.map(renderNode)}

                {/* Empty state */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Move className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Arraste elementos da caixa de ferramentas
                      </p>
                      <p className="text-sm text-muted-foreground">
                        para começar a construir o seu workflow
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Properties Panel */}
        <Card className="col-span-3 overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Propriedades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-320px)]">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    selectedNode.type === "start" && "bg-success/20 text-success",
                    selectedNode.type === "task" && "bg-primary/20 text-primary",
                    selectedNode.type === "gateway" && "bg-warning/20 text-warning",
                    selectedNode.type === "end" && "bg-destructive/20 text-destructive"
                  )}>
                    {(() => {
                      const Icon = nodeTypes.find(n => n.type === selectedNode.type)?.icon || Circle;
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {nodeTypes.find(n => n.type === selectedNode.type)?.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedNode.id.slice(0, 15)}...
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nodeName">Nome</Label>
                  <Input
                    id="nodeName"
                    value={selectedNode.name}
                    onChange={(e) => updateSelectedNode({ name: e.target.value })}
                  />
                </div>

                {selectedNode.type === "task" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="taskType">Tipo de Tarefa</Label>
                      <Select
                        value={selectedNode.taskType || "manual"}
                        onValueChange={(v) => updateSelectedNode({ taskType: v })}
                      >
                        <SelectTrigger id="taskType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignee">Responsável</Label>
                      <Select
                        value={selectedNode.assignee || "none"}
                        onValueChange={(v) => updateSelectedNode({ assignee: v === "none" ? undefined : v })}
                      >
                        <SelectTrigger id="assignee">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não atribuído</SelectItem>
                          {assignees.map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sla">SLA (dias)</Label>
                      <Input
                        id="sla"
                        type="number"
                        min="1"
                        placeholder="Ex: 5"
                        value={selectedNode.sla || ""}
                        onChange={(e) => updateSelectedNode({ sla: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === "gateway" && (
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condição</Label>
                    <Textarea
                      id="condition"
                      placeholder="Ex: valor > 10000"
                      rows={3}
                      value={selectedNode.condition || ""}
                      onChange={(e) => updateSelectedNode({ condition: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Defina a condição para a decisão
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição opcional..."
                    rows={3}
                    value={selectedNode.description || ""}
                    onChange={(e) => updateSelectedNode({ description: e.target.value })}
                  />
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={duplicateSelectedNode}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={deleteSelectedNode}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MousePointer className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Seleccione um elemento para editar as suas propriedades
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Badge component for status (if not already available)
const Badge = ({ children, variant = "default", className }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground",
    info: "bg-info text-info-foreground",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
};

export default WorkflowBuilder;
