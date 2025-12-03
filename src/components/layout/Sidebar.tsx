import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  ClipboardList,
  Archive,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  Users,
  Package,
  CheckSquare,
  ScanLine,
  GitBranch,
  Layers,
  FileCheck,
  BarChart3,
  FileSearch,
  Tags,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Processes", href: "/processes", icon: ClipboardList },
  { name: "Dispatches", href: "/dispatches", icon: Package },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Digitization", href: "/digitization", icon: ScanLine },
  { name: "OCR Processing", href: "/ocr-processing", icon: FileSearch },
  { name: "Classification", href: "/classification", icon: Tags },
  { name: "Quality Review", href: "/quality-review", icon: FileCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Folders", href: "/folders", icon: FolderOpen },
  { name: "Archive", href: "/archive", icon: Archive },
];

const management = [
  { name: "Users", href: "/users", icon: Users },
  { name: "Permissions", href: "/permissions", icon: Shield },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Workflow Builder", href: "/workflow-builder", icon: GitBranch },
  { name: "Templates", href: "/process-templates", icon: Layers },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));
    
    return (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Shield className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">GovDocs</span>
          </div>
        )}
        <Button
          variant="sidebar"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <NavLink 
            to="/search"
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent/40 transition-colors"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search...</span>
            <kbd className="ml-auto rounded bg-sidebar-accent/50 px-1.5 py-0.5 text-[10px] text-sidebar-muted/80">⌘K</kbd>
          </NavLink>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Primary navigation">
        <div className="space-y-0.5">
          {!collapsed && (
            <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
              Main
            </span>
          )}
          <div className="space-y-0.5 pt-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>

        <div className="space-y-0.5 pt-6">
          {!collapsed && (
            <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
              Management
            </span>
          )}
          <div className="space-y-0.5 pt-1">
            {management.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-sidebar-foreground">
            JD
          </div>
          {!collapsed && (
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
              <p className="text-[11px] text-sidebar-muted">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
