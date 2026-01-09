import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export type RetentionStatus = 'pending' | 'approved' | 'rejected' | 'destroyed';

interface RetentionStatusBadgeProps {
  status: RetentionStatus;
  scheduledDate?: string | Date;
  className?: string;
}

const statusConfig: Record<RetentionStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Clock;
  color: string;
}> = {
  pending: {
    label: "Aguarda Aprovação",
    variant: "outline",
    icon: Clock,
    color: "text-warning",
  },
  approved: {
    label: "Aprovado p/ Eliminação",
    variant: "destructive",
    icon: CheckCircle,
    color: "text-destructive",
  },
  rejected: {
    label: "Eliminação Rejeitada",
    variant: "secondary",
    icon: XCircle,
    color: "text-muted-foreground",
  },
  destroyed: {
    label: "Eliminado",
    variant: "outline",
    icon: Trash2,
    color: "text-muted-foreground",
  },
};

export function RetentionStatusBadge({ status, scheduledDate, className }: RetentionStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const formattedDate = scheduledDate 
    ? format(new Date(scheduledDate), "dd/MM/yyyy", { locale: pt })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={config.variant} 
          className={`gap-1 cursor-default ${className}`}
        >
          <Icon className={`h-3 w-3 ${config.color}`} />
          <span className="text-xs">{config.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-medium">{config.label}</p>
          {formattedDate && status !== 'destroyed' && (
            <p className="text-muted-foreground">
              Data prevista: {formattedDate}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
