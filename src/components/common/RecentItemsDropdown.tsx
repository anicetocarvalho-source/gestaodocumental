import { useState, useEffect } from "react";
import { Clock, FileText, FolderOpen, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface RecentItem {
  id: string;
  type: "document" | "process" | "dispatch";
  title: string;
  timestamp: number;
  href: string;
}

const RECENT_ITEMS_KEY = "minagrif_recent_items";
const MAX_ITEMS = 10;

// Helper functions to manage recent items
export function addRecentItem(item: Omit<RecentItem, "timestamp">) {
  const stored = localStorage.getItem(RECENT_ITEMS_KEY);
  const items: RecentItem[] = stored ? JSON.parse(stored) : [];
  
  // Remove existing item if present
  const filtered = items.filter((i) => i.id !== item.id);
  
  // Add new item at the beginning
  const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
  
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  
  // Dispatch event for updates
  window.dispatchEvent(new CustomEvent("recent-items-updated"));
}

const typeIcons = {
  document: FileText,
  process: FolderOpen,
  dispatch: Send,
};

const typeLabels = {
  document: "Documento",
  process: "Processo",
  dispatch: "Expediente",
};

export function RecentItemsDropdown() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const loadItems = () => {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      setItems(stored ? JSON.parse(stored) : []);
    };

    loadItems();

    // Listen for updates
    window.addEventListener("recent-items-updated", loadItems);
    return () => window.removeEventListener("recent-items-updated", loadItems);
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const clearRecents = () => {
    localStorage.removeItem(RECENT_ITEMS_KEY);
    setItems([]);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              data-tour="recent-items"
            >
              <Clock className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Itens recentes</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Acedidos Recentemente</span>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={clearRecents}
            >
              Limpar
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum item recente
            </p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <DropdownMenuItem
                key={item.id}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
                onClick={() => navigate(item.href)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabels[item.type]}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{formatTime(item.timestamp)}</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
