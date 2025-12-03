import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Pencil, 
  Share2, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Clock,
  User,
  Calendar,
  FolderOpen,
  Tag,
  Send
} from "lucide-react";

const documentInfo = {
  title: "Annual Budget Report 2024",
  type: "PDF",
  size: "2.4 MB",
  status: "approved",
  author: "Sarah Johnson",
  department: "Finance",
  created: "Nov 15, 2024",
  modified: "Dec 1, 2024",
  version: "v2.3",
  category: "Financial Reports",
};

const versions = [
  { version: "v2.3", author: "Sarah Johnson", date: "Dec 1, 2024", current: true },
  { version: "v2.2", author: "Michael Chen", date: "Nov 28, 2024", current: false },
  { version: "v2.1", author: "Sarah Johnson", date: "Nov 20, 2024", current: false },
  { version: "v2.0", author: "Emma Wilson", date: "Nov 15, 2024", current: false },
];

const comments = [
  { author: "Michael Chen", avatar: "MC", date: "2 hours ago", text: "The Q4 projections look accurate. Approved for final review." },
  { author: "Emma Wilson", avatar: "EW", date: "1 day ago", text: "Please update the infrastructure allocation section with the new estimates." },
  { author: "David Brown", avatar: "DB", date: "3 days ago", text: "Initial review complete. Minor formatting adjustments needed." },
];

const DocumentDetail = () => {
  return (
    <DashboardLayout 
      title="Document Detail" 
      subtitle="View and manage document"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link to="/documents" className="hover:text-foreground transition-colors">Documents</Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground font-medium" aria-current="page">{documentInfo.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Header */}
        <Card className="lg:col-span-12">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex gap-4">
                <div className="h-14 w-14 bg-primary-muted rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold text-foreground">{documentInfo.title}</h1>
                    <Badge variant="approved">{documentInfo.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>{documentInfo.type}</span>
                    <span>{documentInfo.size}</span>
                    <span>{documentInfo.version}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Preview - 8 columns on large screens */}
        <div className="lg:col-span-8 space-y-4">
          {/* Preview Toolbar */}
          <div className="h-12 bg-muted border border-border rounded-lg flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon-sm" aria-label="Rotate">
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page 1 of 12</span>
              <Button variant="ghost" size="icon-sm" aria-label="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Document Preview Area */}
          <Card className="min-h-[500px] flex items-center justify-center">
            <CardContent className="w-full max-w-lg p-8">
              <div className="space-y-4 p-6 border-2 border-dashed border-border rounded-lg">
                <div className="h-6 w-3/4 bg-muted rounded mx-auto" />
                <div className="space-y-2">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-3 bg-muted/60 rounded ${i % 3 === 2 ? 'w-4/5' : 'w-full'}`} 
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <div className="h-32 w-full bg-muted/40 rounded mt-6" aria-hidden="true" />
                <div className="space-y-2 mt-4">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-3 bg-muted/60 rounded ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} 
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Document preview placeholder
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 4 columns on large screens */}
        <div className="lg:col-span-4 space-y-4">
          {/* Document Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: User, label: "Author", value: documentInfo.author },
                { icon: FolderOpen, label: "Department", value: documentInfo.department },
                { icon: Tag, label: "Category", value: documentInfo.category },
                { icon: Calendar, label: "Created", value: documentInfo.created },
                { icon: Clock, label: "Modified", value: documentInfo.modified },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Version History</CardTitle>
                <Button variant="link" size="sm" className="text-xs h-auto p-0">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {versions.map((ver, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-3 p-2 rounded-lg border ${ver.current ? 'border-primary bg-primary-muted' : 'border-border'}`}
                >
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0">
                    {ver.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ver.version}</span>
                      {ver.current && <Badge variant="info" className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ver.author}</p>
                    <p className="text-xs text-muted-foreground">{ver.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Comments</CardTitle>
                <Badge variant="secondary">{comments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comment, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded-lg">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Add Comment */}
              <div className="flex gap-2 pt-2">
                <Input 
                  placeholder="Add a comment..." 
                  className="flex-1"
                  aria-label="Add a comment"
                />
                <Button size="icon" aria-label="Send comment">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentDetail;
