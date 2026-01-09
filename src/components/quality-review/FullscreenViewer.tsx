import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Loader2,
  FileText,
  ImageOff,
} from "lucide-react";

interface FullscreenViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageError: boolean;
  isLoading: boolean;
  documentTitle: string;
  zoom: number;
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onDownload: () => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  currentIndex: number;
  totalCount: number;
  isDownloading: boolean;
  onImageError: () => void;
}

export const FullscreenViewer = ({
  isOpen,
  onClose,
  imageUrl,
  imageError,
  isLoading,
  documentTitle,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onNavigatePrev,
  onNavigateNext,
  onDownload,
  canNavigatePrev,
  canNavigateNext,
  currentIndex,
  totalCount,
  isDownloading,
  onImageError,
}: FullscreenViewerProps) => {
  // Keyboard shortcuts for fullscreen mode
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (canNavigatePrev) onNavigatePrev();
          break;
        case "ArrowRight":
          if (canNavigateNext) onNavigateNext();
          break;
        case "+":
        case "=":
          onZoomIn();
          break;
        case "-":
          onZoomOut();
          break;
        case "r":
        case "R":
          onRotateRight();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, canNavigatePrev, canNavigateNext, onClose, onNavigatePrev, onNavigateNext, onZoomIn, onZoomOut, onRotateRight]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onNavigatePrev}
              disabled={!canNavigatePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-3">
              {currentIndex + 1} de {totalCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={onNavigateNext}
              disabled={!canNavigateNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="outline" size="icon" onClick={onRotateLeft}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onRotateRight}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button
              variant="outline"
              size="icon"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex items-center justify-center h-full p-16">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">A carregar imagem...</p>
            </div>
          ) : imageUrl && !imageError ? (
            <div
              className="transition-transform"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={imageUrl}
                alt={documentTitle}
                className="max-w-[80vw] max-h-[80vh] shadow-2xl rounded-lg"
                onError={onImageError}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              {imageError ? (
                <>
                  <ImageOff className="h-24 w-24" />
                  <p>Erro ao carregar imagem</p>
                </>
              ) : (
                <>
                  <FileText className="h-24 w-24" />
                  <p>{documentTitle || "Documento"}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">→</kbd> Navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">+</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">-</kbd> Zoom</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">R</kbd> Rodar</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Fechar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
