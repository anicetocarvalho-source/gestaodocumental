import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  RotateCcw,
  Clock,
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const stats = [
  { icon: Package, label: "Pending", value: 24, color: "text-warning" },
  { icon: Truck, label: "In Transit", value: 18, color: "text-info" },
  { icon: CheckCircle, label: "Delivered", value: 156, color: "text-success" },
  { icon: RotateCcw, label: "Returned", value: 8, color: "text-error" },
  { icon: Clock, label: "Overdue", value: 3, color: "text-error" },
];

const kanbanColumns = [
  {
    title: "Pending",
    count: 4,
    items: [
      { id: "D001", title: "Budget Documents", recipient: "Finance Dept, Building A", priority: "high", date: "Dec 5, 2024" },
      { id: "D002", title: "Contract Package", recipient: "Legal Office, Floor 3", priority: "medium", date: "Dec 6, 2024" },
      { id: "D003", title: "Policy Updates", recipient: "HR Department", priority: "low", date: "Dec 8, 2024" },
    ],
  },
  {
    title: "In Transit",
    count: 3,
    items: [
      { id: "D004", title: "Equipment Forms", recipient: "Operations Center", priority: "high", date: "Dec 3, 2024" },
      { id: "D005", title: "Audit Reports", recipient: "Compliance Office", priority: "medium", date: "Dec 4, 2024" },
    ],
  },
  {
    title: "Delivered",
    count: 5,
    items: [
      { id: "D006", title: "Meeting Minutes", recipient: "Executive Suite", priority: "low", date: "Dec 2, 2024" },
      { id: "D007", title: "Project Proposal", recipient: "Planning Dept", priority: "medium", date: "Dec 1, 2024" },
    ],
  },
  {
    title: "Returned",
    count: 2,
    items: [
      { id: "D008", title: "Incorrect Address", recipient: "Unknown Dept", priority: "high", date: "Nov 30, 2024" },
    ],
  },
];

const recentDispatches = [
  { id: "D001", title: "Budget Documents Package", recipient: "Finance Department", sender: "Sarah Johnson", status: "pending", date: "Dec 3, 2024" },
  { id: "D002", title: "Contract Renewal Forms", recipient: "Legal Office", sender: "Michael Chen", status: "in-transit", date: "Dec 2, 2024" },
  { id: "D003", title: "Policy Amendment Docs", recipient: "HR Department", sender: "Emma Wilson", status: "delivered", date: "Dec 1, 2024" },
  { id: "D004", title: "Equipment Transfer", recipient: "Operations", sender: "David Brown", status: "delivered", date: "Nov 30, 2024" },
  { id: "D005", title: "Audit Documentation", recipient: "Compliance", sender: "Lisa Anderson", status: "returned", date: "Nov 29, 2024" },
];

const DispatchManagement = () => {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout 
      title="Dispatch Management" 
      subtitle="Track and manage document dispatches"
    >
      <PageBreadcrumb items={[{ label: "Dispatch Management" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input 
                placeholder="Search dispatches..." 
                className="pl-10 w-64"
                aria-label="Search dispatches"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 h-9 px-3 border border-border rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">Dec 1 - Dec 7, 2024</span>
            </div>
            <select 
              className="h-9 px-3 border border-border rounded-md bg-background text-sm"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Returned</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              Export
            </Button>
            <Button onClick={() => navigate("/dispatches/new")}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Dispatch
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-t-lg border border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{column.title}</h3>
                  <Badge variant="secondary">{column.count}</Badge>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              
              {/* Cards */}
              <div className="space-y-3">
                {column.items.map((item) => (
                  <Card key={item.id} variant="interactive" className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                          <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                        </div>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Recipient */}
                      <div className="p-2 bg-muted rounded text-xs space-y-1">
                        <span className="text-muted-foreground">Recipient</span>
                        <div className="flex items-center gap-1 text-foreground">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {item.recipient}
                        </div>
                      </div>
                      
                      {/* Meta */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {item.date}
                        </div>
                        <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'info'}>
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Add Button */}
                <button 
                  className="w-full h-10 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:border-border-strong hover:text-foreground transition-colors"
                  aria-label={`Add to ${column.title}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Dispatches Table */}
        <Card className="lg:col-span-12 overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Dispatches</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Export</Button>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="grid">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left w-10">
                      <Checkbox aria-label="Select all" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recipient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sender</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDispatches.map((dispatch) => (
                    <tr key={dispatch.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox aria-label={`Select ${dispatch.id}`} />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{dispatch.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{dispatch.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{dispatch.recipient}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{dispatch.sender}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          dispatch.status === 'delivered' ? 'approved' :
                          dispatch.status === 'in-transit' ? 'in-progress' :
                          dispatch.status === 'pending' ? 'pending' : 'rejected'
                        }>
                          {dispatch.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{dispatch.date}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${dispatch.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Truck className="mr-2 h-4 w-4" /> Track
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-error focus:text-error">
                              <Trash2 className="mr-2 h-4 w-4" /> Cancel
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
            Showing 1-5 of 42 dispatches
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>

        {/* Audit Log Reference */}
        <div className="lg:col-span-12">
          <AuditLogReference context="View dispatch activity history" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DispatchManagement;
