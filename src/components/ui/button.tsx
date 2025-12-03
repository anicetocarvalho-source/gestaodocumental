import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-button hover:bg-primary-hover hover:shadow-button-hover active:scale-[0.98] active:shadow-none",
        destructive:
          "bg-error text-error-foreground shadow-button hover:bg-error/90 hover:shadow-button-hover active:scale-[0.98]",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:bg-muted hover:border-border-strong active:bg-muted/80",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70",
        ghost: 
          "text-foreground hover:bg-muted active:bg-muted/80",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // Semantic variants
        success:
          "bg-success text-success-foreground shadow-button hover:bg-success/90 hover:shadow-button-hover active:scale-[0.98]",
        warning:
          "bg-warning text-warning-foreground shadow-button hover:bg-warning/90 hover:shadow-button-hover active:scale-[0.98]",
        info:
          "bg-info text-info-foreground shadow-button hover:bg-info/90 hover:shadow-button-hover active:scale-[0.98]",
        // Subtle/soft variants
        "success-subtle":
          "bg-success-muted text-success hover:bg-success-muted/80 active:bg-success-muted/60",
        "warning-subtle":
          "bg-warning-muted text-warning hover:bg-warning-muted/80 active:bg-warning-muted/60",
        "error-subtle":
          "bg-error-muted text-error hover:bg-error-muted/80 active:bg-error-muted/60",
        "info-subtle":
          "bg-info-muted text-info hover:bg-info-muted/80 active:bg-info-muted/60",
        "primary-subtle":
          "bg-primary-muted text-primary hover:bg-primary-muted/80 active:bg-primary-muted/60",
        // Sidebar
        sidebar:
          "bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-11 px-5 text-sm",
        xl: "h-12 px-6 text-base rounded-xl",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-11 w-11",
        "icon-xl": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
