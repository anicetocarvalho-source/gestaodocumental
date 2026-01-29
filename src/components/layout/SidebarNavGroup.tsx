import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BadgeInfo {
  count: number;
  urgent: number;
  hasUrgent: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: BadgeInfo;
}

interface SidebarNavGroupProps {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  defaultOpen?: boolean;
}

export function SidebarNavGroup({ label, items, collapsed, defaultOpen = false }: SidebarNavGroupProps) {
  const location = useLocation();
  const hasActiveItem = items.some(item => 
    location.pathname === item.href || 
    (item.href !== '/' && location.pathname.startsWith(item.href))
  );
  
  const [isOpen, setIsOpen] = useState(defaultOpen || hasActiveItem);

  if (items.length === 0) return null;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));
    
    const linkContent = (
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
        {!collapsed && <span className="truncate flex-1">{item.name}</span>}
        {item.badge && !collapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Badge 
                variant={item.badge.hasUrgent ? "destructive" : "secondary"}
                className={cn(
                  "h-5 min-w-5 px-1.5 text-[10px] font-semibold cursor-help",
                  item.badge.hasUrgent && "animate-pulse"
                )}
              >
                {item.badge.count > 99 ? '99+' : item.badge.count}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {item.badge.hasUrgent 
                ? `${item.badge.urgent} urgente${item.badge.urgent > 1 ? 's' : ''} de ${item.badge.count} pendente${item.badge.count > 1 ? 's' : ''}`
                : `${item.badge.count} aprovação${item.badge.count > 1 ? 'ões' : ''} pendente${item.badge.count > 1 ? 's' : ''}`
              }
            </TooltipContent>
          </Tooltip>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="relative">
              {linkContent}
              {item.badge && (
                <Badge 
                  variant={item.badge.hasUrgent ? "destructive" : "secondary"}
                  className={cn(
                    "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px]",
                    item.badge.hasUrgent && "animate-pulse"
                  )}
                >
                  {item.badge.count > 99 ? '99+' : item.badge.count}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  // Collapsed mode - just show icons
  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItemComponent key={item.name} item={item} />
        ))}
      </div>
    );
  }

  // Expanded mode - collapsible group
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70 hover:text-sidebar-muted transition-colors">
        <span>{label}</span>
        <ChevronDown 
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pt-1">
        {items.map((item) => (
          <NavItemComponent key={item.name} item={item} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
