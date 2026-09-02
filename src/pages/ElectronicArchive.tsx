import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Camera, CameraOff, Download, FileSearch, QrCode, ScanBarcode, Search, Tags, X } from "lucide-react";
import { IndexDocumentModal } from "@/components/ged/IndexDocumentModal";
import { useClassificationCodes } from "@/hooks/useReferenceData";
import { getGedDocumentUrl, useGedSearch, useGedStats, type GedDocument, type GedSearchFilters } from "@/hooks/useGedIndexing";

type Html5QrcodeInstance = {
  start: (
    camera: { facingMode: string },
    config: { fps: number; qrbox: number },
    onSuccess: (text: string) => void,
    onError: () => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

const emptyFilters: GedSearchFilters = {
  term: "",
  code: "",
  status: "all",
  classificationId: "all",
  indexed: "all",
  dateFrom: "",
  dateTo: "",
};

export default function ElectronicArchive() {
  const [draft, setDraft] = useState<GedSearchFilters>(emptyFilters);
  const [filters, setFilters] = useState<GedSearchFilters>(emptyFilters);
  const [selected, setSelected] = useState<GedDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useGedSearch(filters);
  const { data: stats } = useGedStats();
  const { data: classifications = [] } = useClassificationCodes({ activeOnly: true });

  const applyFilters = (override?: Partial<GedSearchFilters>) => {
    setFilters({ ...draft, ...override });
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* ignora */
      }
      scannerRef.current = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      setCameraOn(true);
      await new Promise((r) => setTimeout(r, 50));
      const scanner = new Html5Qrcode("ged-qr-reader") as unknown as Html5QrcodeInstance;
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          void stopCamera();
          setDraft((d) => ({ ...d, code: text }));
          applyFilters({ code: text });
        },
        () => {
          /* ignora falhas de frame */
        },
      );
    } catch {
      setCameraOn(false);
      toast.error("Não foi possível aceder à câmara. Utilize o leitor ou introduza o código.");
    }
  };

  useEffect(() => () => { void stopCamera(); }, []);

  const openFile = async (doc: GedDocument) => {
    if (!doc.file_path) {
      toast.error("Documento sem ficheiro associado");
      return;
    }
    const url = await getGedDocumentUrl(doc.file_path);
    if (!url) {
      toast.error("Não foi possível abrir o ficheiro");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardLayout
      title="Arquivo Electrónico (GED)"
      subtitle="Indexação e pesquisa de documentos digitalizados"
    >
      <div className="space-y-6">
        <PageBreadcrumb items={[{ label: "Digitalização", href: "/digitization" }, { label: "Arquivo Electrónico (GED)" }]} />


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Documentos digitalizados", value: stats?.total ?? 0, icon: FileSearch },
            { label: "Indexados", value: stats?.indexed ?? 0, icon: Tags },
            { label: "Com código", value: stats?.withCode ?? 0, icon: ScanBarcode },
            { label: "Com texto OCR", value: stats?.withOcr ?? 0, icon: Search },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-semibold">{s.value}</p>
                </div>
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <GedControlPanel
          onSelectStatus={(status) => {
            setDraft((d) => ({ ...d, status }));
            setFilters((f) => ({ ...f, status }));
          }}
          onSelectClassification={(classificationId) => {
            setDraft((d) => ({ ...d, classificationId }));
            setFilters((f) => ({ ...f, classificationId }));
          }}
          onSelectIndexing={(indexed) => {
            setDraft((d) => ({ ...d, indexed }));
            setFilters((f) => ({ ...f, indexed }));
          }}
        />



        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ged-code">Código de barras / QR</Label>
                <div className="flex gap-2">
                  <Input
                    id="ged-code"
                    ref={codeInputRef}
                    value={draft.code}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                    placeholder="Leia o código ou introduza manualmente"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => (cameraOn ? void stopCamera() : void startCamera())} aria-label="Câmara">
                    {cameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ged-term">Termo (título, OCR, remetente, referência)</Label>
                <Input
                  id="ged-term"
                  value={draft.term}
                  onChange={(e) => setDraft({ ...draft, term: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                  placeholder="Pesquisar no conteúdo indexado"
                />
              </div>
            </div>

            {cameraOn && <div id="ged-qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-md border" />}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="ocr_processing">OCR</SelectItem>
                    <SelectItem value="quality_review">Revisão</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Classificação</Label>
                <Select value={draft.classificationId} onValueChange={(v) => setDraft({ ...draft, classificationId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {classifications.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Indexação</Label>
                <Select value={draft.indexed} onValueChange={(v) => setDraft({ ...draft, indexed: v as GedSearchFilters["indexed"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="indexed">Indexados</SelectItem>
                    <SelectItem value="pending">Por indexar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="ged-from">De</Label>
                  <Input id="ged-from" type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ged-to">Até</Label>
                  <Input id="ged-to" type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => applyFilters()}>
                <Search className="mr-2 h-4 w-4" /> Pesquisar
              </Button>
              <Button variant="outline" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); }}>
                <X className="mr-2 h-4 w-4" /> Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultados ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Códigos</TableHead>
                    <TableHead>Metadados</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Indexação</TableHead>
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">A carregar...</TableCell></TableRow>
                  )}
                  {!isLoading && documents.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sem documentos para os filtros aplicados.</TableCell></TableRow>
                  )}
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="font-medium">{doc.title || "Sem título"}</div>
                        <div className="text-xs text-muted-foreground">{doc.document_number} · {doc.batch?.batch_number ?? "—"}</div>
                      </TableCell>
                      <TableCell className="space-y-1">
                        {doc.barcode && <div className="flex items-center gap-1 text-xs"><ScanBarcode className="h-3 w-3" />{doc.barcode}</div>}
                        {doc.qr_code && <div className="flex items-center gap-1 text-xs"><QrCode className="h-3 w-3" />{doc.qr_code}</div>}
                        {!doc.barcode && !doc.qr_code && <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{doc.sender || "—"}</div>
                        <div className="text-muted-foreground">{doc.document_date ?? "sem data"} · {doc.reference_number ?? "sem ref."}</div>
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {doc.keywords.slice(0, 3).map((k) => <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {doc.classification ? `${doc.classification.code} — ${doc.classification.name}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.indexed_at ? "default" : "outline"}>
                          {doc.indexed_at ? "Indexado" : "Por indexar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => void openFile(doc)} disabled={!doc.file_path}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => { setSelected(doc); setModalOpen(true); }}>
                            <Tags className="mr-2 h-4 w-4" /> Indexar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <IndexDocumentModal document={selected} open={modalOpen} onOpenChange={setModalOpen} />
    </DashboardLayout>
  );
}
