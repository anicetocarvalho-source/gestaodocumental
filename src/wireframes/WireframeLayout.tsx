import { ReactNode } from "react";

interface WireframeLayoutProps {
  children: ReactNode;
  title: string;
  screenNumber: number;
}

export function WireframeLayout({ children, title, screenNumber }: WireframeLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] font-mono">
      {/* Screen Label */}
      <div className="bg-[#E0E0E0] border-b border-[#BDBDBD] px-4 py-2">
        <span className="text-xs text-[#616161]">
          WIREFRAME {screenNumber}/11 — {title.toUpperCase()}
        </span>
      </div>
      
      <div className="flex">
        {/* Sidebar Placeholder */}
        <aside className="w-[200px] min-h-[calc(100vh-40px)] bg-[#E8E8E8] border-r border-[#BDBDBD] p-4">
          {/* Logo Placeholder */}
          <div className="h-8 w-24 bg-[#BDBDBD] rounded mb-6" />
          
          {/* Nav Items */}
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 bg-[#BDBDBD] rounded" />
                <div className="h-3 w-20 bg-[#BDBDBD] rounded" />
              </div>
            ))}
          </div>
          
          {/* Divider */}
          <div className="h-px bg-[#BDBDBD] my-4" />
          
          {/* Secondary Nav */}
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 bg-[#BDBDBD] rounded" />
                <div className="h-3 w-16 bg-[#BDBDBD] rounded" />
              </div>
            ))}
          </div>
          
          {/* User Area */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="h-8 w-8 bg-[#BDBDBD] rounded-full" />
            <div className="space-y-1">
              <div className="h-2 w-16 bg-[#BDBDBD] rounded" />
              <div className="h-2 w-12 bg-[#9E9E9E] rounded" />
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-40px)]">
          {/* Header */}
          <header className="h-14 bg-white border-b border-[#BDBDBD] px-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-[#9E9E9E] rounded" />
              <div className="h-2 w-48 bg-[#BDBDBD] rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
              <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
              <div className="h-8 w-8 bg-[#E0E0E0] rounded" />
            </div>
          </header>
          
          {/* Page Content - 12 Column Grid */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Grid Overlay Indicator */}
      <div className="fixed bottom-4 right-4 bg-[#424242] text-white text-xs px-2 py-1 rounded font-mono">
        12-COL GRID
      </div>
    </div>
  );
}

/* Wireframe Components */
export function WFCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#BDBDBD] rounded p-4 ${className}`}>
      {children}
    </div>
  );
}

export function WFButton({ width = "w-20", variant = "primary" }: { width?: string; variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-[#9E9E9E] h-8",
    secondary: "bg-[#E0E0E0] h-8 border border-[#BDBDBD]",
    ghost: "bg-transparent h-8 border border-[#BDBDBD]",
  };
  return <div className={`${styles[variant]} ${width} rounded`} />;
}

export function WFInput({ width = "w-full" }: { width?: string }) {
  return <div className={`h-9 ${width} bg-[#F5F5F5] border border-[#BDBDBD] rounded`} />;
}

export function WFText({ width = "w-24", height = "h-3" }: { width?: string; height?: string }) {
  return <div className={`${height} ${width} bg-[#BDBDBD] rounded`} />;
}

export function WFHeading({ width = "w-32" }: { width?: string }) {
  return <div className={`h-5 ${width} bg-[#9E9E9E] rounded`} />;
}

export function WFAvatar({ size = "h-8 w-8" }: { size?: string }) {
  return <div className={`${size} bg-[#BDBDBD] rounded-full`} />;
}

export function WFBadge() {
  return <div className="h-5 w-16 bg-[#E0E0E0] rounded-full" />;
}

export function WFIcon({ size = "h-4 w-4" }: { size?: string }) {
  return <div className={`${size} bg-[#BDBDBD] rounded`} />;
}

export function WFCheckbox() {
  return <div className="h-4 w-4 border-2 border-[#BDBDBD] rounded" />;
}

export function WFTableHeader({ columns }: { columns: number }) {
  return (
    <div className="flex items-center gap-4 bg-[#F5F5F5] border-b border-[#BDBDBD] px-4 py-3">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="flex-1">
          <div className="h-3 w-16 bg-[#9E9E9E] rounded" />
        </div>
      ))}
    </div>
  );
}

export function WFTableRow({ columns }: { columns: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#E0E0E0] px-4 py-3">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="flex-1">
          <div className="h-3 w-20 bg-[#BDBDBD] rounded" />
        </div>
      ))}
    </div>
  );
}
