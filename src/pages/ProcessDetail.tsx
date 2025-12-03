import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronRight, 
  Clock, 
  Users, 
  Calendar,
  FileText,
  Download,
  Plus,
  CheckCircle,
  Circle,
  ArrowRight,
  MessageSquare,
  Paperclip
} from "lucide-react";

const processData = {
  name: "Budget Approval Workflow",
  description: "Annual budget review and approval process for fiscal year 2025",
  status: "active",
  priority: "high",
  progress: 60,
  deadline: "Dec 15, 2024",
  created: "Nov 1, 2024",
  department: "Finance",
};

const stages = [
  { name: "Initiation", status: "completed", date: "Nov 1, 2024" },
  { name: "Department Review", status: "completed", date: "Nov 15, 2024" },
  { name: "Finance Review", status: "current", date: "In Progress" },
  { name: "Executive Approval", status: "pending", date: "Pending" },
  { name: "Final Sign-off", status: "pending", date: "Pending" },
];

const tasks = [
  { id: 1, title: "Review budget allocations", description: "Verify all department budget requests", assignee: "Sarah Johnson", status: "completed" },
  { id: 2, title: "Validate expense projections", description: "Cross-reference with historical data", assignee: "Michael Chen", status: "completed" },
  { id: 3, title: "Compliance check", description: "Ensure regulatory compliance", assignee: "Emma Wilson", status: "in-progress" },
  { id: 4, title: "Risk assessment", description: "Identify potential budget risks", assignee: "David Brown", status: "pending" },
  { id: 5, title: "Final recommendations", description: "Prepare summary report", assignee: "Lisa Anderson", status: "pending" },
];

const documents = [
  { name: "Budget Request Form.pdf", size: "1.2 MB", type: "PDF" },
  { name: "Department Allocations.xlsx", size: "856 KB", type: "XLSX" },
  { name: "Historical Analysis.pdf", size: "2.4 MB", type: "PDF" },
  { name: "Compliance Report.docx", size: "445 KB", type: "DOCX" },
];

const activity = [
  { user: "Sarah Johnson", action: "completed task 'Review budget allocations'", time: "2 hours ago" },
  { user: "Michael Chen", action: "uploaded 'Department Allocations.xlsx'", time: "4 hours ago" },
  { user: "Emma Wilson", action: "started task 'Compliance check'", time: "1 day ago" },
  { user: "System", action: "moved to stage 'Finance Review'", time: "2 days ago" },
  { user: "David Brown", action: "added comment on budget projections", time: "3 days ago" },
];

const assignees = [
  { name: "Sarah Johnson", role: "Finance Director", avatar: "SJ" },
  { name: "Michael Chen", role: "Budget Analyst", avatar: "MC" },
  { name: "Emma Wilson", role: "Compliance Officer", avatar: "EW" },
  { name: "David Brown", role: "Risk Manager", avatar: "DB" },
];

const ProcessDetail = () => {
  const navigate = useNavigate();
  
  const handleAdvanceStage = () => {
    // Navigate to approvals for workflow action
    navigate("/approvals");
  };

  return (
    <DashboardLayout 
      title="Process Detail" 
      subtitle="Manage workflow stages and tasks"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link to="/processes" className="hover:text-foreground transition-colors">Processes</Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground font-medium" aria-current="page">{processData.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Process Header */}
        <Card className="lg:col-span-12">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-semibold text-foreground">{processData.name}</h1>
                  <Badge variant="error">{processData.priority}</Badge>
                  <div className="flex items-center gap-1 text-info">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl">{processData.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>Created: {processData.created}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <span>Due: {processData.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span>{processData.department}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                  Comment
                </Button>
                <Button onClick={handleAdvanceStage}>
                  <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
                  Advance Stage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Progress */}
        <Card className="lg:col-span-12">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Stage Stepper */}
            <div className="relative">
              <div className="flex items-center justify-between">
                {stages.map((stage, i) => (
                  <div key={i} className="flex flex-col items-center relative z-10">
                    <div 
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        stage.status === 'completed' 
                          ? 'bg-success border-success text-success-foreground' 
                          : stage.status === 'current'
                            ? 'bg-info border-info text-info-foreground'
                            : 'bg-muted border-border text-muted-foreground'
                      }`}
                      aria-label={`${stage.name}: ${stage.status}`}
                    >
                      {stage.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : stage.status === 'current' ? (
                        <Circle className="h-5 w-5 fill-current" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium text-center max-w-[80px] ${
                      stage.status === 'completed' || stage.status === 'current' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {stage.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">{stage.date}</span>
                  </div>
                ))}
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-0">
                <div 
                  className="h-full bg-success transition-all" 
                  style={{ width: `${(stages.filter(s => s.status === 'completed').length / (stages.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - 8 columns */}
        <div className="lg:col-span-8 space-y-4">
          {/* Current Stage Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Current Tasks</CardTitle>
                  <Badge variant="info">Finance Review</Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:border-border-strong transition-colors"
                >
                  <Checkbox 
                    checked={task.status === 'completed'} 
                    aria-label={`Mark "${task.title}" as complete`}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      {task.assignee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{task.assignee.split(' ')[0]}</span>
                  </div>
                  <Badge 
                    variant={task.status === 'completed' ? 'approved' : task.status === 'in-progress' ? 'in-progress' : 'draft'}
                    className="shrink-0"
                  >
                    {task.status.replace('-', ' ')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attached Documents */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Attached Documents</CardTitle>
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" aria-hidden="true" />
                  Attach File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-border-strong transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`Download ${doc.name}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border" aria-hidden="true" />
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-4 pl-2 relative">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 z-10">
                      {item.user === 'System' ? '⚙️' : item.user.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 space-y-0.5 pt-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">{item.user}</span>
                        {' '}
                        <span className="text-muted-foreground">{item.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 4 columns */}
        <div className="lg:col-span-4 space-y-4">
          {/* Process Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Process Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{processData.progress}%</span>
                </div>
                <Progress value={processData.progress} size="sm" />
              </div>
              {[
                { label: "Status", value: "In Progress" },
                { label: "Priority", value: processData.priority },
                { label: "Department", value: processData.department },
                { label: "Created", value: processData.created },
                { label: "Deadline", value: processData.deadline },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground capitalize">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assignees */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Assignees</CardTitle>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignees.map((person, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    {person.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{person.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dispatches">
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Generate Report
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleAdvanceStage}>
                <Users className="h-4 w-4 mr-2" aria-hidden="true" />
                Request Approval
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                Extend Deadline
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProcessDetail;
