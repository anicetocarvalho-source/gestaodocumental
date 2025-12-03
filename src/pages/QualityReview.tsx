import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  FileText,
  Maximize2,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for scanned pages
const mockPages = [
  { id: 1, thumbnail: "/placeholder.svg", status: "pending", pageNumber: 1 },
  { id: 2, thumbnail: "/placeholder.svg", status: "approved", pageNumber: 2 },
  { id: 3, thumbnail: "/placeholder.svg", status: "pending", pageNumber: 3 },
  { id: 4, thumbnail: "/placeholder.svg", status: "rejected", pageNumber: 4 },
  { id: 5, thumbnail: "/placeholder.svg", status: "pending", pageNumber: 5 },
  { id: 6, thumbnail: "/placeholder.svg", status: "pending", pageNumber: 6 },
  { id: 7, thumbnail: "/placeholder.svg", status: "pending", pageNumber: 7 },
  { id: 8, thumbnail: "/placeholder.svg", status: "approved", pageNumber: 8 },
];

const classificationOptions = [
  { value: "confidencial", label: "Confidencial" },
  { value: "interno", label: "Interno" },
  { value: "publico", label: "Público" },
  { value: "reservado", label: "Reservado" },
];

const documentTypes = [
  { value: "oficio", label: "Ofício" },
  { value: "memorando", label: "Memorando" },
  { value: "relatorio", label: "Relatório" },
  { value: "contrato", label: "Contrato" },
  { value: "factura", label: "Factura" },
  { value: "outro", label: "Outro" },
];

