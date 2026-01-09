import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Check,
  X,
  Clock,
  User,
  FileText,
  History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RevisionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string | null;
}

interface RevisionEntry {
  id: string;
  document_id: string;
  document_number: string;
  document_title: string | null;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_name: string | null;
  rejection_reason: string | null;
}

export const RevisionHistory = ({
  isOpen,
  onClose,
  batchId,
}: RevisionHistoryProps) => {
  const { data: revisions, isLoading } = useQuery({
    queryKey: ["revision-history", batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data: documents, error } = await supabase
        .from("scanned_documents")
        .select(`
          id,
          document_number,
          title,
          status,
          reviewed_at,
          reviewed_by,
          rejection_reason
        `)
        .eq("batch_id", batchId)
        .in("status", ["approved", "rejected"])
        .order("reviewed_at", { ascending: false });

      if (error) throw error;

      // Fetch reviewer names
      const reviewerIds = [...new Set(documents?.filter(d => d.reviewed_by).map(d => d.reviewed_by) || [])];
      
      let reviewerNames: Record<string, string> = {};
      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", reviewerIds);
        
        reviewerNames = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      return documents?.map(doc => ({
        id: doc.id,
        document_id: doc.id,
        document_number: doc.document_number,
        document_title: doc.title,
        status: doc.status,
        reviewed_at: doc.reviewed_at,
        reviewed_by: doc.reviewed_by,
        reviewer_name: doc.reviewed_by ? reviewerNames[doc.reviewed_by] || "Utilizador" : null,
        rejection_reason: doc.rejection_reason,
      })) as RevisionEntry[];
    },
    enabled: isOpen && !!batchId,
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = {
    approved: revisions?.filter(r => r.status === "approved").length || 0,
    rejected: revisions?.filter(r => r.status === "rejected").length || 0,
    total: revisions?.length || 0,
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Revisões
          </SheetTitle>
          <SheetDescription>
            Linha do tempo de todas as revisões realizadas neste lote
          </SheetDescription>
        </SheetHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 mb-4">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <div className="text-xs text-muted-foreground">Aprovados</div>
          </div>
          <div className="p-3 bg-destructive/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground">Rejeitados</div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Timeline */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : revisions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Nenhuma revisão realizada ainda</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {revisions?.map((revision, index) => (
                  <div key={revision.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        revision.status === "approved"
                          ? "bg-emerald-500/10 border-emerald-500"
                          : "bg-destructive/10 border-destructive"
                      }`}
                    >
                      {revision.status === "approved" ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {revision.document_title || revision.document_number}
                          </p>
                          <Badge
                            variant={revision.status === "approved" ? "default" : "destructive"}
                            className={`mt-1 text-xs ${
                              revision.status === "approved" ? "bg-emerald-500" : ""
                            }`}
                          >
                            {revision.status === "approved" ? "Aprovado" : "Rejeitado"}
                          </Badge>
                        </div>
                      </div>

                      {/* Reviewer info */}
                      {revision.reviewer_name && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(revision.reviewer_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{revision.reviewer_name}</span>
                        </div>
                      )}

                      {/* Timestamp */}
                      {revision.reviewed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(revision.reviewed_at), "d 'de' MMMM 'às' HH:mm", {
                            locale: pt,
                          })}
                        </p>
                      )}

                      {/* Rejection reason */}
                      {revision.status === "rejected" && revision.rejection_reason && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                          <strong>Motivo:</strong> {revision.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
