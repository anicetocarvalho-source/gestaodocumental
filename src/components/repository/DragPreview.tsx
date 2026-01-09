import { FileText, Files } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragPreviewProps {
  documents: Array<{
    id: string;
    title: string;
    entry_number: string;
    status?: string;
  }>;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted",
  pending: "bg-warning/20",
  in_progress: "bg-info/20",
  completed: "bg-success/20",
  archived: "bg-secondary/20",
  cancelled: "bg-destructive/20",
};

export function DragPreview({ documents }: DragPreviewProps) {
  const count = documents.length;
  const isMultiple = count > 1;
  const maxVisible = 3;
  const visibleDocs = documents.slice(0, maxVisible);
  const remaining = count - maxVisible;

  return (
    <div className="flex flex-col gap-1 min-w-[200px] max-w-[280px]">
      {/* Stack effect for multiple documents */}
      <div className="relative">
        {isMultiple && (
          <>
            {/* Background cards for stack effect */}
            <div className="absolute inset-0 translate-x-2 translate-y-2 bg-card rounded-lg border border-border/50 shadow-sm" />
            <div className="absolute inset-0 translate-x-1 translate-y-1 bg-card rounded-lg border border-border/70 shadow-sm" />
          </>
        )}
        
        {/* Main preview card */}
        <div className="relative bg-card rounded-lg border-2 border-primary shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-3 py-2 flex items-center gap-2">
            {isMultiple ? (
              <Files className="h-4 w-4 text-primary-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-primary-foreground" />
            )}
            <span className="text-sm font-medium text-primary-foreground">
              {isMultiple ? `${count} documentos` : "1 documento"}
            </span>
          </div>
          
          {/* Document list */}
          <div className="p-2 space-y-1">
            {visibleDocs.map((doc, index) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-xs",
                  statusColors[doc.status || "draft"] || "bg-muted"
                )}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded bg-background/80 flex items-center justify-center border border-border/50">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">
                    {doc.title}
                  </p>
                  <p className="text-muted-foreground truncate">
                    {doc.entry_number}
                  </p>
                </div>
              </div>
            ))}
            
            {remaining > 0 && (
              <div className="text-xs text-center text-muted-foreground py-1">
                +{remaining} mais documento{remaining > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Instruction hint */}
      <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded px-2 py-1 mt-1">
        Solte numa classificação para mover
      </div>
    </div>
  );
}

// Utility function to create drag preview element
export function createDragPreviewElement(
  documents: Array<{
    id: string;
    title: string;
    entry_number: string;
    status?: string;
  }>
): HTMLElement {
  const count = documents.length;
  const isMultiple = count > 1;
  const maxVisible = 3;
  const visibleDocs = documents.slice(0, maxVisible);
  const remaining = count - maxVisible;

  // Create container
  const container = document.createElement("div");
  container.className = "fixed pointer-events-none z-[9999]";
  container.style.cssText = "position: absolute; top: -9999px; left: -9999px;";

  // Build the preview HTML
  container.innerHTML = `
    <div style="
      min-width: 220px;
      max-width: 280px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="position: relative;">
        ${isMultiple ? `
          <div style="
            position: absolute;
            inset: 0;
            transform: translate(6px, 6px);
            background: hsl(var(--card));
            border-radius: 8px;
            border: 1px solid hsl(var(--border) / 0.5);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          "></div>
          <div style="
            position: absolute;
            inset: 0;
            transform: translate(3px, 3px);
            background: hsl(var(--card));
            border-radius: 8px;
            border: 1px solid hsl(var(--border) / 0.7);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          "></div>
        ` : ""}
        
        <div style="
          position: relative;
          background: hsl(var(--card));
          border-radius: 8px;
          border: 2px solid hsl(var(--primary));
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1);
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: hsl(var(--primary));
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${isMultiple 
                ? `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`
                : `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>`
              }
            </svg>
            <span style="
              font-size: 13px;
              font-weight: 600;
              color: hsl(var(--primary-foreground));
            ">
              ${isMultiple ? `${count} documentos` : "1 documento"}
            </span>
          </div>
          
          <!-- Document list -->
          <div style="padding: 8px;">
            ${visibleDocs.map(doc => `
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                margin-bottom: 4px;
                border-radius: 6px;
                background: hsl(var(--muted) / 0.5);
              ">
                <div style="
                  flex-shrink: 0;
                  width: 32px;
                  height: 32px;
                  border-radius: 4px;
                  background: hsl(var(--background));
                  border: 1px solid hsl(var(--border) / 0.5);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                  </svg>
                </div>
                <div style="flex: 1; min-width: 0;">
                  <p style="
                    font-size: 12px;
                    font-weight: 500;
                    color: hsl(var(--foreground));
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin: 0 0 2px 0;
                  ">
                    ${doc.title.length > 25 ? doc.title.substring(0, 25) + "..." : doc.title}
                  </p>
                  <p style="
                    font-size: 11px;
                    color: hsl(var(--muted-foreground));
                    margin: 0;
                  ">
                    ${doc.entry_number}
                  </p>
                </div>
              </div>
            `).join("")}
            
            ${remaining > 0 ? `
              <div style="
                font-size: 11px;
                text-align: center;
                color: hsl(var(--muted-foreground));
                padding: 4px 0;
              ">
                +${remaining} mais documento${remaining > 1 ? "s" : ""}
              </div>
            ` : ""}
          </div>
        </div>
      </div>
      
      <!-- Instruction hint -->
      <div style="
        font-size: 11px;
        text-align: center;
        color: hsl(var(--muted-foreground));
        background: hsl(var(--muted) / 0.5);
        border-radius: 4px;
        padding: 4px 8px;
        margin-top: 6px;
      ">
        Solte numa classificação para mover
      </div>
    </div>
  `;

  return container;
}
