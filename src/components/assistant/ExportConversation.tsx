import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File, Loader2 } from "lucide-react";
import { Message } from "@/hooks/useConversations";
import { toast } from "sonner";
import jsPDF from "jspdf";

type Props = {
  messages: Message[];
  conversationTitle?: string;
};

export function ExportConversation({ messages, conversationTitle }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportAsText = () => {
    const title = conversationTitle || "Conversa com Assistente NODIDOC";
    const date = new Date().toLocaleDateString("pt-PT");
    
    let content = `${title}\n`;
    content += `Exportado em: ${date}\n`;
    content += `${"=".repeat(50)}\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === "user" ? "Utilizador" : "Assistente";
      const time = formatDate(msg.created_at);
      content += `[${time}] ${role}:\n`;
      content += `${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-nodidoc-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Conversa exportada como texto");
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const title = conversationTitle || "Conversa com Assistente MINAGRIF";
      const date = new Date().toLocaleDateString("pt-PT");
      
      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Exportado em: ${date}`, 20, 28);
      
      doc.setDrawColor(200);
      doc.line(20, 32, 190, 32);
      
      let yPosition = 42;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      messages.forEach((msg) => {
        const role = msg.role === "user" ? "Utilizador" : "Assistente";
        const time = formatDate(msg.created_at);
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Role header
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(msg.role === "user" ? 0 : 59, msg.role === "user" ? 100 : 130, msg.role === "user" ? 0 : 246);
        doc.text(`${role} - ${time}`, margin, yPosition);
        yPosition += 6;

        // Content
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        
        const lines = doc.splitTextToSize(msg.content, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });
        
        yPosition += 8;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Sistema MINAGRIF - Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      doc.save(`conversa-nodidoc-${Date.now()}.pdf`);
      toast.success("Conversa exportada como PDF");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar como PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsText}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como Texto (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          <File className="h-4 w-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
