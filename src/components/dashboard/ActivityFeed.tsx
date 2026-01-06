import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  Forward, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentActivities } from "@/hooks/useDashboardStats";

const iconMap = {
  dispatch: Send,
  forward: Forward,
  approve: CheckCircle,
  reject: XCircle,
  create: FileText,
  comment: Clock,
};

const iconStyles = {
  dispatch: "bg-info-muted text-info",
  forward: "bg-primary-muted text-primary",
  approve: "bg-success-muted text-success",
  reject: "bg-error-muted text-error",
  create: "bg-muted text-muted-foreground",
  comment: "bg-warning-muted text-warning",
};

export function ActivityFeed() {
  const { data: activities, isLoading } = useRecentActivities(6);

  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Actividade Recente</CardTitle>
        <Button variant="link" size="sm" className="text-sm" asChild>
          <Link to="/audit-logs">Ver Tudo</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !activities?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma actividade recente</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Linha do tempo */}
            <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
            
            {activities.map((activity) => {
              const Icon = iconMap[activity.type] || FileText;
              return (
                <Link 
                  key={activity.id} 
                  to={`/documents/${activity.document_id}`}
                  className="relative flex gap-4 pl-2 hover:opacity-80 transition-opacity"
                >
                  <div className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    iconStyles[activity.type]
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1 pt-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
