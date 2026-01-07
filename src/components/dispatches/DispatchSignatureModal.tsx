import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Eraser, Check } from "lucide-react";

interface DispatchSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispatchNumber: string;
  onSign: (type: "digital" | "manuscrita", signatureData?: string) => Promise<void>;
  isLoading?: boolean;
}

export function DispatchSignatureModal({
  open,
  onOpenChange,
  dispatchNumber,
  onSign,
  isLoading,
}: DispatchSignatureModalProps) {
  const [signatureType, setSignatureType] = useState<"digital" | "manuscrita">("digital");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (signatureType === "manuscrita" && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = "#1a1a1a";
        context.lineWidth = 2;
        contextRef.current = context;
        
        // Fill with white background
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [signatureType, open]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    contextRef.current.fillStyle = "#ffffff";
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (signatureType === "manuscrita" && canvasRef.current) {
      const signatureData = canvasRef.current.toDataURL("image/png");
      await onSign("manuscrita", signatureData);
    } else {
      await onSign("digital");
    }
    onOpenChange(false);
  };

  const handleClose = () => {
    setSignatureType("digital");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinar Despacho</DialogTitle>
          <DialogDescription>
            Assinar digitalmente o despacho {dispatchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Tipo de Assinatura</Label>
            <RadioGroup
              value={signatureType}
              onValueChange={(v) => setSignatureType(v as "digital" | "manuscrita")}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="digital" id="digital" />
                <Label htmlFor="digital" className="font-normal cursor-pointer">
                  Digital (automática)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manuscrita" id="manuscrita" />
                <Label htmlFor="manuscrita" className="font-normal cursor-pointer">
                  Manuscrita
                </Label>
              </div>
            </RadioGroup>
          </div>

          {signatureType === "manuscrita" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Desenhe a sua assinatura</Label>
                <Button variant="ghost" size="sm" onClick={clearCanvas}>
                  <Eraser className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use o rato ou o dedo para desenhar a sua assinatura
              </p>
            </div>
          )}

          {signatureType === "digital" && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                A assinatura digital será gerada automaticamente com os seus dados de autenticação.
                Esta assinatura tem validade legal e será registada com timestamp.
              </p>
            </div>
          )}

          <div className="p-4 border border-warning/50 bg-warning/10 rounded-lg">
            <p className="text-sm text-warning-foreground">
              <strong>Atenção:</strong> Ao assinar este despacho, você confirma que leu e concorda
              com o seu conteúdo. Esta acção não pode ser desfeita.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSign} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Assinar Despacho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
