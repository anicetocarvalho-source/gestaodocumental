import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Upload,
  FileText,
  Tag,
  FolderTree,
  UserPlus,
  Eye,
  RotateCcw,
  GitCompare,
  Clock,
  FileCheck,
  ScanText,
  History,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  version: string;
  uploader: {
    name: string;
    avatar?: string;
    initials: string;
  };
  date: string;
  time: string;
  changesSummary: string;
  fileSize: string;
  isCurrent?: boolean;
}

interface ActivityItem {
  id: string;
  type: "upload" | "ocr" | "tagged" | "classified" | "assigned" | "viewed" | "approved";
  description: string;
  user: string;
  date: string;
  time: string;
}

interface MetadataDiff {
  field: string;
  oldValue: string;
  newValue: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  compact?: boolean;
}

// Mock data
const mockVersions: Version[] = [
  {
    id: "v4",
    version: "v4",
    uploader: { name: "Carlos Santos", initials: "CS" },
    date: "03/12/2024",
    time: "14:32",
    changesSummary: "Atualização de assinaturas digitais",
    fileSize: "2.4 MB",
    isCurrent: true,
  },
  {
    id: "v3",
    version: "v3",
    uploader: { name: "Maria Silva", initials: "MS" },
    date: "28/11/2024",
    time: "09:15",
    changesSummary: "Correção de dados cadastrais",
    fileSize: "2.3 MB",
  },
  {
    id: "v2",
    version: "v2",
    uploader: { name: "João Oliveira", initials: "JO" },
    date: "15/11/2024",
    time: "16:45",
    changesSummary: "Adição de anexos complementares",
    fileSize: "2.1 MB",
  },
  {
    id: "v1",
    version: "v1",
    uploader: { name: "Ana Costa", initials: "AC" },
    date: "01/11/2024",
    time: "10:00",
    changesSummary: "Versão inicial do documento",
    fileSize: "1.8 MB",
  },
];

const mockActivities: ActivityItem[] = [
  { id: "a1", type: "upload", description: "Nova versão carregada (v4)", user: "Carlos Santos", date: "03/12/2024", time: "14:32" },
  { id: "a2", type: "approved", description: "Documento aprovado", user: "Diretor Geral", date: "02/12/2024", time: "11:20" },
  { id: "a3", type: "classified", description: "Classificado como 500.10.01", user: "Maria Silva", date: "30/11/2024", time: "15:45" },
  { id: "a4", type: "tagged", description: "Tags adicionadas: urgente, confidencial", user: "Maria Silva", date: "30/11/2024", time: "15:40" },
  { id: "a5", type: "ocr", description: "OCR processado com sucesso", user: "Sistema", date: "28/11/2024", time: "09:20" },
  { id: "a6", type: "upload", description: "Nova versão carregada (v3)", user: "Maria Silva", date: "28/11/2024", time: "09:15" },
  { id: "a7", type: "assigned", description: "Atribuído para Maria Silva", user: "João Oliveira", date: "20/11/2024", time: "14:00" },
  { id: "a8", type: "viewed", description: "Documento visualizado", user: "João Oliveira", date: "16/11/2024", time: "10:30" },
];

const mockMetadataDiffs: MetadataDiff[] = [
  { field: "Status", oldValue: "Em Revisão", newValue: "Aprovado" },
  { field: "Classificação", oldValue: "500.10", newValue: "500.10.01" },
  { field: "Responsável", oldValue: "João Oliveira", newValue: "Maria Silva" },
  { field: "Tags", oldValue: "rascunho", newValue: "urgente, confidencial" },
];

const activityIcons: Record<ActivityItem["type"], React.ReactNode> = {
  upload: <Upload className="h-3.5 w-3.5" />,
  ocr: <ScanText className="h-3.5 w-3.5" />,
  tagged: <Tag className="h-3.5 w-3.5" />,
  classified: <FolderTree className="h-3.5 w-3.5" />,
  assigned: <UserPlus className="h-3.5 w-3.5" />,
  viewed: <Eye className="h-3.5 w-3.5" />,
  approved: <FileCheck className="h-3.5 w-3.5" />,
};

