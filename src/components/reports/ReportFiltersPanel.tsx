import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, RefreshCw } from "lucide-react";
import { format, subDays, subMonths, subWeeks, subYears } from "date-fns";
import type { ReportFilters } from "@/hooks/useReportsData";

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface ProcessType {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  full_name: string;
}

interface ReportFiltersPanelProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  units: Unit[];
  processTypes: ProcessType[];
  users: User[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ReportFiltersPanel = ({
  filters,
  onFiltersChange,
  units,
  processTypes,
  users,
  onRefresh,
  isLoading,
}: ReportFiltersPanelProps) => {
  const handlePeriodChange = (period: string) => {
    const now = new Date();
    let from: Date;
    
    switch (period) {
      case "week":
        from = subWeeks(now, 1);
        break;
      case "month":
        from = subMonths(now, 1);
        break;
      case "quarter":
        from = subMonths(now, 3);
        break;
      case "year":
        from = subYears(now, 1);
        break;
      default:
        from = subMonths(now, 1);
    }

    onFiltersChange({
      ...filters,
      dateFrom: from,
      dateTo: now,
    });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        dateFrom: range.from,
        dateTo: range.to,
      });
    }
  };

  const clearFilter = (filterKey: keyof ReportFilters) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = [
    filters.unitId,
    filters.processTypeId,
    filters.responsibleUserId,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period quick select */}
          <Select onValueChange={handlePeriodChange} defaultValue="month">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-60 justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(filters.dateFrom, "dd/MM/yyyy")} - {format(filters.dateTo, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="range"
                selected={{ from: filters.dateFrom, to: filters.dateTo }}
                onSelect={handleDateRangeChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Unit filter */}
          <Select
            value={filters.unitId || "all"}
            onValueChange={(value) => onFiltersChange({
              ...filters,
              unitId: value === "all" ? undefined : value,
            })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Process Type filter */}
          <Select
            value={filters.processTypeId || "all"}
            onValueChange={(value) => onFiltersChange({
              ...filters,
              processTypeId: value === "all" ? undefined : value,
            })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de Processo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {processTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Responsible User filter */}
          <Select
            value={filters.responsibleUserId || "all"}
            onValueChange={(value) => onFiltersChange({
              ...filters,
              responsibleUserId: value === "all" ? undefined : value,
            })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Utilizadores</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          
          {filters.unitId && (
            <Badge variant="secondary" className="gap-1">
              Unidade: {units.find(u => u.id === filters.unitId)?.name || "..."}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("unitId")}
              />
            </Badge>
          )}
          
          {filters.processTypeId && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {processTypes.find(t => t.id === filters.processTypeId)?.name || "..."}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("processTypeId")}
              />
            </Badge>
          )}
          
          {filters.responsibleUserId && (
            <Badge variant="secondary" className="gap-1">
              Responsável: {users.find(u => u.id === filters.responsibleUserId)?.full_name || "..."}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("responsibleUserId")}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => onFiltersChange({
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
            })}
          >
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
};
