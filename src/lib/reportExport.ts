import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface ReportExportOptions {
  title: string;
  subtitle?: string;
  filters?: string[];
  columns: string[];
  rows: (string | number | null | undefined)[][];
  fileName: string;
  orientation?: "portrait" | "landscape";
}

const cell = (v: string | number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

export function exportReportCsv({ title, filters, columns, rows, fileName }: ReportExportOptions) {
  const meta: string[][] = [
    [title],
    [`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`],
  ];
  if (filters?.length) meta.push([`Filtros: ${filters.join(" | ")}`]);
  meta.push([]);

  const all = [...meta, columns, ...rows.map((r) => r.map(cell))];
  const csv = all
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportPdf({
  title,
  subtitle,
  filters,
  columns,
  rows,
  fileName,
  orientation = "landscape",
}: ReportExportOptions) {
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text("NODIDOC — Gestão Documental", 40, 40);
  doc.setFontSize(12);
  doc.text(title, 40, 60);

  doc.setFontSize(9);
  doc.setTextColor(110);
  let y = 76;
  if (subtitle) {
    doc.text(subtitle, 40, y);
    y += 12;
  }
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")} · ${rows.length} registo(s)`, 40, y);
  y += 12;
  if (filters?.length) {
    const lines = doc.splitTextToSize(`Filtros: ${filters.join(" | ")}`, pageWidth - 80) as string[];
    doc.text(lines, 40, y);
    y += lines.length * 11;
  }
  doc.setTextColor(0);

  autoTable(doc, {
    startY: y + 6,
    head: [columns],
    body: rows.map((r) => r.map(cell)),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [17, 94, 89], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 246, 246] },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      `Página ${i} de ${pages}`,
      pageWidth - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" }
    );
  }

  doc.save(`${fileName}-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
}
