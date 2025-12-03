import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  Shield, 
  ChevronRight, 
  FileText, 
  Users, 
  Settings, 
  Eye, 
  Pencil, 
  Trash2,
  Plus,
  History
} from "lucide-react";

const roles = [
  { 
    id: 1, 
    name: "Administrator", 
    description: "Full system access", 
    users: 8,
    permissions: { documents: ["view", "create", "edit", "delete"], processes: ["view", "create", "edit", "delete"], users: ["view", "create", "edit", "delete"] }
  },
  { 
    id: 2, 
    name: "Editor", 
    description: "Create and edit content", 
    users: 45,
    permissions: { documents: ["view", "create", "edit"], processes: ["view", "create"], users: ["view"] }
  },
  { 
    id: 3, 
    name: "Reviewer", 
    description: "Review and approve", 
    users: 32,
    permissions: { documents: ["view", "edit"], processes: ["view", "edit"], users: ["view"] }
  },
  { 
    id: 4, 
    name: "Viewer", 
    description: "Read-only access", 
    users: 64,
    permissions: { documents: ["view"], processes: ["view"], users: [] }
  },
];

const permissionMatrix = [
  { resource: "Documents", icon: FileText, permissions: ["View", "Create", "Edit", "Delete"] },
  { resource: "Processes", icon: Shield, permissions: ["View", "Create", "Edit", "Delete"] },
  { resource: "Users", icon: Users, permissions: ["View", "Create", "Edit", "Delete"] },
  { resource: "Settings", icon: Settings, permissions: ["View", "Edit"] },
];

const Permissions = () => {
  return (
    <DashboardLayout 
      title="Permissions" 
      subtitle="Configure roles and access control"
    >
      <PageBreadcrumb 
        items={[
          { label: "User Management", href: "/users" },
          { label: "Permissions" }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Roles</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </div>
          
          <div className="space-y-3">
            {roles.map((role) => (
              <Card 
                key={role.id} 
                variant="interactive" 
                className="cursor-pointer hover:border-primary transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-muted rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{role.name}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{role.users}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Audit Logs Link */}
          <Card variant="interactive" className="mt-6">
            <Link to="/audit-logs">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
                    <History className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Audit Logs</p>
                    <p className="text-xs text-muted-foreground">View permission changes</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Permission Matrix */}
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Permission Matrix - Administrator</CardTitle>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3" /> View
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Plus className="h-3 w-3" /> Create
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Pencil className="h-3 w-3" /> Edit
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Trash2 className="h-3 w-3" /> Delete
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {permissionMatrix.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{item.resource}</span>
                        </div>
                      </td>
                      {item.permissions.map((perm, j) => (
                        <td key={j} className="px-4 py-4 text-center">
                          <Checkbox 
                            defaultChecked 
                            aria-label={`${perm} ${item.resource}`}
                          />
                        </td>
                      ))}
                      {item.permissions.length < 4 && (
                        <td colSpan={4 - item.permissions.length} className="px-4 py-4 text-center text-muted-foreground">
                          —
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Permissions;
