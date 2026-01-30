import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QuickPickOption {
  id: string;
  label: string;
  /** Sub-label opcional (código, descrição curta) */
  subLabel?: string;
}

interface QuickPickProps {
  /** Opções mais usadas a mostrar */
  options: QuickPickOption[];
  /** Valor actualmente seleccionado */
  selectedValue?: string;
  /** Callback quando uma opção é seleccionada */
  onSelect: (id: string) => void;
  /** Desabilitar interação */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de seleção rápida que mostra 2-3 opções frequentes
 * como botões antes de precisar abrir o dropdown completo.
 */
export function QuickPick({ 
  options, 
  selectedValue, 
  onSelect, 
  disabled = false,
  className 
}: QuickPickProps) {
  if (options.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5 mb-2", className)}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1 self-center">
        Frequentes:
      </span>
      {options.slice(0, 3).map((option) => (
        <Button
          key={option.id}
          type="button"
          variant={selectedValue === option.id ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(option.id)}
          className={cn(
            "h-7 text-xs px-2.5",
            selectedValue === option.id && "pointer-events-none"
          )}
        >
          {option.subLabel ? (
            <span>
              <span className="font-medium">{option.subLabel}</span>
              <span className="text-muted-foreground ml-1">- {option.label}</span>
            </span>
          ) : (
            option.label
          )}
        </Button>
      ))}
    </div>
  );
}
