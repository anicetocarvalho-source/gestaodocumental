import { FileText, MoreVertical, Download, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const documents = [
  {
    id: 1,
    name: "Annual Budget Report 2024",
    type: "PDF",
    status: "approved",
    date: "Dec 1, 2024",
    author: "Sarah Johnson",
  },
  {
    id: 2,
    name: "Infrastructure Development Plan",
    type: "DOCX",
    status: "pending",
    date: "Nov 28, 2024",
    author: "Michael Chen",
  },
  {
    id: 3,
    name: "Environmental Impact Assessment",
    type: "PDF",
    status: "in-progress",
    date: "Nov 25, 2024",
    author: "Emma Wilson",
  },
  {
    id: 4,
    name: "Public Health Initiative Proposal",
    type: "DOCX",
    status: "draft",
    date: "Nov 22, 2024",
    author: "David Brown",
  },
  {
    id: 5,
    name: "Transportation Policy Amendment",
    type: "PDF",
    status: "rejected",
    date: "Nov 20, 2024",
    author: "Lisa Anderson",
  },
];

const statusMap: Record<string, "approved" | "pending" | "in-progress" | "draft" | "rejected"> = {
  approved: "approved",
  pending: "pending",
  "in-progress": "in-progress",
  draft: "draft",
  rejected: "rejected",
};

export function RecentDocuments() {
  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Recent Documents</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header border-b border-border">
                <th className="px-6 py-3 text-left">Document</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Author</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{doc.name}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-muted-foreground">{doc.type}</span>
                  </td>
                  <td className="table-cell">
                    <Badge variant={statusMap[doc.status]}>
                      {doc.status.replace("-", " ")}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <span className="text-muted-foreground">{doc.author}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-muted-foreground">{doc.date}</span>
                  </td>
                  <td className="table-cell text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-error focus:text-error">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
  );
}
