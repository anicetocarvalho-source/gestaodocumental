import { Star, FileText, FolderOpen, Send, Layout, ChevronRight, StarOff } from "lucide-react";
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
import { useFavorites, FavoriteItem } from "@/hooks/useFavorites";

const typeIcons = {
  document: FileText,
  process: FolderOpen,
  dispatch: Send,
  page: Layout,
};

const typeLabels = {
  document: "Documento",
  process: "Processo",
  dispatch: "Expediente",
  page: "Página",
};

export function FavoritesDropdown() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
              data-tour="favorites"
            >
              <Star className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">
                  {favorites.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Favoritos</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Meus Favoritos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {favorites.length === 0 ? (
          <div className="py-6 text-center">
            <StarOff className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum favorito adicionado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique no ícone ⭐ para adicionar
            </p>
          </div>
        ) : (
          favorites.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <DropdownMenuItem
                key={item.id}
                className="flex items-center gap-3 py-2.5 cursor-pointer group"
                onClick={() => navigate(item.href)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                  <Icon className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabels[item.type]}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(item.id);
                  }}
                >
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                </Button>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Button component to toggle favorite
interface FavoriteButtonProps {
  item: Omit<FavoriteItem, "addedAt">;
  size?: "sm" | "md";
}

export function FavoriteButton({ item, size = "sm" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(item.id);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size === "sm" ? "icon-sm" : "icon"}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item);
          }}
          className={isFav ? "text-warning" : "text-muted-foreground hover:text-warning"}
        >
          <Star className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
