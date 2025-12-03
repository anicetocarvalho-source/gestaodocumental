import { cn } from "@/lib/utils";
import minagrif_logo from "@/assets/minagrif-logo.png";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Logo Image */}
      <div className="flex h-9 w-9 items-center justify-center shrink-0">
        <img 
          src={minagrif_logo} 
          alt="MINAGRIF Logo" 
          className="h-9 w-9 object-contain"
        />
      </div>

      {/* Text */}
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight leading-none">
            MINAGRIF
          </span>
          <span className="text-[9px] font-medium text-sidebar-muted tracking-wider uppercase mt-0.5">
            Gestão Documental
          </span>
        </div>
      )}
    </div>
  );
}
