import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  User,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from "lucide-react";

const stats = [
  { icon: Clock, label: "Pending", value: 12, color: "text-warning" },
  { icon: AlertTriangle, label: "Urgent", value: 5, color: "text-error" },
  { icon: CheckCircle, label: "Approved Today", value: 28, color: "text-success" },
  { icon: XCircle, label: "Rejected", value: 3, color: "text-muted-foreground" },
];

const approvalItems = [
  {
    id: 1,
    type: "document",
    title: "Annual Budget Report 2024",
    description: "Final budget allocation for fiscal year 2025 including departmental breakdowns",
    submitter: "Sarah Johnson",
    department: "Finance",
    submitted: "2 hours ago",
    priority: "high",
    urgent: true,
  },
  {
    id: 2,
    type: "process",
    title: "Contract Renewal - Vendor ABC",
    description: "Service agreement renewal for IT infrastructure maintenance",
    submitter: "Michael Chen",
    department: "Procurement",
    submitted: "4 hours ago",
    priority: "medium",
    urgent: true,
  },
  {
    id: 3,
    type: "document",
    title: "Environmental Impact Assessment",
    description: "Assessment report for new construction project in district 7",
    submitter: "Emma Wilson",
    department: "Environment",
    submitted: "1 day ago",
    priority: "medium",
    urgent: false,
  },
  {
    id: 4,
    type: "dispatch",
    title: "Equipment Dispatch Request",
    description: "Emergency equipment transfer to regional office",
    submitter: "David Brown",
    department: "Operations",
    submitted: "1 day ago",
    priority: "high",
    urgent: false,
  },
  {
    id: 5,
    type: "document",
    title: "Policy Amendment Proposal",
    description: "Updates to internal communication protocols",
    submitter: "Lisa Anderson",
    department: "HR",
    submitted: "2 days ago",
    priority: "low",
    urgent: false,
  },
  {
    id: 6,
    type: "process",
    title: "New Vendor Onboarding",
    description: "Approval for onboarding TechCorp as technology partner",
    submitter: "James Wilson",
    department: "Procurement",
    submitted: "2 days ago",
    priority: "medium",
    urgent: false,
  },
];

const selectedItem = approvalItems[0];

const approvalHistory = [
  { user: "John Doe", action: "Reviewed", date: "1 hour ago", status: "pending" },
  { user: "Finance Team", action: "Verified", date: "3 hours ago", status: "approved" },
  { user: "Sarah Johnson", action: "Submitted", date: "2 days ago", status: "submitted" },
];

const ApprovalQueue = () => {
  return (
    <DashboardLayout 
      title="Approval Queue" 
      subtitle="Review and approve pending items"
    >
      <PageBreadcrumb items={[{ label: "Approval Queue" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat" className="p-5">
              <div className="flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl bg-muted/80 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs & Filter */}
        <div className="lg:col-span-12">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="processes">Processes</TabsTrigger>
                <TabsTrigger value="dispatches">Dispatches</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 px-3 border border-border rounded-md bg-background text-sm"
                  aria-label="Sort by"
                >
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Priority</option>
                </select>
              </div>
            </div>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Queue List - 8 columns */}
                <div className="lg:col-span-8 space-y-3">
                  {approvalItems.map((item) => (
                    <Card 
                      key={item.id} 
                      variant="interactive"
                      className={`p-4 ${item.id === selectedItem.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex gap-4">
                        <Checkbox aria-label={`Select ${item.title}`} />
                        <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                                <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'info'}>
                                  {item.priority}
                                </Badge>
                                {item.urgent && (
                                  <Badge variant="error-solid" className="text-xs">Urgent</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{item.submitted}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" aria-hidden="true" />
                              <span>{item.submitter}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                              <span>{item.department}</span>
                            </div>
                            <Badge variant="outline" className="capitalize">{item.type}</Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button size="sm">
                              <ThumbsUp className="h-3 w-3 mr-1" aria-hidden="true" />
                              Approve
                            </Button>
                            <Button variant="outline" size="sm">
                              <ThumbsDown className="h-3 w-3 mr-1" aria-hidden="true" />
                              Reject
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-3 w-3 mr-1" aria-hidden="true" />
                              Request Info
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing 1-6 of 12 items
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </div>

                {/* Preview Panel - 4 columns */}
                <div className="lg:col-span-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Preview</CardTitle>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                          Full View
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Document Preview */}
                      <div className="h-48 bg-muted border border-border rounded-lg mb-4 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto" aria-hidden="true" />
                          <p className="text-xs text-muted-foreground">Document preview</p>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="space-y-3">
                        {[
                          { label: "Title", value: selectedItem.title },
                          { label: "Type", value: selectedItem.type },
                          { label: "Submitter", value: selectedItem.submitter },
                          { label: "Department", value: selectedItem.department },
                          { label: "Submitted", value: selectedItem.submitted },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-foreground capitalize truncate max-w-[150px]">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Approval History */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Approval History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {approvalHistory.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                            {item.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.user}</span>
                              <Badge variant={item.status === 'approved' ? 'approved' : item.status === 'pending' ? 'pending' : 'draft'} className="text-xs">
                                {item.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button className="w-full">
                      <ThumbsUp className="h-4 w-4 mr-2" aria-hidden="true" />
                      Approve Selected
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ThumbsDown className="h-4 w-4 mr-2" aria-hidden="true" />
                      Reject Selected
                    </Button>
                    <Button variant="ghost" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                      Bulk Comment
                    </Button>
                  </div>

                  {/* Audit Log Reference */}
                  <AuditLogReference context="View approval activity" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApprovalQueue;
