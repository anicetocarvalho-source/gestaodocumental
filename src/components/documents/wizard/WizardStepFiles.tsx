import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WizardStepFilesProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function WizardStepFiles({
  uploadedFiles,
  setUploadedFiles,
  isDragging,
  setIsDragging,
  isSubmitting,
}: WizardStepFilesProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} ficheiro${files.length > 1 ? "s" : ""} adicionado${files.length > 1 ? "s" : ""}`);
    }
  }, [setIsDragging, setUploadedFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} ficheiro${fileArray.length > 1 ? "s" : ""} adicionado${fileArray.length > 1 ? "s" : ""}`);
    }
    e.target.value = "";
  }, [setUploadedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, [setUploadedFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload de Ficheiros
        </CardTitle>
        <CardDescription>
          Adicione os ficheiros associados ao documento (opcional). A IA analisará o conteúdo para sugerir classificações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            disabled={isSubmitting}
            aria-label="Seleccionar ficheiros"
          />
          <div className="space-y-3">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Arraste e solte ficheiros aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para seleccionar</p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 20MB por ficheiro)
            </p>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg"
              >
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {index === 0 ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <File className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
