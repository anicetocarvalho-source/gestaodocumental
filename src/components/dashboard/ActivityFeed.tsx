import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock, Upload, MessageSquare, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "approved",
    title: "Document Approved",
    description: "Annual Budget Report 2024 was approved by Finance Director",
    time: "2 hours ago",
    icon: CheckCircle,
  },
  {
    id: 2,
    type: "upload",
    title: "New Upload",
    description: "Infrastructure Development Plan uploaded by Michael Chen",
    time: "4 hours ago",
    icon: Upload,
  },
  {
    id: 3,
    type: "comment",
    title: "New Comment",
    description: "Sarah Johnson commented on Environmental Impact Assessment",
    time: "5 hours ago",
    icon: MessageSquare,
  },
  {
    id: 4,
    type: "rejected",
    title: "Document Rejected",
    description: "Transportation Policy Amendment requires revisions",
    time: "1 day ago",
    icon: XCircle,
  },
  {
    id: 5,
    type: "assigned",
    title: "Task Assigned",
    description: "You were assigned to review Public Health Initiative",
    time: "1 day ago",
    icon: UserCheck,
  },
  {
    id: 6,
    type: "pending",
    title: "Awaiting Review",
    description: "Contract Renewal Process pending your approval",
    time: "2 days ago",
    icon: Clock,
  },
];

const iconStyles = {
  approved: "bg-success-muted text-success",
  upload: "bg-info-muted text-info",
  comment: "bg-primary-muted text-primary",
  rejected: "bg-error-muted text-error",
  assigned: "bg-warning-muted text-warning",
  pending: "bg-muted text-muted-foreground",
};

export function ActivityFeed() {
  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="link" size="sm" className="text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
          
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex gap-4 pl-2">
              <div className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                iconStyles[activity.type as keyof typeof iconStyles]
              )}>
                <activity.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1 pt-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
