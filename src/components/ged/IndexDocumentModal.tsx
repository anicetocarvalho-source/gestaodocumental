import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, ScanBarcode } from "lucide-react";
import { useClassificationCodes } from "@/hooks/useReferenceData";
import { useIndexDocument, type GedDocument } from "@/hooks/useGedIndexing";

interface Props {
  document: GedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IndexDocumentModal({ document, open, onOpenChange }: Props) {
  const { data: classifications = [] } = useClassificationCodes({ activeOnly: true });
  const indexDocument = useIndexDocument();

  const [title, setTitle] = useState("");
  const [barcode, setBarcode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [reference, setReference] = useState("");
  const [sender, setSender] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [classificationId, setClassificationId] = useState("none");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    if (!document) return;
    setTitle(document.title ?? "");
    setBarcode(document.barcode ?? "");
    setQrCode(document.qr_code ?? "");
    setReference(document.reference_number ?? "");
    setSender(document.sender ?? "");
    setDocumentDate(document.document_date ?? "");
    setClassificationId(document.classification_id ?? "none");
    setKeywords(document.keywords ?? []);
    setKeywordInput("");
    setCustomFields(
      Object.entries(document.index_fields ?? {}).map(([key, value]) => ({ key, value: String(value) }))
    );
  }, [document]);

  const addKeyword = () => {
    const value = keywordInput.trim();
    if (!value || keywords.includes(value)) return;
    setKeywords([...keywords, value]);
    setKeywordInput("");
  };

  const generateBarcode = () => {
    if (!document) return;
    setBarcode(document.document_number);
    setQrCode(document.document_number);
  };

  const handleSave = async () => {
    if (!document) return;
    const index_fields = customFields.reduce<Record<string, string>>((acc, field) => {
      if (field.key.trim()) acc[field.key.trim()] = field.value;
      return acc;
    }, {});

    await indexDocument.mutateAsync({
      id: document.id,
      title: title.trim() || null,
      barcode,
      qr_code: qrCode,
      reference_number: reference,
      sender,
      document_date: documentDate || null,
      classification_id: classificationId === "none" ? null : classificationId,
      keywords,
      index_fields,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Indexar documento</DialogTitle>
          <DialogDescription>
            {document?.document_number} — preencha os campos pesquisáveis do arquivo electrónico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="ged-title">Título</Label>
            <Input id="ged-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ged-barcode">Código de barras</Label>
            <Input id="ged-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Leia ou escreva o código" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ged-qr">Código QR</Label>
            <Input id="ged-qr" value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Token do QR" />
          </div>

          <div className="sm:col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={generateBarcode}>
              <ScanBarcode className="mr-2 h-4 w-4" />
              Usar o número do documento como código
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ged-ref">Referência</Label>
            <Input id="ged-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ged-sender">Remetente / Origem</Label>
            <Input id="ged-sender" value={sender} onChange={(e) => setSender(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ged-date">Data do documento</Label>
            <Input id="ged-date" type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Classificação</Label>
            <Select value={classificationId} onValueChange={setClassificationId}>
              <SelectTrigger><SelectValue placeholder="Sem classificação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem classificação</SelectItem>
                {classifications.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="ged-keyword">Palavras-chave</Label>
            <div className="flex gap-2">
              <Input
                id="ged-keyword"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="Escreva e prima Enter"
              />
              <Button type="button" variant="outline" onClick={addKeyword}>Adicionar</Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1">
                    {kw}
                    <button type="button" onClick={() => setKeywords(keywords.filter((k) => k !== kw))} aria-label={`Remover ${kw}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Campos personalizados</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustomFields([...customFields, { key: "", value: "" }])}>
                <Plus className="mr-1 h-4 w-4" /> Campo
              </Button>
            </div>
            {customFields.map((field, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Nome"
                  value={field.key}
                  onChange={(e) => setCustomFields(customFields.map((f, idx) => idx === i ? { ...f, key: e.target.value } : f))}
                />
                <Input
                  placeholder="Valor"
                  value={field.value}
                  onChange={(e) => setCustomFields(customFields.map((f, idx) => idx === i ? { ...f, value: e.target.value } : f))}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setCustomFields(customFields.filter((_, idx) => idx !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={indexDocument.isPending}>
            {indexDocument.isPending ? "A guardar..." : "Guardar indexação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
