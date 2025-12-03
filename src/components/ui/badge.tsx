import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Semantic status badges
        success: "border-transparent bg-success-muted text-success font-medium",
        warning: "border-transparent bg-warning-muted text-warning font-medium",
        error: "border-transparent bg-error-muted text-error font-medium",
        info: "border-transparent bg-info-muted text-info font-medium",
        // Solid semantic variants
        "success-solid": "border-transparent bg-success text-success-foreground",
        "warning-solid": "border-transparent bg-warning text-warning-foreground",
        "error-solid": "border-transparent bg-error text-error-foreground",
        "info-solid": "border-transparent bg-info text-info-foreground",
        // Document status variants
        draft: "border-border bg-muted text-muted-foreground",
        pending: "border-transparent bg-warning-muted text-warning",
        approved: "border-transparent bg-success-muted text-success",
        rejected: "border-transparent bg-error-muted text-error",
        "in-progress": "border-transparent bg-info-muted text-info",
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
