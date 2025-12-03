import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border bg-transparent",
        // Semantic soft badges (Apple style)
        success: "border-transparent bg-success-muted text-success",
        warning: "border-transparent bg-warning-muted text-warning",
        error: "border-transparent bg-error-muted text-error",
        info: "border-transparent bg-info-muted text-info",
        // Solid semantic variants
        "success-solid": "border-transparent bg-success text-success-foreground",
        "warning-solid": "border-transparent bg-warning text-warning-foreground",
        "error-solid": "border-transparent bg-error text-error-foreground",
        "info-solid": "border-transparent bg-info text-info-foreground",
        // Document status variants
        draft: "border-border/60 bg-muted/50 text-muted-foreground",
        pending: "border-transparent bg-warning-muted text-warning",
        approved: "border-transparent bg-success-muted text-success",
        rejected: "border-transparent bg-error-muted text-error",
        "in-progress": "border-transparent bg-info-muted text-info",
        // Primary soft
        "primary-soft": "border-transparent bg-primary-muted text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
