import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Building,
  Search,
  MoreVertical,
  Mail,
  Edit,
  Trash2,
  Download,
  ChevronRight,
  History
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const stats = [
  { icon: Users, label: "Total Users", value: 156 },
  { icon: UserPlus, label: "Active", value: 142 },
  { icon: Shield, label: "Admins", value: 8 },
  { icon: Building, label: "Departments", value: 12 },
];

const users = [
  { id: 1, name: "Sarah Johnson", email: "sarah.johnson@gov.org", role: "Administrator", department: "Finance", status: "active", lastActive: "2 hours ago" },
  { id: 2, name: "Michael Chen", email: "michael.chen@gov.org", role: "Editor", department: "Procurement", status: "active", lastActive: "4 hours ago" },
  { id: 3, name: "Emma Wilson", email: "emma.wilson@gov.org", role: "Editor", department: "Environment", status: "active", lastActive: "1 day ago" },
  { id: 4, name: "David Brown", email: "david.brown@gov.org", role: "Viewer", department: "Operations", status: "inactive", lastActive: "3 days ago" },
  { id: 5, name: "Lisa Anderson", email: "lisa.anderson@gov.org", role: "Editor", department: "HR", status: "active", lastActive: "5 hours ago" },
  { id: 6, name: "James Wilson", email: "james.wilson@gov.org", role: "Viewer", department: "Legal", status: "active", lastActive: "1 day ago" },
  { id: 7, name: "Maria Garcia", email: "maria.garcia@gov.org", role: "Administrator", department: "IT", status: "active", lastActive: "30 min ago" },
  { id: 8, name: "Robert Taylor", email: "robert.taylor@gov.org", role: "Editor", department: "Communications", status: "pending", lastActive: "Never" },
];

const roles = [
  { name: "Administrator", description: "Full system access and user management", count: 8 },
  { name: "Editor", description: "Create, edit, and submit documents", count: 45 },
  { name: "Reviewer", description: "Review and approve submissions", count: 32 },
  { name: "Viewer", description: "Read-only access to documents", count: 64 },
  { name: "Guest", description: "Limited temporary access", count: 7 },
];

const departments = [
  { name: "Finance", count: 24 },
  { name: "Human Resources", count: 18 },
  { name: "Legal", count: 12 },
  { name: "Operations", count: 35 },
  { name: "IT", count: 22 },
];

const UserManagement = () => {
  return (
    <DashboardLayout 
      title="User Management" 
      subtitle="Manage users, roles, and permissions"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary-muted flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input 
                placeholder="Search users..." 
                className="pl-10 w-64"
                aria-label="Search users"
              />
            </div>
            <select 
              className="h-10 px-3 border border-border rounded-md bg-background text-sm"
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              <option>Administrator</option>
              <option>Editor</option>
              <option>Reviewer</option>
              <option>Viewer</option>
            </select>
            <select 
              className="h-10 px-3 border border-border rounded-md bg-background text-sm"
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              <option>Finance</option>
              <option>HR</option>
              <option>Legal</option>
              <option>Operations</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add User
            </Button>
          </div>
        </div>

        {/* User Table */}
        <Card className="lg:col-span-12 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="grid">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left w-10">
                      <Checkbox aria-label="Select all users" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Active</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox aria-label={`Select ${user.name}`} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.department}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            user.status === 'active' ? 'bg-success' : 
                            user.status === 'pending' ? 'bg-warning' : 'bg-muted-foreground'
                          }`} aria-hidden="true" />
                          <span className="text-sm capitalize text-muted-foreground">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-error focus:text-error">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="lg:col-span-12 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1-8 of 156 users
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">...</Button>
            <Button variant="outline" size="sm">20</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>

        {/* Roles Section */}
        <Card className="lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Roles</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/permissions">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role, i) => (
              <Link key={i} to="/permissions">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary-muted rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{role.name}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{role.count} users</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Audit Logs Link */}
            <Link to="/audit-logs">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-info transition-colors cursor-pointer mt-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-info-muted rounded-lg flex items-center justify-center">
                    <History className="h-5 w-5 text-info" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Audit Logs</p>
                    <p className="text-xs text-muted-foreground">View activity history</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Departments Section */}
        <Card className="lg:col-span-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Departments</CardTitle>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments.map((dept, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-border-strong transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-info-muted rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-info" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{dept.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(Math.min(3, Math.ceil(dept.count / 10)))].map((_, j) => (
                      <div key={j} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] border-2 border-background">
                        {String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  <Badge variant="outline">{dept.count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
