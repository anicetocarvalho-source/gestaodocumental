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
  { icon: FilePlus, label: "New Document", description: "Create a new document" },
  { icon: Upload, label: "Upload File", description: "Upload from computer" },
  { icon: ClipboardPlus, label: "Start Process", description: "Initiate new workflow" },
  { icon: FolderPlus, label: "New Folder", description: "Organize documents" },
  { icon: FileSearch, label: "Search Files", description: "Find documents" },
  { icon: FileSignature, label: "Request Signature", description: "Get approvals" },
  { icon: UserPlus, label: "Add User", description: "Invite team member" },
  { icon: Send, label: "Send Report", description: "Share with stakeholders" },
];

export function QuickActions() {
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
