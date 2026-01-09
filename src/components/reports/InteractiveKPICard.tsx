import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, LucideIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface DrilldownItem {
  label: string;
  value: number | string;
  status?: "success" | "warning" | "error" | "info";
  link?: string;
}

interface InteractiveKPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  change?: number;
  icon: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
  drilldownTitle?: string;
  drilldownItems?: DrilldownItem[];
  navigateTo?: string;
  subtext?: string;
  subtextIcon?: LucideIcon;
}

export function InteractiveKPICard({
  title,
  value,
  suffix,
  change,
  icon: Icon,
  iconClassName = "bg-primary/10 text-primary",
  isLoading,
  drilldownTitle,
  drilldownItems,
  navigateTo,
  subtext,
  subtextIcon: SubtextIcon,
}: InteractiveKPICardProps) {
  const [showDrilldown, setShowDrilldown] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    } else if (drilldownItems && drilldownItems.length > 0) {
      setShowDrilldown(true);
    }
  };

  const isClickable = navigateTo || (drilldownItems && drilldownItems.length > 0);

  return (
    <>
      <Card 
        className={cn(
          "transition-all duration-200",
          isClickable && "cursor-pointer hover:shadow-md hover:border-primary/50 hover:scale-[1.02]"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {title}
                  {isClickable && <ExternalLink className="h-3 w-3" />}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {typeof value === "number" ? value.toLocaleString() : value}
                  {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {change !== undefined ? (
                    <>
                      {change >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        change >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {Math.abs(change)}%
                      </span>
                    </>
                  ) : subtext ? (
                    <>
                      {SubtextIcon && <SubtextIcon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{subtext}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", iconClassName)}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drilldown Dialog */}
      <Dialog open={showDrilldown} onOpenChange={setShowDrilldown}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{drilldownTitle || title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {drilldownItems?.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg bg-muted/50",
                  item.link && "cursor-pointer hover:bg-muted"
                )}
                onClick={() => item.link && navigate(item.link)}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant={
                  item.status === "success" ? "default" :
                  item.status === "warning" ? "secondary" :
                  item.status === "error" ? "destructive" :
                  "outline"
                } className={item.status === "success" ? "bg-success" : ""}>
                  {item.value}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
