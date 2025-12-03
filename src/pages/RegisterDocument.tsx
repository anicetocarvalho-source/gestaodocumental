import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  FileText, 
  Upload, 
  X, 
  Save, 
  Send, 
  Sparkles,
  Eye,
  File,
  Trash2,
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const documentTypes = [
  "Ofício",
  "Memorando",
  "Relatório",
  "Parecer",
  "Despacho",
  "Portaria",
  "Resolução",
  "Edital",
  "Contrato",
  "Convênio",
];

const origins = [
  "Secretaria de Finanças",
  "Secretaria de Educação",
  "Secretaria de Saúde",
  "Secretaria de Obras",
  "Gabinete do Prefeito",
  "Câmara Municipal",
  "Tribunal de Contas",
  "Ministério Público",
  "Externo - Cidadão",
  "Externo - Empresa",
];

const suggestedTags = [
  { label: "Orçamento", confidence: 95 },
  { label: "Financeiro", confidence: 88 },
  { label: "Licitação", confidence: 75 },
  { label: "Contratos", confidence: 70 },
  { label: "Urgente", confidence: 65 },
];

const RegisterDocument = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    entryNumber: "",
    type: "",
    origin: "",
    subject: "",
    description: "",
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
      toast({
        title: "Arquivo carregado",
        description: `${files[0].name} foi adicionado com sucesso.`,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
      toast({
        title: "Arquivo carregado",
        description: `${files[0].name} foi adicionado com sucesso.`,
      });
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleSave = () => {
    toast({
      title: "Documento salvo",
      description: "O documento foi salvo como rascunho.",
    });
  };

  const handleSend = () => {
    toast({
      title: "Documento enviado",
      description: "O documento foi enviado para a unidade de destino.",
    });
    navigate("/documents");
  };

  const handleCancel = () => {
    navigate("/documents");
  };

  return (
    <DashboardLayout 
      title="Registrar Novo Documento" 
      subtitle="Cadastre um novo documento no sistema"
    >
      <PageBreadcrumb 
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Registrar Novo Documento" }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Document Metadata Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                Dados do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Entry Number */}
              <div className="space-y-2">
                <Label htmlFor="entryNumber">Nº de Entrada *</Label>
                <Input 
                  id="entryNumber"
                  placeholder="Ex: DOC-2024-001234"
                  value={formData.entryNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryNumber: e.target.value }))}
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Documento *</Label>
                <select
                  id="type"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">Selecione o tipo</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origem *</Label>
                <select
                  id="origin"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.origin}
                  onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                >
                  <option value="">Selecione a origem</option>
                  {origins.map((origin) => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input 
                  id="subject"
                  placeholder="Informe o assunto do documento"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  className="w-full h-32 px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Descreva o conteúdo e contexto do documento..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags Selecionadas</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" aria-hidden="true" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              Salvar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSend}
            >
              <Send className="h-4 w-4 mr-2" aria-hidden="true" />
              Enviar para Unidade
            </Button>
          </div>

          {/* Audit Log Reference */}
          <AuditLogReference context="Ver histórico de registros" />
        </div>

        {/* Right Panel - Upload and Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
                Upload de Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary-muted' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  aria-label="Selecionar arquivo"
                />
                <div className="space-y-3">
                  <div className="h-14 w-14 bg-primary-muted rounded-full flex items-center justify-center mx-auto">
                    <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arraste e solte o arquivo aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou clique para selecionar
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 10MB)
                  </p>
                </div>
              </div>

              {/* Uploaded File */}
              {uploadedFile && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-success-muted border border-success/20 rounded-lg">
                  <div className="h-10 w-10 bg-success/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => setUploadedFile(null)}
                    aria-label="Remover arquivo"
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
                  Prévia do Documento
                </CardTitle>
                {uploadedFile && (
                  <Button variant="outline" size="sm">
                    Visualizar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted border border-border rounded-lg flex items-center justify-center">
                {uploadedFile ? (
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 bg-primary-muted rounded-lg flex items-center justify-center mx-auto">
                      <File className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique em "Visualizar" para abrir o documento
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <File className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento carregado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Tag Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" aria-hidden="true" />
                  Sugestões de Tags (IA)
                </CardTitle>
                <Badge variant="warning" className="text-xs">
                  Assistido por IA
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Com base no conteúdo do documento, sugerimos as seguintes tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleTagToggle(tag.label)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      selectedTags.includes(tag.label)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    <span>{tag.label}</span>
                    <span className={`text-xs ${
                      selectedTags.includes(tag.label) 
                        ? 'text-primary-foreground/80' 
                        : 'text-muted-foreground'
                    }`}>
                      {tag.confidence}%
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Clique nas tags para adicioná-las ao documento. A porcentagem indica a confiança da sugestão.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterDocument;
