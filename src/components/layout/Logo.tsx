import { cn } from "@/lib/utils";
import nodocLogo from "@/assets/nodoc-logo.png";

export interface LogoProps {
  collapsed?: boolean;
  className?: string;
  variant?: "default" | "light";
}

export function Logo({ collapsed = false, className, variant = "default" }: LogoProps) {
  const isLight = variant === "light";
  
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Logo Image */}
      <div className="flex h-9 w-9 items-center justify-center shrink-0">
        <img 
          src={nodocLogo} 
          alt="NODOC Logo" 
          className={cn("h-9 w-9 object-contain rounded-lg", isLight && "brightness-0 invert")}
        />
      </div>

      {/* Text */}
      {!collapsed && (
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-bold tracking-tight leading-none",
            isLight ? "text-white" : "text-sidebar-foreground"
          )}>
            NODOC
          </span>
          <span className={cn(
            "text-[9px] font-medium tracking-wider uppercase mt-0.5",
            isLight ? "text-white/70" : "text-sidebar-muted"
          )}>
            Gestão Documental
          </span>
        </div>
      )}
    </div>
  );
}
