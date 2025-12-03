import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { History, ChevronRight } from "lucide-react";

interface AuditLogReferenceProps {
  context?: string;
  className?: string;
}

export function AuditLogReference({ context = "Ver histórico de actividade", className = "" }: AuditLogReferenceProps) {
  return (
    <Card variant="interactive" className={className}>
      <Link to="/audit-logs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
              <History className="h-5 w-5 text-info" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-foreground">Registos de Auditoria</p>
              <p className="text-xs text-muted-foreground">{context}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Link>
    </Card>
  );
}
