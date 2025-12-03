import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  History, 
  ChevronRight, 
  Search,
  Filter,
  Download,
  User,
  FileText,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";

const logs = [
  { 
    id: 1, 
    user: "Sarah Johnson", 
    action: "Modified permissions", 
    resource: "Editor Role",
    type: "permission",
    details: "Added 'Delete' permission for Documents",
    timestamp: "Dec 3, 2024 10:45 AM",
    ip: "192.168.1.45"
  },
  { 
    id: 2, 
    user: "Michael Chen", 
    action: "Created document", 
    resource: "Budget Report Q4.pdf",
    type: "document",
    details: "New document uploaded to Finance folder",
    timestamp: "Dec 3, 2024 09:30 AM",
    ip: "192.168.1.67"
  },
  { 
    id: 3, 
    user: "System", 
    action: "User login", 
    resource: "Emma Wilson",
    type: "auth",
    details: "Successful login from Chrome/Windows",
    timestamp: "Dec 3, 2024 09:15 AM",
    ip: "192.168.1.89"
  },
  { 
    id: 4, 
    user: "David Brown", 
    action: "Updated user", 
    resource: "Robert Taylor",
    type: "user",
    details: "Changed role from Viewer to Editor",
    timestamp: "Dec 2, 2024 04:20 PM",
    ip: "192.168.1.34"
  },
  { 
    id: 5, 
    user: "Lisa Anderson", 
    action: "Deleted document", 
    resource: "Draft_Policy_v1.docx",
    type: "document",
    details: "Document permanently removed",
    timestamp: "Dec 2, 2024 03:45 PM",
    ip: "192.168.1.56"
  },
  { 
    id: 6, 
    user: "James Wilson", 
    action: "Exported data", 
    resource: "User List",
    type: "export",
    details: "Exported 156 user records to CSV",
    timestamp: "Dec 2, 2024 02:10 PM",
    ip: "192.168.1.78"
  },
  { 
    id: 7, 
    user: "Maria Garcia", 
    action: "Modified settings", 
    resource: "System Configuration",
    type: "settings",
    details: "Updated session timeout to 30 minutes",
    timestamp: "Dec 2, 2024 11:30 AM",
    ip: "192.168.1.12"
  },
  { 
    id: 8, 
    user: "System", 
    action: "User logout", 
    resource: "Sarah Johnson",
    type: "auth",
    details: "Session expired after 30 minutes",
    timestamp: "Dec 2, 2024 10:00 AM",
    ip: "192.168.1.45"
  },
];

const getActionIcon = (type: string) => {
  switch (type) {
    case "document": return FileText;
    case "permission": return Shield;
    case "user": return User;
    case "auth": return LogIn;
    case "settings": return Settings;
    case "export": return Download;
    default: return History;
  }
};

const getActionBadge = (action: string) => {
  if (action.includes("Created") || action.includes("login")) return "success";
  if (action.includes("Modified") || action.includes("Updated")) return "warning";
  if (action.includes("Deleted") || action.includes("logout")) return "error";
  return "secondary";
};

const AuditLogs = () => {
  return (
    <DashboardLayout 
      title="Audit Logs" 
      subtitle="Track all system activities and changes"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link to="/users" className="hover:text-foreground transition-colors">User Management</Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link to="/permissions" className="hover:text-foreground transition-colors">Permissions</Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground font-medium" aria-current="page">Audit Logs</span>
      </nav>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="stat">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xl font-bold">1,284</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
              <Plus className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold">342</p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-warning-muted rounded-lg flex items-center justify-center">
              <Pencil className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold">567</p>
              <p className="text-xs text-muted-foreground">Modified</p>
            </div>
          </div>
        </Card>
        <Card variant="stat">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-error-muted rounded-lg flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-error" />
            </div>
            <div>
              <p className="text-xl font-bold">45</p>
              <p className="text-xs text-muted-foreground">Deleted</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              className="pl-10 w-64"
              aria-label="Search audit logs"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const IconComponent = getActionIcon(log.type);
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            {log.user === "System" ? "⚙️" : log.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium text-foreground">{log.user}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <Badge variant={getActionBadge(log.action) as any}>
                            {log.action}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        {log.resource}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground font-mono">
                        {log.ip}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing 1-8 of 1,284 events
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">...</Button>
          <Button variant="outline" size="sm">161</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
