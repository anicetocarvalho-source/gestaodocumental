import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  name: string;
  size: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Simulate file upload
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = droppedFiles.map(f => ({
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      progress: 0,
      status: "uploading" as const,
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload progress
    newFiles.forEach((_, index) => {
      const interval = setInterval(() => {
        setFiles(prev => prev.map((f, i) => {
          if (i === prev.length - newFiles.length + index && f.progress < 100) {
            const newProgress = Math.min(f.progress + Math.random() * 30, 100);
            return {
              ...f,
              progress: newProgress,
              status: newProgress >= 100 ? "complete" : "uploading",
            };
          }
          return f;
        }));
      }, 500);
      
      setTimeout(() => clearInterval(interval), 5000);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles: UploadedFile[] = selectedFiles.map(f => ({
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
        progress: 100,
        status: "complete" as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Drag and drop files or click to browse. Supported formats: PDF, DOCX, XLSX.
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? "border-primary bg-primary-muted" 
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum file size: 25MB
              </p>
            </div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.xlsx,.doc,.xls"
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-3 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
              >
                <div className="h-10 w-10 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} size="sm" className="flex-1 max-w-24" />
                    )}
                    {file.status === "complete" && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <Check className="h-3 w-3" /> Complete
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleClose}
            disabled={files.length === 0 || files.some(f => f.status === "uploading")}
          >
            Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
