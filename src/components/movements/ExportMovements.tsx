import { useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MovementWithDetails, actionTypeLabels } from "@/hooks/useMovements";
import { jsPDF } from "jspdf";

interface ExportMovementsProps {
  movements: MovementWithDetails[];
  isLoading?: boolean;
}

export function ExportMovements({ movements, isLoading }: ExportMovementsProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const exportToCSV = () => {
    setExporting("csv");
    try {
      const headers = [
        "Data/Hora",
        "Tipo de Acção",
        "Nº Documento",
        "Título Documento",
        "Prioridade",
        "Unidade Origem",
        "Unidade Destino",
        "Utilizador Destino",
        "Estado Leitura",
        "Despacho/Notas",
      ];

      const rows = movements.map((m) => [
        format(parseISO(m.created_at), "dd/MM/yyyy HH:mm"),
        actionTypeLabels[m.action_type] || m.action_type,
        m.document?.entry_number || "",
        m.document?.title || "",
        m.document?.priority || "",
        m.from_unit?.code || "",
        m.to_unit?.code || "",
        m.to_user?.full_name || "",
        m.is_read ? "Lido" : "Pendente",
        (m.dispatch_text || m.notes || "").replace(/"/g, '""'),
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(";")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `movimentacoes_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success("Ficheiro CSV exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Movimentações", margin, 20);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(
        `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: pt })} | Total: ${movements.length} movimentações`,
        margin,
        28
      );

      // Table headers
      const headers = ["Data/Hora", "Tipo", "Documento", "Origem", "Destino", "Estado"];
      const colWidths = [35, 30, 70, 40, 50, 25];
      let y = 40;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);

      let x = margin;
      headers.forEach((header, i) => {
        doc.text(header, x + 2, y);
        x += colWidths[i];
      });

      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      // Table rows
      movements.forEach((m, index) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 8, "F");
        }

        x = margin;
        const row = [
          format(parseISO(m.created_at), "dd/MM/yy HH:mm"),
          actionTypeLabels[m.action_type] || m.action_type,
          `${m.document?.entry_number || ""} - ${(m.document?.title || "").substring(0, 30)}`,
          m.from_unit?.code || "-",
          `${m.to_unit?.code || ""} ${m.to_user?.full_name || ""}`.trim() || "-",
          m.is_read ? "Lido" : "Pendente",
        ];

        row.forEach((cell, i) => {
          const text = cell.substring(0, colWidths[i] / 2);
          doc.text(text, x + 2, y);
          x += colWidths[i];
        });

        y += 8;
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - margin - 20,
          pageHeight - 10
        );
      }

      doc.save(`movimentacoes_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
      toast.success("Ficheiro PDF exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading || !movements?.length}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={exporting !== null}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={exporting !== null}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
