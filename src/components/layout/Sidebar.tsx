import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarContent } from "./SidebarContent";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
      aria-label="Navegação principal"
      data-tour="sidebar"
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <SidebarContent collapsed={collapsed} />
      </div>
      
      {/* Botão de colapsar */}
      <div className="absolute top-4 right-0 translate-x-1/2 z-10">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full bg-background shadow-md border-sidebar-border"
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>
    </aside>
  );
}
