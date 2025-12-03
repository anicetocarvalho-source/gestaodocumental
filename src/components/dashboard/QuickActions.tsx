import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FilePlus, 
  FolderPlus, 
  Upload, 
  ClipboardPlus, 
  UserPlus, 
  FileSearch,
  FileSignature,
  Send
} from "lucide-react";

const actions = [
  { icon: FilePlus, label: "New Document", description: "Create a new document", href: "/documents/new" },
  { icon: Upload, label: "Upload File", description: "Upload from computer", href: "/documents", action: "upload" },
  { icon: ClipboardPlus, label: "Start Process", description: "Initiate new workflow", href: "/processes" },
  { icon: FolderPlus, label: "New Folder", description: "Organize documents", href: "/folders" },
  { icon: FileSearch, label: "Search Files", description: "Find documents", href: "/search" },
  { icon: FileSignature, label: "Request Signature", description: "Get approvals", href: "/approvals" },
  { icon: UserPlus, label: "Add User", description: "Invite team member", href: "/users" },
  { icon: Send, label: "Send Report", description: "Share with stakeholders", href: "/dispatches" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.href)}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-4 text-center transition-all hover:border-primary hover:bg-primary-muted hover:shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                <action.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
