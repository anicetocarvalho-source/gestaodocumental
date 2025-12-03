import { useState, useRef, useEffect } from "react";
import {
  Circle,
  Square,
  Diamond,
  CheckCircle2,
  Clock,
  Play,
  User,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NodeType = "start" | "task" | "gateway" | "end";
export type NodeStatus = "pending" | "in_progress" | "completed" | "rejected";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  assignee?: string;
  sla?: string;
  status: NodeStatus;
  metadata?: {
    createdAt?: string;
    startedAt?: string;
    completedAt?: string;
    lastAction?: string;
    actionBy?: string;
    notes?: string;
  };
  connections: string[];
  gatewayLabel?: string;
}

interface BPMNWorkflowViewerProps {
  nodes: WorkflowNode[];
  orientation?: "horizontal" | "vertical";
  onNodeClick?: (node: WorkflowNode) => void;
  className?: string;
}

const statusConfig: Record<
  NodeStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pendente",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: <Clock className="h-3 w-3" />,
  },
  in_progress: {
    label: "Em Andamento",
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: <Play className="h-3 w-3" />,
  },
  completed: {
    label: "Concluído",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejeitado",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const nodeTypeConfig: Record<
  NodeType,
  { icon: React.ReactNode; shape: string; size: string }
> = {
  start: {
    icon: <Circle className="h-4 w-4 fill-current" />,
    shape: "rounded-full",
    size: "w-12 h-12",
  },
  task: {
    icon: <Square className="h-4 w-4" />,
    shape: "rounded-lg",
    size: "w-44 min-h-24",
  },
  gateway: {
    icon: <Diamond className="h-4 w-4" />,
    shape: "rotate-45 rounded-md",
    size: "w-10 h-10",
  },
  end: {
    icon: <Circle className="h-4 w-4 fill-current" />,
    shape: "rounded-full ring-2 ring-current",
    size: "w-12 h-12",
  },
};

export function BPMNWorkflowViewer({
  nodes,
  orientation: initialOrientation = "horizontal",
  onNodeClick,
  className,
}: BPMNWorkflowViewerProps) {
  const [orientation, setOrientation] = useState(initialOrientation);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isHorizontal = orientation === "horizontal";

  // Calculate node positions
  const nodePositions = calculateNodePositions(nodes, isHorizontal);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === contentRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={isHorizontal ? "default" : "outline"}
              size="sm"
              onClick={() => setOrientation("horizontal")}
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Horizontal
            </Button>
            <Button
              variant={!isHorizontal ? "default" : "outline"}
              size="sm"
              onClick={() => setOrientation("vertical")}
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Vertical
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.requestFullscreen?.();
                }
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">Legenda:</span>
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("flex items-center gap-1", config.color)}>
                {config.icon}
              </span>
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative overflow-hidden border rounded-lg bg-muted/30 cursor-grab active:cursor-grabbing"
          style={{ height: isHorizontal ? "400px" : "600px" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={contentRef}
            className="absolute transition-transform duration-100"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {/* SVG Connectors */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: isHorizontal ? nodes.length * 200 + 200 : 600,
                height: isHorizontal ? 400 : nodes.length * 160 + 200,
              }}
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
                    className="fill-border"
                  />
                </marker>
              </defs>
              {renderConnections(nodes, nodePositions, isHorizontal)}
            </svg>

            {/* Nodes */}
            <div className="relative p-8">
              {nodes.map((node) => {
                const position = nodePositions.get(node.id);
                if (!position) return null;

                return (
                  <WorkflowNodeComponent
                    key={node.id}
                    node={node}
                    position={position}
                    onClick={() => onNodeClick?.(node)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{nodes.length}</strong> nós
          </span>
          <span>
            Concluídos:{" "}
            <strong className="text-green-600">
              {nodes.filter((n) => n.status === "completed").length}
            </strong>
          </span>
          <span>
            Em andamento:{" "}
            <strong className="text-primary">
              {nodes.filter((n) => n.status === "in_progress").length}
            </strong>
          </span>
          <span>
            Pendentes:{" "}
            <strong className="text-muted-foreground">
              {nodes.filter((n) => n.status === "pending").length}
            </strong>
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  position: { x: number; y: number };
  onClick?: () => void;
}

function WorkflowNodeComponent({
  node,
  position,
  onClick,
}: WorkflowNodeComponentProps) {
  const status = statusConfig[node.status];
  const typeConfig = nodeTypeConfig[node.type];

  if (node.type === "start" || node.type === "end") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "absolute flex items-center justify-center transition-all hover:scale-110",
              typeConfig.size,
              typeConfig.shape,
              node.type === "start"
                ? "bg-green-600 text-white"
                : "bg-destructive text-destructive-foreground",
              "shadow-md"
            )}
            style={{ left: position.x, top: position.y }}
            onClick={onClick}
          >
            {node.type === "start" ? (
              <Play className="h-5 w-5 fill-current" />
            ) : (
              <Circle className="h-5 w-5 fill-current" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{node.name}</p>
            {node.metadata?.createdAt && (
              <p className="text-xs text-muted-foreground">
                Criado: {node.metadata.createdAt}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (node.type === "gateway") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute"
            style={{ left: position.x, top: position.y }}
          >
            <button
              className={cn(
                "flex items-center justify-center transition-all hover:scale-110",
                typeConfig.size,
                typeConfig.shape,
                "bg-amber-500 text-white shadow-md"
              )}
              onClick={onClick}
            >
              <span className="-rotate-45">
                <Diamond className="h-4 w-4" />
              </span>
            </button>
            {node.gatewayLabel && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {node.gatewayLabel}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{node.name}</p>
            {node.gatewayLabel && (
              <p className="text-xs">Condição: {node.gatewayLabel}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Task node
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "absolute flex flex-col p-3 transition-all hover:shadow-lg hover:scale-[1.02]",
            typeConfig.size,
            typeConfig.shape,
            "bg-card border-2 shadow-sm text-left",
            node.status === "in_progress" && "border-primary",
            node.status === "completed" && "border-green-500",
            node.status === "rejected" && "border-destructive",
            node.status === "pending" && "border-border"
          )}
          style={{ left: position.x, top: position.y }}
          onClick={onClick}
        >
          <div className="flex items-start justify-between gap-2 w-full">
            <span className="text-xs font-medium line-clamp-2 flex-1">
              {node.name}
            </span>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", status.color, status.bgColor)}
            >
              {status.icon}
            </Badge>
          </div>
          {node.assignee && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{node.assignee}</span>
            </div>
          )}
          {node.sla && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{node.sla}</span>
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <div className="space-y-2">
          <div>
            <p className="font-semibold">{node.name}</p>
            <Badge variant="outline" className={cn("mt-1", status.color, status.bgColor)}>
              {status.label}
            </Badge>
          </div>
          {node.assignee && (
            <div className="flex items-center gap-2 text-xs">
              <User className="h-3 w-3" />
              <span>{node.assignee}</span>
            </div>
          )}
          {node.sla && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              <span>SLA: {node.sla}</span>
            </div>
          )}
          {node.metadata && (
            <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
              {node.metadata.createdAt && (
                <p>Criado: {node.metadata.createdAt}</p>
              )}
              {node.metadata.startedAt && (
                <p>Iniciado: {node.metadata.startedAt}</p>
              )}
              {node.metadata.completedAt && (
                <p>Concluído: {node.metadata.completedAt}</p>
              )}
              {node.metadata.lastAction && (
                <p>
                  Última ação: {node.metadata.lastAction}
                  {node.metadata.actionBy && ` por ${node.metadata.actionBy}`}
                </p>
              )}
              {node.metadata.notes && (
                <p className="italic">"{node.metadata.notes}"</p>
              )}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function calculateNodePositions(
  nodes: WorkflowNode[],
  isHorizontal: boolean
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeSpacing = isHorizontal ? 200 : 140;
  const startOffset = 40;

  // Group nodes by level for better layout
  const levels = new Map<number, WorkflowNode[]>();
  const nodeLevel = new Map<string, number>();
  
  // BFS to assign levels
  const visited = new Set<string>();
  const queue: { node: WorkflowNode; level: number }[] = [];
  
  const startNode = nodes.find((n) => n.type === "start");
  if (startNode) {
    queue.push({ node: startNode, level: 0 });
    visited.add(startNode.id);
  }

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;
    nodeLevel.set(node.id, level);

    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(node);

    for (const connId of node.connections) {
      if (!visited.has(connId)) {
        const connNode = nodes.find((n) => n.id === connId);
        if (connNode) {
          visited.add(connId);
          queue.push({ node: connNode, level: level + 1 });
        }
      }
    }
  }

  // Add any unvisited nodes
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const maxLevel = Math.max(...Array.from(levels.keys()), 0);
      nodeLevel.set(node.id, maxLevel + 1);
      if (!levels.has(maxLevel + 1)) {
        levels.set(maxLevel + 1, []);
      }
      levels.get(maxLevel + 1)!.push(node);
    }
  });

  // Calculate positions
  levels.forEach((levelNodes, level) => {
    const numNodes = levelNodes.length;
    levelNodes.forEach((node, index) => {
      const offset = (index - (numNodes - 1) / 2) * (isHorizontal ? 130 : 180);
      
      if (isHorizontal) {
        positions.set(node.id, {
          x: startOffset + level * nodeSpacing,
          y: 160 + offset,
        });
      } else {
        positions.set(node.id, {
          x: 250 + offset,
          y: startOffset + level * nodeSpacing,
        });
      }
    });
  });

  return positions;
}

function renderConnections(
  nodes: WorkflowNode[],
  positions: Map<string, { x: number; y: number }>,
  isHorizontal: boolean
): React.ReactNode[] {
  const connections: React.ReactNode[] = [];

  nodes.forEach((node) => {
    const startPos = positions.get(node.id);
    if (!startPos) return;

    const nodeConfig = nodeTypeConfig[node.type];
    const startSize =
      node.type === "task"
        ? { w: 176, h: 96 }
        : node.type === "gateway"
        ? { w: 40, h: 40 }
        : { w: 48, h: 48 };

    node.connections.forEach((connId) => {
      const endPos = positions.get(connId);
      if (!endPos) return;

      const targetNode = nodes.find((n) => n.id === connId);
      const endSize =
        targetNode?.type === "task"
          ? { w: 176, h: 96 }
          : targetNode?.type === "gateway"
          ? { w: 40, h: 40 }
          : { w: 48, h: 48 };

      let x1: number, y1: number, x2: number, y2: number;

      if (isHorizontal) {
        x1 = startPos.x + startSize.w;
        y1 = startPos.y + startSize.h / 2;
        x2 = endPos.x;
        y2 = endPos.y + endSize.h / 2;
      } else {
        x1 = startPos.x + startSize.w / 2;
        y1 = startPos.y + startSize.h;
        x2 = endPos.x + endSize.w / 2;
        y2 = endPos.y;
      }

      // Create curved path
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const path = isHorizontal
        ? `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      connections.push(
        <path
          key={`${node.id}-${connId}`}
          d={path}
          fill="none"
          className="stroke-border"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  });

  return connections;
}

// Demo data export
export const demoWorkflowNodes: WorkflowNode[] = [
  {
    id: "start",
    type: "start",
    name: "Início",
    status: "completed",
    connections: ["task1"],
    metadata: { createdAt: "2024-01-15 09:00" },
  },
  {
    id: "task1",
    type: "task",
    name: "Análise Documental",
    assignee: "Maria Silva",
    sla: "2 dias",
    status: "completed",
    connections: ["task2"],
    metadata: {
      createdAt: "2024-01-15 09:00",
      startedAt: "2024-01-15 09:30",
      completedAt: "2024-01-16 14:00",
      lastAction: "Aprovado",
      actionBy: "Maria Silva",
    },
  },
  {
    id: "task2",
    type: "task",
    name: "Parecer Jurídico",
    assignee: "João Santos",
    sla: "3 dias",
    status: "completed",
    connections: ["gateway1"],
    metadata: {
      startedAt: "2024-01-16 14:30",
      completedAt: "2024-01-18 10:00",
      lastAction: "Parecer favorável",
      actionBy: "João Santos",
    },
  },
  {
    id: "gateway1",
    type: "gateway",
    name: "Decisão",
    status: "completed",
    gatewayLabel: "Aprovado?",
    connections: ["task3", "task4"],
  },
  {
    id: "task3",
    type: "task",
    name: "Elaborar Despacho",
    assignee: "Ana Costa",
    sla: "1 dia",
    status: "in_progress",
    connections: ["task5"],
    metadata: {
      startedAt: "2024-01-18 11:00",
      lastAction: "Em elaboração",
      actionBy: "Ana Costa",
    },
  },
  {
    id: "task4",
    type: "task",
    name: "Solicitar Correções",
    assignee: "Pedro Oliveira",
    sla: "2 dias",
    status: "pending",
    connections: ["task1"],
  },
  {
    id: "task5",
    type: "task",
    name: "Assinatura do Diretor",
    assignee: "Carlos Diretor",
    sla: "1 dia",
    status: "pending",
    connections: ["gateway2"],
  },
  {
    id: "gateway2",
    type: "gateway",
    name: "Assinado?",
    status: "pending",
    gatewayLabel: "Assinado?",
    connections: ["task6", "task3"],
  },
  {
    id: "task6",
    type: "task",
    name: "Publicação no Diário",
    assignee: "Secretaria",
    sla: "1 dia",
    status: "pending",
    connections: ["end"],
  },
  {
    id: "end",
    type: "end",
    name: "Fim",
    status: "pending",
    connections: [],
  },
];
