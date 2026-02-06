import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import type { DashboardStats, DocumentsByUnit, DocumentsByType, DocumentsByClassification } from "@/hooks/useDashboardStats";

interface DashboardExportData {
  stats?: DashboardStats;
  documentsByUnit?: DocumentsByUnit[];
  documentsByType?: DocumentsByType[];
  documentsByClassification?: DocumentsByClassification[];
  dateFrom: string;
  dateTo: string;
}

export function exportDashboardPDF(data: DashboardExportData) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Institucional", pageWidth / 2, yPos, { align: "center" });

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${data.dateFrom} - ${data.dateTo}`, pageWidth / 2, yPos, { align: "center" });

    yPos += 5;
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}`, pageWidth / 2, yPos, { align: "center" });

    yPos += 15;

    // KPIs
    if (data.stats) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores Principais", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const kpis = [
        ["Total de Documentos", String(data.stats.totalDocuments)],
        ["Documentos Pendentes", String(data.stats.pendingDocuments)],
        ["Documentos Urgentes", String(data.stats.urgentDocuments)],
        ["Processados este mês", String(data.stats.processedThisMonth)],
        ["Conformidade SLA", `${data.stats.slaCompliance}%`],
      ];

      kpis.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 25, yPos);
        yPos += 6;
      });

      yPos += 8;
    }

    // By Unit
    if (data.documentsByUnit?.length) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Documentos por Unidade", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      data.documentsByUnit.forEach((u) => {
        doc.text(`${u.unidade}: ${u.total}`, 25, yPos);
        yPos += 6;
      });

      yPos += 8;
    }

    // By Type
    if (data.documentsByType?.length) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Documentos por Tipo", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      data.documentsByType.forEach((t) => {
        doc.text(`${t.name}: ${t.value}`, 25, yPos);
        yPos += 6;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `MINAGRIF - Dashboard | Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`dashboard_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
    toast.success("Dashboard exportado em PDF!");
  } catch (error) {
    console.error("Error exporting dashboard PDF:", error);
    toast.error("Erro ao exportar PDF");
  }
}

export function exportDashboardCSV(data: DashboardExportData) {
  try {
    const lines: string[] = [];

    lines.push("DASHBOARD INSTITUCIONAL");
    lines.push(`Período: ${data.dateFrom} - ${data.dateTo}`);
    lines.push(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`);
    lines.push("");

    if (data.stats) {
      lines.push("INDICADORES PRINCIPAIS");
      lines.push("Indicador,Valor");
      lines.push(`Total de Documentos,${data.stats.totalDocuments}`);
      lines.push(`Documentos Pendentes,${data.stats.pendingDocuments}`);
      lines.push(`Documentos Urgentes,${data.stats.urgentDocuments}`);
      lines.push(`Processados este mês,${data.stats.processedThisMonth}`);
      lines.push(`Conformidade SLA,${data.stats.slaCompliance}%`);
      lines.push("");
    }

    if (data.documentsByUnit?.length) {
      lines.push("DOCUMENTOS POR UNIDADE");
      lines.push("Unidade,Total");
      data.documentsByUnit.forEach((u) => lines.push(`${u.unidade},${u.total}`));
      lines.push("");
    }

    if (data.documentsByType?.length) {
      lines.push("DOCUMENTOS POR TIPO");
      lines.push("Tipo,Quantidade");
      data.documentsByType.forEach((t) => lines.push(`${t.name},${t.value}`));
      lines.push("");
    }

    if (data.documentsByClassification?.length) {
      lines.push("DOCUMENTOS POR CLASSIFICAÇÃO");
      lines.push("Classificação,Quantidade");
      data.documentsByClassification.forEach((c) => lines.push(`${c.classificacao},${c.quantidade}`));
    }

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Dashboard exportado em CSV!");
  } catch (error) {
    console.error("Error exporting dashboard CSV:", error);
    toast.error("Erro ao exportar CSV");
  }
}
