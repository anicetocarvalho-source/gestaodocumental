import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { 
  FileText, 
  Download, 
  Share2,
  FolderPlus,
  Tag,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Contrast,
  History,
  Clock,
  User,
  Calendar,
  Building2,
  FileType,
  HardDrive,
  Eye,
  Printer,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Check
} from "lucide-react";

// Document metadata
const documentData = {
  id: "DOC-2024-001234",
  title: "Ofício nº 123/2024 - Secretaria de Educação",
  type: "Ofício",
  format: "PDF",
  size: "2.4 MB",
  pages: 12,
  origin: "Externa",
  classification: "Público",
  status: "Em Análise",
  author: "Maria Silva",
  unit: "Gabinete",
  created: "15 Nov 2024",
  modified: "01 Dez 2024",
  subject: "Solicitação de Recursos",
  tags: ["educação", "recursos", "urgente"],
};

// Version history
const versions = [
  { version: "v3", date: "01 Dez 2024, 14:30", author: "Carlos Mendes", action: "Atualização de metadados", current: true },
  { version: "v2", date: "28 Nov 2024, 10:15", author: "Ana Costa", action: "Anexo de parecer", current: false },
  { version: "v1", date: "15 Nov 2024, 09:30", author: "Maria Silva", action: "Versão original", current: false },
];

// Audit log
const auditLog = [
  { action: "Visualização", user: "João Santos", date: "01 Dez 2024, 15:00", ip: "192.168.1.45" },
  { action: "Download", user: "Carlos Mendes", date: "01 Dez 2024, 14:35", ip: "192.168.1.33" },
  { action: "Metadados atualizados", user: "Carlos Mendes", date: "01 Dez 2024, 14:30", ip: "192.168.1.33" },
  { action: "Visualização", user: "Ana Costa", date: "28 Nov 2024, 10:20", ip: "192.168.1.22" },
  { action: "Versão criada", user: "Ana Costa", date: "28 Nov 2024, 10:15", ip: "192.168.1.22" },
];

// Available tags
const availableTags = ["educação", "recursos", "urgente", "financeiro", "RH", "obras", "TI", "jurídico"];

