import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import type { KPIStats, TimeSeriesData, DocumentTypeData, UnitData, PerformerData } from "@/hooks/useReportsData";

interface ExportData {
  kpiStats?: KPIStats;
  processesTimeSeries?: TimeSeriesData[];
  documentsByType?: DocumentTypeData[];
  processesByUnit?: UnitData[];
  topPerformers?: PerformerData[];
  dateFrom: Date;
  dateTo: Date;
}

interface ExportReportButtonProps {
  data: ExportData;
}

export const ExportReportButton = ({ data }: ExportReportButtonProps) => {
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null);

  const exportToPDF = async () => {
    setIsExporting("pdf");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Gestão Documental", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Período: ${format(data.dateFrom, "dd/MM/yyyy")} - ${format(data.dateTo, "dd/MM/yyyy")}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      
      yPos += 5;
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}`, pageWidth / 2, yPos, { align: "center" });

      yPos += 15;

      // KPI Stats
      if (data.kpiStats) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Indicadores Principais", 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        const kpis = [
          ["Total de Documentos", data.kpiStats.totalDocuments.toString(), `${data.kpiStats.documentsChange > 0 ? "+" : ""}${data.kpiStats.documentsChange}%`],
          ["Total de Processos", data.kpiStats.totalProcesses.toString(), `${data.kpiStats.processesChange > 0 ? "+" : ""}${data.kpiStats.processesChange}%`],
          ["Total de Despachos", data.kpiStats.totalDispatches.toString(), `${data.kpiStats.dispatchesChange > 0 ? "+" : ""}${data.kpiStats.dispatchesChange}%`],
          ["Tempo Médio (dias)", data.kpiStats.avgProcessingTime.toString(), ""],
          ["SLA Compliance", `${data.kpiStats.slaCompliance}%`, ""],
          ["Aprovações Pendentes", data.kpiStats.pendingApprovals.toString(), ""],
        ];

        kpis.forEach((kpi, index) => {
          doc.text(`${kpi[0]}: ${kpi[1]} ${kpi[2]}`, 25, yPos + (index * 6));
        });

        yPos += 45;
      }

      // Documents by Type
      if (data.documentsByType && data.documentsByType.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Documentos por Tipo", 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        data.documentsByType.forEach((type, index) => {
          doc.text(`${type.name}: ${type.value}`, 25, yPos + (index * 6));
        });

        yPos += (data.documentsByType.length * 6) + 10;
      }

      // Top Performers
      if (data.topPerformers && data.topPerformers.length > 0) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Top Performers", 20, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Rank", 25, yPos);
        doc.text("Nome", 45, yPos);
        doc.text("Processos", 110, yPos);
        doc.text("Tempo Médio", 140, yPos);
        doc.text("SLA", 175, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        data.topPerformers.forEach((performer, index) => {
          doc.text(`${index + 1}`, 25, yPos);
          doc.text(performer.name, 45, yPos);
          doc.text(performer.processos.toString(), 115, yPos);
          doc.text(`${performer.avgDias} dias`, 145, yPos);
          doc.text(`${performer.sla}%`, 178, yPos);
          yPos += 6;
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `MINAGRIF - Sistema de Gestão Documental | Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`relatorio_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsExporting(null);
    }
  };

  const exportToExcel = async () => {
    setIsExporting("excel");
    try {
      // Create CSV content (Excel compatible)
      const lines: string[] = [];
      
      // Header info
      lines.push("RELATÓRIO DE GESTÃO DOCUMENTAL");
      lines.push(`Período: ${format(data.dateFrom, "dd/MM/yyyy")} - ${format(data.dateTo, "dd/MM/yyyy")}`);
      lines.push(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`);
      lines.push("");

      // KPI Stats
      if (data.kpiStats) {
        lines.push("INDICADORES PRINCIPAIS");
        lines.push("Indicador,Valor,Variação");
        lines.push(`Total de Documentos,${data.kpiStats.totalDocuments},${data.kpiStats.documentsChange}%`);
        lines.push(`Total de Processos,${data.kpiStats.totalProcesses},${data.kpiStats.processesChange}%`);
        lines.push(`Total de Despachos,${data.kpiStats.totalDispatches},${data.kpiStats.dispatchesChange}%`);
        lines.push(`Tempo Médio (dias),${data.kpiStats.avgProcessingTime},`);
        lines.push(`SLA Compliance,${data.kpiStats.slaCompliance}%,`);
        lines.push(`Aprovações Pendentes,${data.kpiStats.pendingApprovals},`);
        lines.push("");
      }

      // Documents by Type
      if (data.documentsByType && data.documentsByType.length > 0) {
        lines.push("DOCUMENTOS POR TIPO");
        lines.push("Tipo,Quantidade");
        data.documentsByType.forEach(type => {
          lines.push(`${type.name},${type.value}`);
        });
        lines.push("");
      }

      // Processes by Unit
      if (data.processesByUnit && data.processesByUnit.length > 0) {
        lines.push("PROCESSOS POR UNIDADE");
        lines.push("Unidade,Total,Concluídos,Pendentes");
        data.processesByUnit.forEach(unit => {
          lines.push(`${unit.unit},${unit.total},${unit.concluidos},${unit.pendentes}`);
        });
        lines.push("");
      }

      // Top Performers
      if (data.topPerformers && data.topPerformers.length > 0) {
        lines.push("TOP PERFORMERS");
        lines.push("Rank,Nome,Processos,Tempo Médio (dias),SLA (%)");
        data.topPerformers.forEach((performer, index) => {
          lines.push(`${index + 1},${performer.name},${performer.processos},${performer.avgDias},${performer.sla}`);
        });
        lines.push("");
      }

      // Processes Time Series
      if (data.processesTimeSeries && data.processesTimeSeries.length > 0) {
        lines.push("EVOLUÇÃO MENSAL DE PROCESSOS");
        lines.push("Mês,Criados,Concluídos");
        data.processesTimeSeries.forEach(month => {
          lines.push(`${month.month},${month.criados},${month.concluidos}`);
        });
      }

      // Create and download CSV
      const csvContent = "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Relatório Excel (CSV) exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Erro ao exportar Excel");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting === "pdf"}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} disabled={isExporting === "excel"}>
          <Table className="h-4 w-4 mr-2" />
          Exportar Excel (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
