import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Loader2,
  FileText,
  ImageOff,
  Columns,
} from "lucide-react";

interface Document {
  id: string;
  document_number: string;
  title: string | null;
  status: string;
  file_path: string | null;
}

interface ComparisonViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  imageUrls: Record<string, string>;
  loadingImages: Record<string, boolean>;
  imageErrors: Record<string, boolean>;
  onImageError: (docId: string) => void;
  initialLeftId?: string;
  initialRightId?: string;
}

export const ComparisonViewer = ({
  isOpen,
  onClose,
  documents,
  imageUrls,
  loadingImages,
  imageErrors,
  onImageError,
  initialLeftId,
  initialRightId,
}: ComparisonViewerProps) => {
  const [leftDocId, setLeftDocId] = useState<string | null>(initialLeftId || null);
  const [rightDocId, setRightDocId] = useState<string | null>(initialRightId || null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const leftDoc = documents.find(d => d.id === leftDocId);
  const rightDoc = documents.find(d => d.id === rightDocId);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const renderDocumentPanel = (
    doc: Document | undefined,
    docId: string | null,
    setDocId: (id: string) => void,
    side: "left" | "right"
  ) => (
    <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
      {/* Document Selector */}
      <div className="p-3 bg-muted/50 border-b">
        <Select value={docId || ""} onValueChange={setDocId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar documento..." />
          </SelectTrigger>
          <SelectContent>
            {documents.map((d, index) => (
              <SelectItem key={d.id} value={d.id}>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">#{index + 1}</span>
                  <span>{d.title || d.document_number}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {doc && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-medium truncate flex-1">{doc.title || doc.document_number}</span>
            {getStatusBadge(doc.status)}
          </div>
        )}
      </div>

      {/* Document Preview */}
      <div className="flex-1 bg-muted/30 flex items-center justify-center p-4 overflow-auto">
        {!docId ? (
          <div className="text-center text-muted-foreground">
            <Columns className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Seleccione um documento</p>
          </div>
        ) : loadingImages[docId] ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">A carregar...</p>
          </div>
        ) : imageUrls[docId] && !imageErrors[docId] ? (
          <div
            className="transition-transform"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={imageUrls[docId]}
              alt={doc?.title || "Documento"}
              className="max-w-full max-h-[60vh] shadow-lg rounded"
              onError={() => onImageError(docId)}
            />
          </div>
        ) : imageErrors[docId] ? (
          <div className="text-center text-muted-foreground">
            <ImageOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Erro ao carregar</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">{doc?.title || "Sem pré-visualização"}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Columns className="h-5 w-5" />
              Comparação de Documentos
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Button variant="outline" size="icon" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {renderDocumentPanel(leftDoc, leftDocId, setLeftDocId, "left")}
          {renderDocumentPanel(rightDoc, rightDocId, setRightDocId, "right")}
        </div>
      </DialogContent>
    </Dialog>
  );
};