const activityColors: Record<ActivityItem["type"], string> = {
  upload: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  ocr: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  tagged: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  classified: "bg-green-500/20 text-green-600 dark:text-green-400",
  assigned: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  viewed: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  approved: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
};

export function DocumentVersionHistory({ documentId, compact = false }: DocumentVersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const displayedActivities = showAllActivities ? mockActivities : mockActivities.slice(0, 5);

  const toggleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length < 2) {
        return [...prev, versionId];
      }
      return [prev[1], versionId];
    });
  };

  const handleRestore = (version: Version) => {
    console.log("Restoring version:", version.version);
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Version List */}
      <Card>
        <CardHeader className={cn("pb-3", compact && "p-4 pb-2")}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn("flex items-center gap-2", compact && "text-base")}>
              <History className="h-4 w-4 text-muted-foreground" />
              Histórico de Versões
            </CardTitle>
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedVersions.length !== 2}
                  className="gap-1.5"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  Comparar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Comparar Versões</DialogTitle>
                  <DialogDescription>
                    Diferenças entre {selectedVersions[0]} e {selectedVersions[1]}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <h4 className="text-sm font-medium">Alterações de Metadados</h4>
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-2 text-left font-medium">Campo</th>
                          <th className="px-4 py-2 text-left font-medium text-destructive/80">Anterior</th>
                          <th className="px-4 py-2 text-left font-medium text-green-600 dark:text-green-400">Atual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockMetadataDiffs.map((diff, index) => (
                          <tr key={diff.field} className={cn(index !== mockMetadataDiffs.length - 1 && "border-b")}>
                            <td className="px-4 py-2.5 font-medium">{diff.field}</td>
                            <td className="px-4 py-2.5 text-muted-foreground line-through">{diff.oldValue}</td>
                            <td className="px-4 py-2.5">{diff.newValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione 2 versões para comparar
          </p>
        </CardHeader>
        <CardContent className={cn("pt-0", compact && "p-4 pt-0")}>
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-0">
              {mockVersions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    "relative flex gap-3 py-3 group",
                    index !== mockVersions.length - 1 && "border-b border-border/50"
                  )}
                >
                  {/* Timeline dot */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleVersionSelect(version.id)}
                          className={cn(
                            "relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            version.isCurrent
                              ? "bg-primary border-primary text-primary-foreground"
                              : selectedVersions.includes(version.id)
                              ? "bg-secondary border-primary text-primary"
                              : "bg-background border-border hover:border-primary/50"
                          )}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Clique para selecionar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Version content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{version.version}</span>
                        {version.isCurrent && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Baixar versão</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!version.isCurrent && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleRestore(version)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restaurar versão</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {version.changesSummary}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={version.uploader.avatar} />
                          <AvatarFallback className="text-[8px]">
                            {version.uploader.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span>{version.uploader.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{version.date} às {version.time}</span>
                      </div>
                      <span>{version.fileSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className={cn("pb-3", compact && "p-4 pb-2")}>
          <CardTitle className={cn("flex items-center gap-2", compact && "text-base")}>
            <Clock className="h-4 w-4 text-muted-foreground" />
            Linha do Tempo de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("pt-0", compact && "p-4 pt-0")}>
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-3">
              {displayedActivities.map((activity) => (
                <div key={activity.id} className="relative flex gap-3">
                  {/* Activity icon */}
                  <div
                    className={cn(
                      "relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full",
                      activityColors[activity.type]
                    )}
                  >
                    {activityIcons[activity.type]}
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.date} às {activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mockActivities.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-muted-foreground"
                onClick={() => setShowAllActivities(!showAllActivities)}
              >
                {showAllActivities ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver mais {mockActivities.length - 5} atividades
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
