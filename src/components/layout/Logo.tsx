import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Logo Icon */}
      <div className="relative flex h-9 w-9 items-center justify-center">
        {/* Background shape */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/25" />
        
        {/* Decorative accent */}
        <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success shadow-sm" />
        
        {/* Icon - Stylized leaf/agriculture symbol */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="relative h-5 w-5 text-primary-foreground"
          aria-hidden="true"
        >
          {/* Main leaf shape */}
          <path
            d="M12 2C6.5 2 2 6.5 2 12c0 3 1.3 5.7 3.4 7.5.3-.9.8-2.1 1.6-3.3 1.5-2.2 4-4.2 7-4.2v-2c-4 0-7.3 2.5-9 5.2V12c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2.2-.9 4.2-2.3 5.6-.3-.4-.7-.8-1.1-1.1 1.1-1.1 1.9-2.7 1.9-4.5 0-3.6-2.9-6.5-6.5-6.5S5.5 8.4 5.5 12c0 1.1.3 2.2.8 3.1-.4.6-.7 1.2-1 1.8C4.5 15.4 4 13.8 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.8 0-3.4-.6-4.8-1.5.2-.3.5-.6.8-.9 1.1.8 2.5 1.4 4 1.4 3.9 0 7-3.1 7-7s-3.1-7-7-7z"
            fill="currentColor"
            opacity="0.3"
          />
          {/* Central stem and leaves */}
          <path
            d="M12 6c-1.1 0-2.1.3-3 .8v1.4c.8-.5 1.9-.7 3-.7 2.2 0 4 1.8 4 4 0 1.1-.4 2.1-1.1 2.8l1.1 1.1c1-1.1 1.5-2.4 1.5-3.9 0-3-2.5-5.5-5.5-5.5z"
            fill="currentColor"
            opacity="0.6"
          />
          <path
            d="M12 9c-1.7 0-3 1.3-3 3 0 .8.3 1.6.9 2.1l1.1-1.1c-.3-.3-.5-.6-.5-1 0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5c0 .4-.2.8-.5 1l1.1 1.1c.5-.6.9-1.3.9-2.1 0-1.7-1.3-3-3-3z"
            fill="currentColor"
          />
          {/* Small accent leaf */}
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
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
