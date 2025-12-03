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
  default: "bg-primary/10 text-primary",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  error: "bg-error-muted text-error",
  info: "bg-info-muted text-info",
};

export function StatCard({ title, value, description, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card variant="stat" className="animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {(description || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-error"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
              {description && (
                <span className="text-sm text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", variantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
