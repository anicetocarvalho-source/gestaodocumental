import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkPlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useReportFilterPresets } from "@/hooks/useReportFilterPresets";

interface SavedFiltersBarProps<T extends Record<string, unknown>> {
  reportKey: string;
  /** Current filter values to be stored when saving a favourite. */
  current: T;
  /** Applies a stored set of filter values back to the report. */
  onApply: (values: T) => void;
  /** Apply the preset marked as default on first mount. */
  applyDefaultOnMount?: boolean;
}

export function SavedFiltersBar<T extends Record<string, unknown>>({
  reportKey,
  current,
  onApply,
  applyDefaultOnMount = true,
}: SavedFiltersBarProps<T>) {
  const { presets, defaultId, savePreset, removePreset, toggleDefault } =
    useReportFilterPresets<T>(reportKey);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const applied = useRef(false);

  useEffect(() => {
    if (!applyDefaultOnMount || applied.current || !defaultId) return;
    const preset = presets.find((p) => p.id === defaultId);
    if (preset) {
      applied.current = true;
      onApply(preset.values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultId, presets]);

  const handleSave = () => {
    const saved = savePreset(name, current);
    if (!saved) return;
    setName("");
    setOpen(false);
    toast({ title: "Filtro guardado", description: `"${saved.name}" ficou disponível nos favoritos.` });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Bookmark className="h-4 w-4" aria-hidden="true" /> Filtros favoritos:
      </span>

      {presets.length === 0 ? (
        <span className="text-sm text-muted-foreground">nenhum guardado</span>
      ) : (
        presets.map((preset) => (
          <Badge
            key={preset.id}
            variant={preset.id === defaultId ? "default" : "secondary"}
            className="gap-1 py-1 pl-2.5 pr-1"
          >
            <button
              type="button"
              className="text-xs font-medium"
              onClick={() => {
                onApply(preset.values);
                toast({ title: "Filtros aplicados", description: preset.name });
              }}
            >
              {preset.name}
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={preset.id === defaultId ? "Remover como predefinido" : "Definir como predefinido"}
                  className="rounded p-0.5 hover:bg-background/30"
                  onClick={() => toggleDefault(preset.id)}
                >
                  <Star className={preset.id === defaultId ? "h-3 w-3 fill-current" : "h-3 w-3"} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {preset.id === defaultId ? "Predefinido para este relatório" : "Definir como predefinido"}
              </TooltipContent>
            </Tooltip>
            <button
              type="button"
              aria-label={`Eliminar filtro ${preset.name}`}
              className="rounded p-0.5 hover:bg-background/30"
              onClick={() => removePreset(preset.id)}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </Badge>
        ))
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <BookmarkPlus className="h-4 w-4" aria-hidden="true" /> Guardar filtros
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3 bg-popover">
          <div className="space-y-1.5">
            <Label htmlFor={`preset-name-${reportKey}`}>Nome do filtro</Label>
            <Input
              id={`preset-name-${reportKey}`}
              value={name}
              maxLength={60}
              placeholder="Ex.: Empréstimos em atraso"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <p className="text-xs text-muted-foreground">
              Guarda a configuração actual e reutiliza-a com um clique.
            </p>
          </div>
          <Button size="sm" className="w-full" disabled={!name.trim()} onClick={handleSave}>
            Guardar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
