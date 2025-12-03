import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadModal } from "@/components/documents/UploadModal";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  Grid3X3, 
  List,
  MoreVertical,
  Download,
  Eye,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const documents = [
  { id: 1, name: "Annual Budget Report 2024", type: "PDF", size: "2.4 MB", status: "approved", date: "Dec 1, 2024", author: "Sarah Johnson" },
  { id: 2, name: "Infrastructure Development Plan", type: "DOCX", size: "1.8 MB", status: "pending", date: "Nov 28, 2024", author: "Michael Chen" },
  { id: 3, name: "Environmental Impact Assessment", type: "PDF", size: "5.2 MB", status: "in-progress", date: "Nov 25, 2024", author: "Emma Wilson" },
  { id: 4, name: "Public Health Initiative Proposal", type: "DOCX", size: "890 KB", status: "draft", date: "Nov 22, 2024", author: "David Brown" },
  { id: 5, name: "Transportation Policy Amendment", type: "PDF", size: "1.2 MB", status: "rejected", date: "Nov 20, 2024", author: "Lisa Anderson" },
  { id: 6, name: "Education Reform Guidelines", type: "PDF", size: "3.1 MB", status: "approved", date: "Nov 18, 2024", author: "James Wilson" },
  { id: 7, name: "Tax Revenue Analysis Q3", type: "XLSX", size: "756 KB", status: "approved", date: "Nov 15, 2024", author: "Maria Garcia" },
  { id: 8, name: "Emergency Response Protocol", type: "PDF", size: "2.8 MB", status: "pending", date: "Nov 12, 2024", author: "Robert Taylor" },
];

const statusMap: Record<string, "approved" | "pending" | "in-progress" | "draft" | "rejected"> = {
  approved: "approved",
  pending: "pending",
  "in-progress": "in-progress",
  draft: "draft",
  rejected: "rejected",
};

const Documents = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <DashboardLayout 
      title="Documents" 
      subtitle="Manage and organize all your documents"
    >
      <PageBreadcrumb items={[{ label: "Documents" }]} />

      {/* Toolbar */}
      <Card variant="toolbar" className="mb-6">
        <CardContent className="py-3">
          <div className="toolbar">
            <div className="toolbar-actions">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search documents..." 
                  className="pl-10 h-9"
                />
              </div>
              <Button variant="outline" size="icon-sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="toolbar-buttons">
              <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
                <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7 bg-background shadow-sm">
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button size="sm" asChild>
                <Link to="/documents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Documento
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input type="checkbox" className="rounded border-border" />
                  </th>
                  <th>Document</th>
                  <th className="w-20">Type</th>
                  <th className="w-24">Size</th>
                  <th className="w-28">Status</th>
                  <th className="w-36">Author</th>
                  <th className="w-28">Date</th>
                  <th className="w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <input type="checkbox" className="rounded border-border" />
                    </td>
                    <td>
                      <Link to={`/documents/${doc.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{doc.name}</span>
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{doc.type}</td>
                    <td className="text-muted-foreground">{doc.size}</td>
                    <td>
                      <Badge variant={statusMap[doc.status]}>
                        {doc.status.replace("-", " ")}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground">{doc.author}</td>
                    <td className="text-muted-foreground">{doc.date}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to={`/documents/${doc.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-error focus:text-error">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-8 of 156 documents
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="default" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>

      {/* Audit Log Reference */}
      <div className="mt-6">
        <AuditLogReference context="View document activity history" />
      </div>

      {/* Upload Modal */}
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </DashboardLayout>
  );
};

export default Documents;
