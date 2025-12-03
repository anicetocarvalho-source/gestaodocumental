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
      className="flex items-center gap-2 text-sm text-muted-foreground mb-6" 
      aria-label="Breadcrumb"
    >
      {showHome && (
        <>
          <Link 
            to="/" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
            aria-label="Home"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
        </>
      )}
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      ))}
    </nav>
  );
}
