import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isValidUUID } from "@/lib/validation";
import { useDownloadFile } from "@/hooks/useFileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  GitCompare,
  Clock,
  FileCheck,
  ScanText,
  History,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  version: string;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  uploaderName: string;
  uploaderInitials: string;
  date: string;
  time: string;
  changesSummary: string;
  fileSize: string;
  isCurrent?: boolean;
}

type ActivityType =
  | "upload"
  | "ocr"
  | "tagged"
  | "classified"
  | "assigned"
  | "viewed"
  | "approved";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  user: string;
  date: string;
  time: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  compact?: boolean;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  upload: <Upload className="h-3.5 w-3.5" />,
  ocr: <ScanText className="h-3.5 w-3.5" />,
  tagged: <Tag className="h-3.5 w-3.5" />,
  classified: <FolderTree className="h-3.5 w-3.5" />,
  assigned: <UserPlus className="h-3.5 w-3.5" />,
  viewed: <Eye className="h-3.5 w-3.5" />,
  approved: <FileCheck className="h-3.5 w-3.5" />,
};

const activityColors: Record<ActivityType, string> = {
  upload: "bg-primary/15 text-primary",
  ocr: "bg-accent text-accent-foreground",
  tagged: "bg-warning/15 text-warning",
  classified: "bg-success/15 text-success",
  assigned: "bg-secondary text-secondary-foreground",
  viewed: "bg-muted text-muted-foreground",
  approved: "bg-success/15 text-success",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const splitDateTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-PT"),
    time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
  };
};

const mapActivityType = (action: string): ActivityType => {
  const a = (action || "").toLowerCase();
  if (a.includes("upload") || a.includes("file") || a.includes("ficheiro")) return "upload";
  if (a.includes("ocr") || a.includes("scan") || a.includes("digital")) return "ocr";
  if (a.includes("tag") || a.includes("etiqueta")) return "tagged";
  if (a.includes("classif")) return "classified";
  if (a.includes("assign") || a.includes("atribu") || a.includes("dispatch") || a.includes("movement"))
    return "assigned";
  if (a.includes("approve") || a.includes("aprov") || a.includes("sign") || a.includes("assinat"))
    return "approved";
  return "viewed";
};

const actionLabels: Record<string, string> = {
  created: "Documento criado",
  updated: "Metadados actualizados",
  deleted: "Documento eliminado",
  archived: "Documento arquivado",
  restored: "Documento restaurado",
  signed: "Documento assinado",
  approved: "Documento aprovado",
  rejected: "Documento rejeitado",
  returned: "Documento devolvido",
  submitted: "Submetido para aprovação",
  checked_out: "Documento bloqueado para edição",
  checked_in: "Documento devolvido à edição",
};

async function resolveNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id) => id && isValidUUID(id)))];
  if (unique.length === 0) return {};

  const map: Record<string, string> = {};

  const [byId, byUserId] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", unique),
    supabase.from("profiles").select("user_id, full_name").in("user_id", unique),
  ]);

  byId.data?.forEach((p) => {
    map[p.id] = p.full_name;
  });
  byUserId.data?.forEach((p) => {
    if (p.user_id) map[p.user_id] = p.full_name;
  });

  return map;
}

function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ["document-versions", documentId],
    enabled: !!documentId && isValidUUID(documentId),
    queryFn: async (): Promise<Version[]> => {
      const { data, error } = await supabase
        .from("document_files")
        .select("id, file_name, file_path, file_size, mime_type, version, is_main_file, uploaded_by, created_at")
        .eq("document_id", documentId)
        .order("version", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const names = await resolveNames((data ?? []).map((f) => f.uploaded_by as string));

      return (data ?? []).map((f, index) => {
        const { date, time } = splitDateTime(f.created_at);
        const uploaderName = names[f.uploaded_by as string] || "Desconhecido";
        return {
          id: f.id,
          version: `v${f.version ?? 1}`,
          filePath: f.file_path,
          fileName: f.file_name,
          mimeType: f.mime_type,
          uploaderName,
          uploaderInitials: getInitials(uploaderName),
          date,
          time,
          changesSummary: f.is_main_file ? "Ficheiro principal" : "Ficheiro anexo",
          fileSize: formatBytes(f.file_size),
          isCurrent: index === 0,
        };
      });
    },
  });
}

