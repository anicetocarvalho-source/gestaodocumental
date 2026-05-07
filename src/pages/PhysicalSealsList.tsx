import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Stamp, Loader2 } from "lucide-react";
import { usePhysicalSeals } from "@/hooks/usePhysicalSeals";

export default function PhysicalSealsList() {
  const { data: seals = [], isLoading } = usePhysicalSeals();

  return (
    <DashboardLayout title="Selos Físicos" subtitle="Selos de rastreabilidade emitidos">
      <PageBreadcrumb items={[{ label: "Documentos", href: "/documents" }, { label: "Selos Físicos" }]} />

      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link to="/physical-seals/new"><Plus className="h-4 w-4 mr-2" /> Novo Selo</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar...
            </div>
          ) : seals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Stamp className="h-10 w-10 opacity-50" />
              <p>Ainda não há selos registados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seals.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.protocol_number}</TableCell>
                    <TableCell><Badge variant="outline">{s.protocol_type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{s.document_title}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>
                        {s.status === "active" ? "Activo" : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString("pt-PT")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/physical-seals/${s.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