const DocumentViewer = () => {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contrastMode, setContrastMode] = useState<"normal" | "high" | "inverted">("normal");
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState(documentData.tags);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, documentData.pages));

  const getContrastStyle = () => {
    switch (contrastMode) {
      case "high":
        return "contrast-125 brightness-110";
      case "inverted":
        return "invert";
      default:
        return "";
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <DashboardLayout 
      title="Visualizador de Documento" 
      subtitle={documentData.id}
    >
      <PageBreadcrumb 
        items={[
          { label: "Documentos", href: "/documents" },
          { label: documentData.id, href: `/documents/${documentData.id}` },
          { label: "Visualizar" }
        ]} 
      />

      <div className={`grid grid-cols-1 ${isFullscreen ? "" : "lg:grid-cols-12"} gap-4`}>
        
        {/* Left Panel - Metadata */}
        {!isFullscreen && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Metadados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileType className="h-3.5 w-3.5" />
                    <span>Tipo</span>
                  </div>
                  <p className="font-medium pl-5">{documentData.type}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>Formato</span>
                  </div>
                  <p className="font-medium pl-5">{documentData.format} • {documentData.size}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Páginas</span>
                  </div>
                  <p className="font-medium pl-5">{documentData.pages}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Origem</span>
                  </div>
                  <p className="font-medium pl-5">{documentData.origin}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Classificação</span>
                  </div>
                  <Badge variant="success" className="ml-5">{documentData.classification}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Autor</span>
                  </div>
                  <p className="font-medium pl-5">{documentData.author}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Data</span>
                  </div>
                  <p className="font-medium pl-5">{documentData.created}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    <span>Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-5">
                    {selectedTags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Center - PDF Viewer */}
        <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-7"} space-y-3`}>
          {/* Viewer Toolbar */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    aria-label="Diminuir zoom"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={50}
                      max={200}
                      step={25}
                      className="w-20"
                      aria-label="Nível de zoom"
                    />
                    <span className="text-sm font-medium w-12">{zoom}%</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    aria-label="Aumentar zoom"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= documentData.pages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-14 h-8 text-center"
                      min={1}
                      max={documentData.pages}
                      aria-label="Número da página"
                    />
                    <span className="text-sm text-muted-foreground">/ {documentData.pages}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handleNextPage}
                    disabled={currentPage >= documentData.pages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Rotation & View Controls */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handleRotateLeft}
                    aria-label="Girar para esquerda"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handleRotateRight}
                    aria-label="Girar para direita"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    aria-label={isFullscreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Accessibility Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Contraste:</span>
                  <Button 
                    variant={contrastMode === "normal" ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setContrastMode("normal")}
                    aria-label="Contraste normal"
                    title="Normal"
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={contrastMode === "high" ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setContrastMode("high")}
                    aria-label="Alto contraste"
                    title="Alto Contraste"
                  >
                    <Contrast className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={contrastMode === "inverted" ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setContrastMode("inverted")}
                    aria-label="Cores invertidas"
                    title="Invertido"
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDF Preview Area */}
          <Card className={`${isFullscreen ? "min-h-[calc(100vh-300px)]" : "min-h-[500px]"} overflow-hidden`}>
            <CardContent className="p-0 h-full flex items-center justify-center bg-muted/30">
              <div 
                className={`transition-all duration-300 ${getContrastStyle()}`}
                style={{ 
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "center center"
                }}
              >
                {/* Simulated PDF Page */}
                <div className="w-[595px] bg-background shadow-lg border border-border p-12 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2 border-b border-border pb-6">
                    <div className="h-12 w-32 bg-muted rounded mx-auto" />
                    <div className="h-4 w-48 bg-muted rounded mx-auto" />
                  </div>
                  
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-muted/80 rounded" />
                    <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  </div>

                  {/* Content lines */}
                  <div className="space-y-3">
                    {[...Array(15)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-3 bg-muted/50 rounded ${i % 4 === 3 ? "w-3/4" : "w-full"}`}
                      />
                    ))}
                  </div>

                  {/* Signature area */}
                  <div className="pt-8 flex justify-end">
                    <div className="text-right space-y-2">
                      <div className="h-16 w-32 border border-dashed border-muted-foreground/30 rounded" />
                      <div className="h-3 w-28 bg-muted/60 rounded" />
                      <div className="h-3 w-24 bg-muted/40 rounded" />
                    </div>
                  </div>

                  {/* Page number */}
                  <div className="text-center pt-4 text-sm text-muted-foreground">
                    Página {currentPage} de {documentData.pages}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Actions */}
        {!isFullscreen && (
          <div className="lg:col-span-3 space-y-4">
            {/* Primary Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="default">
                  <Download className="h-4 w-4 mr-3" />
                  Download
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Printer className="h-4 w-4 mr-3" />
                  Imprimir
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Copy className="h-4 w-4 mr-3" />
                  Copiar Link
                </Button>
                <Separator className="my-3" />
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="h-4 w-4 mr-3" />
                  Compartilhar Interno
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FolderPlus className="h-4 w-4 mr-3" />
                  Adicionar a Processo
                </Button>
                <Separator className="my-3" />
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowTagModal(!showTagModal)}
                >
                  <Tag className="h-4 w-4 mr-3" />
                  Adicionar Tag
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-3" />
                  Reclassificar
                </Button>
              </CardContent>
            </Card>

            {/* Tag Modal */}
            {showTagModal && (
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Gerenciar Tags</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => setShowTagModal(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Nova tag..." className="h-8 text-sm" />
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => setShowTagModal(false)}>
                    Salvar Tags
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Document Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Estado do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="warning">{documentData.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Atualizado: {documentData.modified}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Links Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={`/documents/${documentData.id}`}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
                <Link to="/documents">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar para Lista
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Panel - Version History & Audit Log */}
      <div className="mt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowBottomPanel(!showBottomPanel)}
          className="mb-2"
        >
          {showBottomPanel ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronUp className="h-4 w-4 mr-2" />}
          {showBottomPanel ? "Ocultar" : "Mostrar"} Histórico
        </Button>

        {showBottomPanel && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Version History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico de Versões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div 
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        version.current ? "border-primary bg-primary-muted" : "border-border"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        version.current ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {version.version}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{version.action}</span>
                          {version.current && <Badge variant="info" className="text-xs">Atual</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {version.author} • {version.date}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audit Log */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Registro de Auditoria
                  </CardTitle>
                  <Link to="/audit-logs">
                    <Button variant="link" size="sm" className="text-xs h-auto p-0">
                      Ver completo
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLog.map((entry, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">{entry.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{entry.date}</p>
                        <p className="text-xs font-mono text-muted-foreground">{entry.ip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentViewer;
