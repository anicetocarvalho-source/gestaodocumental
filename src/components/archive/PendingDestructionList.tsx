import { useState } from "react";
import { Link } from "react-router-dom";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RetentionStatusBadge } from "./RetentionStatusBadge";
import { DocumentRetention } from "@/hooks/useArchive";
import { cn } from "@/lib/utils";

interface PendingDestructionListProps {
  retentionRecords: DocumentRetention[];
  isLoading: boolean;
  onApprove: (retentionId: string) => Promise<void>;
  onReject: (retentionId: string, reason: string) => Promise<void>;
  onCancel: (retentionId: string) => Promise<void>;
  canApprove: boolean;
}

export function PendingDestructionList({
  retentionRecords,
  isLoading,
  onApprove,
  onReject,
  onCancel,
  canApprove,
}: PendingDestructionListProps) {
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | 'cancel';
    retention: DocumentRetention;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getUrgencyIndicator = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    const now = new Date();

    if (isPast(date)) {
      return { label: "Vencido", color: "text-destructive bg-destructive/10" };
    }

    if (isWithinInterval(date, { start: now, end: addDays(now, 30) })) {
      return { label: "Próximo", color: "text-warning bg-warning/10" };
    }

    return null;
  };

  const handleConfirmAction = async () => {
    if (!actionDialog) return;

    setIsProcessing(true);
    try {
      switch (actionDialog.type) {
        case 'approve':
          await onApprove(actionDialog.retention.id);
          break;
        case 'reject':
          await onReject(actionDialog.retention.id, "Eliminação rejeitada");
          break;
        case 'cancel':
          await onCancel(actionDialog.retention.id);
          break;
      }
    } finally {
      setIsProcessing(false);
      setActionDialog(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Pendentes de Eliminação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (retentionRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Pendentes de Eliminação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-10 w-10 text-success/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Não existem documentos pendentes de eliminação
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Pendentes de Eliminação
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {retentionRecords.length} documento{retentionRecords.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Razão</TableHead>
                <TableHead className="text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retentionRecords.map((retention) => {
                const urgency = getUrgencyIndicator(retention.scheduled_destruction_date);
                
                return (
                  <TableRow key={retention.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium truncate max-w-[180px] block cursor-default">
                                {retention.document?.title || "Documento"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{retention.document?.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-xs text-muted-foreground">
                            {retention.document?.entry_number}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RetentionStatusBadge 
                        status={retention.status as any}
                        scheduledDate={retention.scheduled_destruction_date}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(retention.scheduled_destruction_date), "dd/MM/yyyy", { locale: pt })}
                        </div>
                        {urgency && (
                          <Badge className={cn("text-xs h-5", urgency.color)}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {urgency.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px] block cursor-default">
                            {retention.destruction_reason || "—"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{retention.destruction_reason}</p>
                          {retention.legal_basis && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Base legal: {retention.legal_basis}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <Link to={`/documents/${retention.document_id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver documento</TooltipContent>
                        </Tooltip>

                        {retention.status === 'pending' && canApprove && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                                  onClick={() => setActionDialog({ type: 'approve', retention })}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Aprovar eliminação</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setActionDialog({ type: 'reject', retention })}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Rejeitar eliminação</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionDialog?.type === 'approve' && (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Aprovar Eliminação
                </>
              )}
              {actionDialog?.type === 'reject' && (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Rejeitar Eliminação
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === 'approve' && (
                <>
                  Tem a certeza que deseja aprovar a eliminação deste documento? 
                  Esta acção marcará o documento como aprovado para eliminação definitiva.
                </>
              )}
              {actionDialog?.type === 'reject' && (
                <>
                  Tem a certeza que deseja rejeitar a eliminação deste documento?
                  O documento permanecerá no arquivo.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionDialog && (
            <div className="p-3 bg-muted rounded-lg border">
              <p className="font-medium text-sm">{actionDialog.retention.document?.title}</p>
              <p className="text-xs text-muted-foreground">{actionDialog.retention.document?.entry_number}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={cn(
                actionDialog?.type === 'approve' && "bg-success hover:bg-success/90",
                actionDialog?.type === 'reject' && "bg-destructive hover:bg-destructive/90"
              )}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