const QualityReview = () => {
  const [selectedPage, setSelectedPage] = useState(mockPages[0]);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [tags, setTags] = useState<string[]>(["digitalização", "lote-001"]);
  const [newTag, setNewTag] = useState("");

  // Metadata state
  const [metadata, setMetadata] = useState({
    titulo: "Ofício nº 234/2024",
    autor: "Ministério da Administração",
    dataDocumento: "2024-01-15",
    numeroReferencia: "OF/2024/234",
    descricao: "Comunicação oficial referente ao processo de digitalização de documentos históricos.",
    classificacao: "interno",
    tipoDocumento: "oficio",
  });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleApproveBatch = () => {
    console.log("Lote aprovado");
    // Implementation for batch approval
  };

  const handleRejectBatch = () => {
    if (rejectReason.trim()) {
      console.log("Lote rejeitado:", rejectReason);
      setShowRejectDialog(false);
      setRejectReason("");
    }
  };

  const navigatePage = (direction: "prev" | "next") => {
    const currentIndex = mockPages.findIndex(p => p.id === selectedPage.id);
    if (direction === "prev" && currentIndex > 0) {
      setSelectedPage(mockPages[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < mockPages.length - 1) {
      setSelectedPage(mockPages[currentIndex + 1]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/20 border-emerald-500";
      case "rejected": return "bg-destructive/20 border-destructive";
      default: return "bg-muted border-border";
    }
  };

  return (
    <DashboardLayout title="Revisão de Qualidade" subtitle="Lote: BATCH-2024-001 • 8 páginas">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => setShowRejectDialog(true)}
            >
              <X className="h-4 w-4 mr-2" />
              Rejeitar Lote
            </Button>
            <Button onClick={handleApproveBatch} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" />
              Aprovar Lote
            </Button>
          </div>
        </div>

        {/* Main Content - Three Panel Layout */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
          {/* Left Panel - Thumbnails */}
          <Card className="col-span-2 flex flex-col">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Páginas</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {mockPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className={cn(
                        "w-full p-2 rounded-lg border-2 transition-all hover:border-primary/50",
                        selectedPage.id === page.id 
                          ? "border-primary bg-primary/5" 
                          : getStatusColor(page.status)
                      )}
                    >
                      <div className="aspect-[3/4] bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Pág. {page.pageNumber}</span>
                        {page.status === "approved" && (
                          <Check className="h-3 w-3 text-emerald-500" />
                        )}
                        {page.status === "rejected" && (
                          <X className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Center Panel - Page Viewer */}
          <Card className="col-span-6 flex flex-col">
            <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => navigatePage("prev")}
                  disabled={mockPages.findIndex(p => p.id === selectedPage.id) === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Página {selectedPage.pageNumber} de {mockPages.length}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => navigatePage("next")}
                  disabled={mockPages.findIndex(p => p.id === selectedPage.id) === mockPages.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRotateLeft}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRotateRight}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-auto bg-muted/30">
              <div className="h-full flex items-center justify-center">
                <div 
                  className="bg-background shadow-lg rounded-lg overflow-hidden transition-transform"
                  style={{ 
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "center center"
                  }}
                >
                  <div className="w-[500px] aspect-[3/4] flex items-center justify-center bg-card border">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-sm">Documento Digitalizado</p>
                      <p className="text-xs">Página {selectedPage.pageNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Metadata & Tags */}
          <Card className="col-span-4 flex flex-col">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Metadados do Documento</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input 
                      id="titulo" 
                      value={metadata.titulo}
                      onChange={(e) => setMetadata({...metadata, titulo: e.target.value})}
                    />
                  </div>

                  {/* Autor */}
                  <div className="space-y-2">
                    <Label htmlFor="autor">Autor / Origem</Label>
                    <Input 
                      id="autor" 
                      value={metadata.autor}
                      onChange={(e) => setMetadata({...metadata, autor: e.target.value})}
                    />
                  </div>

                  {/* Data do Documento */}
                  <div className="space-y-2">
                    <Label htmlFor="dataDocumento">Data do Documento</Label>
                    <Input 
                      id="dataDocumento" 
                      type="date"
                      value={metadata.dataDocumento}
                      onChange={(e) => setMetadata({...metadata, dataDocumento: e.target.value})}
                    />
                  </div>

                  {/* Número de Referência */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroReferencia">Nº de Referência</Label>
                    <Input 
                      id="numeroReferencia" 
                      value={metadata.numeroReferencia}
                      onChange={(e) => setMetadata({...metadata, numeroReferencia: e.target.value})}
                    />
                  </div>

                  {/* Tipo de Documento */}
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select 
                      value={metadata.tipoDocumento}
                      onValueChange={(value) => setMetadata({...metadata, tipoDocumento: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Classificação */}
                  <div className="space-y-2">
                    <Label>Classificação</Label>
                    <Select 
                      value={metadata.classificacao}
                      onValueChange={(value) => setMetadata({...metadata, classificacao: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar classificação" />
                      </SelectTrigger>
                      <SelectContent>
                        {classificationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea 
                      id="descricao" 
                      rows={3}
                      value={metadata.descricao}
                      onChange={(e) => setMetadata({...metadata, descricao: e.target.value})}
                    />
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nova etiqueta..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      />
                      <Button variant="outline" size="icon" onClick={handleAddTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Suggested Tags */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Sugestões IA</Label>
                    <div className="flex flex-wrap gap-2">
                      {["ministério", "correspondência", "2024", "urgente"].map((suggestion) => (
                        <Badge 
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 border-dashed"
                          onClick={() => !tags.includes(suggestion) && setTags([...tags, suggestion])}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Page Actions */}
                  <div className="space-y-2">
                    <Label>Acções da Página</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                        <X className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Lote</DialogTitle>
            <DialogDescription>
              Indique o motivo da rejeição do lote. Esta informação será enviada ao operador responsável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Motivo da Rejeição</Label>
              <Textarea
                id="rejectReason"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivos Frequentes</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Qualidade de imagem insuficiente",
                  "Páginas em falta",
                  "Ordem incorrecta",
                  "Documento ilegível",
                  "Metadados incorrectos"
                ].map((reason) => (
                  <Badge
                    key={reason}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setRejectReason(reason)}
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectBatch}
              disabled={!rejectReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default QualityReview;
