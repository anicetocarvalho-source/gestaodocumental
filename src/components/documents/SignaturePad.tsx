import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Upload, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ 
  onSignatureChange, 
  width = 400, 
  height = 200 
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("draw");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSignature && canvasRef.current) {
      onSignatureChange?.(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    setUploadedImage(null);
    onSignatureChange?.(null);
  };

  const downloadSignature = () => {
    const dataUrl = activeTab === "upload" ? uploadedImage : canvasRef.current?.toDataURL("image/png");
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `assinatura-${new Date().toISOString().split("T")[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage(dataUrl);
      setHasSignature(true);
      onSignatureChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // When switching tabs, update the signature based on current content
    if (value === "upload" && uploadedImage) {
      onSignatureChange?.(uploadedImage);
    } else if (value === "draw" && canvasRef.current && hasSignature) {
      onSignatureChange?.(canvasRef.current.toDataURL("image/png"));
    }
  };

  const currentHasSignature = activeTab === "upload" ? !!uploadedImage : hasSignature;

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Desenhar
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Carregar Imagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-3">
          <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Desenhe a sua assinatura no campo acima
          </p>
        </TabsContent>

        <TabsContent value="upload" className="mt-3">
          <div 
            className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            {uploadedImage ? (
              <img 
                src={uploadedImage} 
                alt="Assinatura carregada" 
                className="max-h-full max-w-full object-contain p-4"
              />
            ) : (
              <div className="text-center p-6">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique para carregar uma imagem da sua assinatura
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG ou GIF (máx. 5MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ position: 'absolute' }}
            />
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="signature-upload"
            />
            <label 
              htmlFor="signature-upload"
              className="text-xs text-primary hover:underline cursor-pointer mt-2 inline-block"
            >
              {uploadedImage ? "Escolher outra imagem" : "Selecionar ficheiro"}
            </label>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!currentHasSignature}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Limpar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadSignature}
          disabled={!currentHasSignature}
        >
          <Download className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </div>
  );
}
