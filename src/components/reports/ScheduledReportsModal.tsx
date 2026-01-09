import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Mail,
  Trash2,
  Plus,
  FileText,
  Table,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  format: "pdf" | "csv";
  recipients: string[];
  enabled: boolean;
  lastSent?: string;
  nextSend?: string;
}

interface ScheduledReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock scheduled reports for demo
const mockScheduledReports: ScheduledReport[] = [
  {
    id: "1",
    name: "Relatório Semanal de Actividade",
    frequency: "weekly",
    format: "pdf",
    recipients: ["director@minagrif.gov.ao", "gestor@minagrif.gov.ao"],
    enabled: true,
    lastSent: "2026-01-06T08:00:00",
    nextSend: "2026-01-13T08:00:00",
  },
  {
    id: "2",
    name: "Resumo Mensal de Processos",
    frequency: "monthly",
    format: "csv",
    recipients: ["admin@minagrif.gov.ao"],
    enabled: true,
    lastSent: "2026-01-01T08:00:00",
    nextSend: "2026-02-01T08:00:00",
  },
];

export const ScheduledReportsModal = ({
  isOpen,
  onClose,
}: ScheduledReportsModalProps) => {
  const [reports, setReports] = useState<ScheduledReport[]>(mockScheduledReports);
  const [isCreating, setIsCreating] = useState(false);
  const [newReport, setNewReport] = useState({
    name: "",
    frequency: "weekly",
    format: "pdf" as "pdf" | "csv",
    recipients: "",
  });

  const frequencyLabels: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral",
  };

  const handleCreateReport = () => {
    if (!newReport.name || !newReport.recipients) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const report: ScheduledReport = {
      id: Date.now().toString(),
      name: newReport.name,
      frequency: newReport.frequency,
      format: newReport.format,
      recipients: newReport.recipients.split(",").map(e => e.trim()),
      enabled: true,
    };

    setReports([...reports, report]);
    setNewReport({ name: "", frequency: "weekly", format: "pdf", recipients: "" });
    setIsCreating(false);
    toast.success("Relatório agendado criado com sucesso!");
  };

  const handleToggleReport = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const handleDeleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success("Relatório agendado removido");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Relatórios Agendados
          </DialogTitle>
          <DialogDescription>
            Configure o envio automático de relatórios por email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing scheduled reports */}
          <ScrollArea className="h-[300px] pr-4">
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Nenhum relatório agendado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={report.enabled}
                        onCheckedChange={() => handleToggleReport(report.id)}
                      />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {frequencyLabels[report.frequency]}
                          </Badge>
                          <span className="flex items-center gap-1">
                            {report.format === "pdf" ? (
                              <FileText className="h-3 w-3" />
                            ) : (
                              <Table className="h-3 w-3" />
                            )}
                            {report.format.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.recipients.length} destinatário(s)
                          </span>
                        </div>
                        {report.nextSend && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Próximo envio: {new Date(report.nextSend).toLocaleDateString("pt-PT")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Create new scheduled report */}
          {isCreating ? (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Novo Relatório Agendado</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="report-name">Nome do Relatório</Label>
                  <Input
                    id="report-name"
                    placeholder="Ex: Relatório Semanal de Actividade"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={newReport.frequency}
                    onValueChange={(value) => setNewReport({ ...newReport, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select
                    value={newReport.format}
                    onValueChange={(value: "pdf" | "csv") => setNewReport({ ...newReport, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">Excel (CSV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
                  <Input
                    id="recipients"
                    placeholder="email1@exemplo.com, email2@exemplo.com"
                    value={newReport.recipients}
                    onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateReport}>
                  Criar Agendamento
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório Agendado
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
