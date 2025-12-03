import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function PageBreadcrumb({ items, showHome = true }: PageBreadcrumbProps) {
  return (
    <nav 
      className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-5" 
      aria-label="Breadcrumb"
    >
      {showHome && (
        <>
          <Link 
            to="/" 
            className="hover:text-foreground transition-colors flex items-center p-1 -ml-1 rounded-md hover:bg-muted/50"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
          )}
        </>
      )}
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted/50"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium px-1.5 py-0.5" aria-current="page">
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
          )}
        </span>
      ))}
    </nav>
  );
}
