import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { RepositoryDocument } from "@/hooks/useRepository";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  in_progress: "Em Tratamento",
  completed: "Concluído",
  archived: "Arquivado",
  cancelled: "Cancelado",
};

interface ExportRepositoryProps {
  documents: RepositoryDocument[];
  isLoading?: boolean;
  classificationName?: string;
}

export function ExportRepository({
  documents,
  isLoading,
  classificationName,
}: ExportRepositoryProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    if (documents.length === 0) {
      toast.error("Não há documentos para exportar");
      return;
    }

    setExporting(true);

    try {
      const headers = [
        "Nº Entrada",
        "Título",
        "Tipo",
        "Classificação",
        "Estado",
        "Prioridade",
        "Data Criação",
        "Criado por",
      ];

      const rows = documents.map((doc) => [
        doc.entry_number,
        doc.title,
        doc.document_type?.name || "-",
        doc.classification_code?.code || "-",
        statusLabels[doc.status] || doc.status,
        doc.priority,
        format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: pt }),
        doc.created_by_profile?.full_name || "-",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `repositorio_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Ficheiro CSV exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar ficheiro CSV");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    if (documents.length === 0) {
      toast.error("Não há documentos para exportar");
      return;
    }

    setExporting(true);

    try {
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Header
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Relatório do Repositório Documental", margin, y);
      y += 8;

      if (classificationName) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Classificação: ${classificationName}`, margin, y);
        y += 6;
      }

      pdf.setFontSize(9);
      pdf.text(
        `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", {
          locale: pt,
        })}`,
        margin,
        y
      );
      y += 10;

      // Table headers
      const columns = [
        { header: "Nº Entrada", width: 35 },
        { header: "Título", width: 80 },
        { header: "Classificação", width: 30 },
        { header: "Estado", width: 25 },
        { header: "Data", width: 25 },
        { header: "Criado por", width: 50 },
      ];

      const startX = margin;
      let x = startX;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(startX, y - 4, pageWidth - margin * 2, 8, "F");

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      columns.forEach((col) => {
        pdf.text(col.header, x, y);
        x += col.width;
      });
      y += 8;

      // Table rows
      pdf.setFont("helvetica", "normal");
      documents.forEach((doc, index) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;

          // Repeat header on new page
          x = startX;
          pdf.setFillColor(240, 240, 240);
          pdf.rect(startX, y - 4, pageWidth - margin * 2, 8, "F");
          pdf.setFont("helvetica", "bold");
          columns.forEach((col) => {
            pdf.text(col.header, x, y);
            x += col.width;
          });
          y += 8;
          pdf.setFont("helvetica", "normal");
        }

        x = startX;
        const row = [
          doc.entry_number,
          doc.title.substring(0, 45) + (doc.title.length > 45 ? "..." : ""),
          doc.classification_code?.code || "-",
          statusLabels[doc.status] || doc.status,
          format(new Date(doc.created_at), "dd/MM/yyyy", { locale: pt }),
          doc.created_by_profile?.full_name?.substring(0, 25) || "-",
        ];

        row.forEach((cell, colIndex) => {
          pdf.text(cell, x, y);
          x += columns[colIndex].width;
        });

        y += 6;
      });

      // Footer
      y += 10;
      pdf.setFontSize(8);
      pdf.text(`Total: ${documents.length} documento(s)`, margin, y);

      pdf.save(`repositorio_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
      toast.success("Ficheiro PDF exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar ficheiro PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading || exporting}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
