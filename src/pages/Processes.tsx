import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  ClipboardPlus, 
  Clock, 
  Users, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Pause,
  Search,
  Filter
} from "lucide-react";

const processes = [
  {
    id: 1,
    name: "Budget Approval Workflow",
    description: "Annual budget review and approval process",
    stage: "Finance Review",
    stages: ["Initiation", "Department Review", "Finance Review", "Final Approval"],
    currentStageIndex: 2,
    progress: 75,
    deadline: "Dec 15, 2024",
    assignees: ["JD", "SC", "MW"],
    priority: "high",
    status: "active",
  },
  {
    id: 2,
    name: "Contract Renewal Process",
    description: "Vendor contract renewal and negotiation",
    stage: "Legal Review",
    stages: ["Request", "Vendor Negotiation", "Legal Review", "Signature"],
    currentStageIndex: 2,
    progress: 45,
    deadline: "Dec 20, 2024",
    assignees: ["MC", "LW"],
    priority: "medium",
    status: "active",
  },
  {
    id: 3,
    name: "Policy Update Procedure",
    description: "Public policy amendment and review",
    stage: "Public Comment",
    stages: ["Draft", "Internal Review", "Public Comment", "Finalization"],
    currentStageIndex: 2,
    progress: 90,
    deadline: "Dec 8, 2024",
    assignees: ["EW", "DB", "LA", "JW", "MG"],
    priority: "low",
    status: "active",
  },
  {
    id: 4,
    name: "Vendor Evaluation Review",
    description: "New vendor assessment and scoring",
    stage: "Initial Screening",
    stages: ["Initial Screening", "Technical Evaluation", "Financial Review", "Selection"],
    currentStageIndex: 0,
    progress: 20,
    deadline: "Dec 30, 2024",
    assignees: ["RT", "SJ", "MC", "EW"],
    priority: "medium",
    status: "active",
  },
  {
    id: 5,
    name: "Compliance Audit",
    description: "Quarterly compliance review and reporting",
    stage: "Completed",
    stages: ["Planning", "Fieldwork", "Review", "Report"],
    currentStageIndex: 4,
    progress: 100,
    deadline: "Nov 30, 2024",
    assignees: ["LA", "JW"],
    priority: "high",
    status: "completed",
  },
  {
    id: 6,
    name: "IT Infrastructure Upgrade",
    description: "System modernization initiative",
    stage: "On Hold",
    stages: ["Assessment", "Planning", "Implementation", "Testing"],
    currentStageIndex: 1,
    progress: 35,
    deadline: "Jan 15, 2025",
    assignees: ["DB", "RT"],
    priority: "medium",
    status: "paused",
  },
];

const priorityVariants = {
  high: "error",
  medium: "warning",
  low: "info",
} as const;

const statusIcons = {
  active: <Clock className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  paused: <Pause className="h-4 w-4" />,
};

const statusColors = {
  active: "text-info",
  completed: "text-success",
  paused: "text-warning",
};

const Processes = () => {
  return (
    <DashboardLayout 
      title="Processes" 
      subtitle="Track and manage all active workflows"
    >
      <PageBreadcrumb items={[{ label: "Processes" }]} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info-muted">
              <Clock className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-muted">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-muted">
              <Pause className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">On Hold</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-error-muted">
              <AlertCircle className="h-6 w-6 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input 
              placeholder="Search processes..." 
              className="pl-10 w-64"
              aria-label="Search processes"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <select 
            className="h-10 px-3 border border-border rounded-md bg-background text-sm"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Paused</option>
          </select>
        </div>
        <Button>
          <ClipboardPlus className="mr-2 h-4 w-4" />
          New Process
        </Button>
      </div>

      {/* Process List */}
      <h2 className="text-lg font-semibold mt-6">All Processes</h2>

      <div className="mt-4 grid gap-4">
        {processes.map((process) => (
          <Link key={process.id} to={`/processes/${process.id}`}>
            <Card variant="interactive" className="p-6 hover:border-primary transition-colors">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{process.name}</h3>
                        <Badge variant={priorityVariants[process.priority]} className="capitalize">
                          {process.priority}
                        </Badge>
                        <span className={`flex items-center gap-1 text-sm ${statusColors[process.status]}`}>
                          {statusIcons[process.status]}
                          <span className="capitalize">{process.status}</span>
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{process.description}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                {/* Stage Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Stage: <span className="text-foreground font-medium">{process.stage}</span>
                    </span>
                    <span className="font-medium">{process.progress}%</span>
                  </div>
                  <Progress value={process.progress} size="sm" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {process.stages.map((stage, index) => (
                      <span 
                        key={stage}
                        className={index <= process.currentStageIndex ? "text-primary font-medium" : ""}
                      >
                        {stage}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{process.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <div className="flex -space-x-2">
                      {process.assignees.slice(0, 3).map((initials, idx) => (
                        <div 
                          key={idx}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground"
                        >
                          {initials}
                        </div>
                      ))}
                      {process.assignees.length > 3 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                          +{process.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-6 of 24 processes
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">4</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>

      {/* Audit Log Reference */}
      <div className="mt-6">
        <AuditLogReference context="View process activity history" />
      </div>
    </DashboardLayout>
  );
};

export default Processes;