function useDocumentActivities(documentId: string) {
  return useQuery({
    queryKey: ["document-activities", documentId],
    enabled: !!documentId && isValidUUID(documentId),
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data, error } = await supabase
        .from("document_audit_log")
        .select("id, action, description, performed_by, created_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const names = await resolveNames((data ?? []).map((l) => l.performed_by as string));

      return (data ?? []).map((log) => {
        const { date, time } = splitDateTime(log.created_at);
        return {
          id: log.id,
          type: mapActivityType(log.action),
          description: log.description || actionLabels[log.action] || log.action,
          user: names[log.performed_by as string] || "Sistema",
          date,
          time,
        };
      });
    },
  });
}

export function DocumentVersionHistory({ documentId, compact = false }: DocumentVersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data: versions = [], isLoading: versionsLoading } = useDocumentVersions(documentId);
  const { data: activities = [], isLoading: activitiesLoading } = useDocumentActivities(documentId);
  const downloadFile = useDownloadFile();

  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5);

  const toggleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) return prev.filter((id) => id !== versionId);
      if (prev.length < 2) return [...prev, versionId];
      return [prev[1], versionId];
    });
  };

  const comparePair = selectedVersions
    .map((id) => versions.find((v) => v.id === id))
    .filter(Boolean) as Version[];

  const diffRows =
    comparePair.length === 2
      ? [
          { field: "Ficheiro", oldValue: comparePair[0].fileName, newValue: comparePair[1].fileName },
          { field: "Versão", oldValue: comparePair[0].version, newValue: comparePair[1].version },
          { field: "Tamanho", oldValue: comparePair[0].fileSize, newValue: comparePair[1].fileSize },
          { field: "Tipo", oldValue: comparePair[0].mimeType || "—", newValue: comparePair[1].mimeType || "—" },
          {
            field: "Carregado por",
            oldValue: `${comparePair[0].uploaderName} (${comparePair[0].date})`,
            newValue: `${comparePair[1].uploaderName} (${comparePair[1].date})`,
          },
        ]
      : [];

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
                    {comparePair.length === 2
                      ? `Diferenças entre ${comparePair[0].version} e ${comparePair[1].version}`
                      : "Seleccione duas versões"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <h4 className="text-sm font-medium">Propriedades do ficheiro</h4>
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-2 text-left font-medium">Campo</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            {comparePair[0]?.version ?? "A"}
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-success">
                            {comparePair[1]?.version ?? "B"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffRows.map((diff, index) => (
                          <tr key={diff.field} className={cn(index !== diffRows.length - 1 && "border-b")}>
                            <td className="px-4 py-2.5 font-medium">{diff.field}</td>
                            <td
                              className={cn(
                                "px-4 py-2.5 text-muted-foreground",
                                diff.oldValue !== diff.newValue && "line-through"
                              )}
                            >
                              {diff.oldValue}
                            </td>
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
          {versionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ainda não existem ficheiros carregados neste documento.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline connector */}
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-0">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={cn(
                      "relative flex gap-3 py-3 group",
                      index !== versions.length - 1 && "border-b border-border/50"
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
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-sm">{version.version}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {version.fileName}
                          </span>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={downloadFile.isPending}
                                  onClick={() =>
                                    downloadFile.mutate({
                                      filePath: version.filePath,
                                      fileName: version.fileName,
                                    })
                                  }
                                >
                                  {downloadFile.isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Baixar versão</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {version.changesSummary}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {version.uploaderInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span>{version.uploaderName}</span>
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
          )}
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
          {activitiesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sem actividade registada para este documento.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline connector */}
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-3">
                {displayedActivities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3">
                    <div
                      className={cn(
                        "relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full",
                        activityColors[activity.type]
                      )}
                    >
                      {activityIcons[activity.type]}
                    </div>

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

              {activities.length > 5 && (
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
                      Ver mais {activities.length - 5} atividades
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
