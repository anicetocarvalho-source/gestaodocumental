import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const variantStyles = {
  default: "bg-primary/8 text-primary",
  success: "bg-success/8 text-success",
  warning: "bg-warning/8 text-warning",
  error: "bg-error/8 text-error",
  info: "bg-info/8 text-info",
};

export function StatCard({ title, value, description, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card variant="stat" className="animate-fade-in p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[13px] font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
          {(description || trend) && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {trend && (
                <span className={cn(
                  "text-[12px] font-medium tabular-nums",
                  trend.isPositive ? "text-success" : "text-error"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
              {description && (
                <span className="text-[12px] text-muted-foreground truncate">{description}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
