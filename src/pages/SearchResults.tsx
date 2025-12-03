import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { 
  Search, 
  FileText, 
  Calendar,
  User,
  Bookmark,
  Filter
} from "lucide-react";

const searchResults = [
  {
    id: 1,
    type: "document",
    title: "Annual Budget Report 2024",
    excerpt: "The annual budget allocation for fiscal year 2025 includes departmental breakdowns and projected expenditures...",
    highlight: "budget allocation",
    author: "Sarah Johnson",
    department: "Finance",
    date: "Dec 1, 2024",
    status: "approved",
  },
  {
    id: 2,
    type: "process",
    title: "Budget Approval Workflow",
    excerpt: "Standard workflow for budget approval including review stages and sign-off requirements...",
    highlight: "budget approval",
    author: "Michael Chen",
    department: "Finance",
    date: "Nov 28, 2024",
    status: "active",
  },
  {
    id: 3,
    type: "document",
    title: "Q3 Budget Analysis Report",
    excerpt: "Quarterly analysis of budget utilization across all departments with variance reports...",
    highlight: "Budget Analysis",
    author: "Emma Wilson",
    department: "Finance",
    date: "Oct 15, 2024",
    status: "approved",
  },
  {
    id: 4,
    type: "dispatch",
    title: "Budget Documents Dispatch",
    excerpt: "Dispatch of finalized budget documents to regional offices for distribution...",
    highlight: "Budget Documents",
    author: "David Brown",
    department: "Operations",
    date: "Nov 20, 2024",
    status: "delivered",
  },
  {
    id: 5,
    type: "document",
    title: "Budget Guidelines 2025",
    excerpt: "Guidelines and procedures for budget submission and allocation for the upcoming fiscal year...",
    highlight: "Budget Guidelines",
    author: "Lisa Anderson",
    department: "Finance",
    date: "Nov 1, 2024",
    status: "draft",
  },
  {
    id: 6,
    type: "process",
    title: "Emergency Budget Request",
    excerpt: "Fast-track process for emergency budget requests requiring immediate approval...",
    highlight: "Budget Request",
    author: "James Wilson",
    department: "Operations",
    date: "Oct 28, 2024",
    status: "completed",
  },
];

const filters = {
  types: [
    { label: "Documents", count: 89 },
    { label: "Processes", count: 42 },
    { label: "Dispatches", count: 18 },
    { label: "Users", count: 7 },
  ],
  status: [
    { label: "Active", count: 45 },
    { label: "Pending", count: 23 },
    { label: "Completed", count: 67 },
    { label: "Archived", count: 21 },
  ],
  departments: [
    { label: "Finance", count: 34 },
    { label: "Operations", count: 28 },
    { label: "HR", count: 19 },
    { label: "Legal", count: 15 },
  ],
};

const SearchResults = () => {
  return (
    <DashboardLayout 
      title="Search Results" 
      subtitle='Results for "budget"'
    >
      <PageBreadcrumb items={[{ label: "Search Results" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search Header */}
        <div className="lg:col-span-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input 
                defaultValue="budget"
                className="pl-10 pr-24"
                aria-label="Search query"
              />
              <Button className="absolute right-1 top-1 h-8">
                Search
              </Button>
            </div>
          </div>
          
          {/* Search Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">156 results</span> for "budget"
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-sm text-muted-foreground">Sort by:</Label>
              <select 
                id="sort"
                className="h-9 px-3 border border-border rounded-md bg-background text-sm"
              >
                <option>Relevance</option>
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Filters
                </CardTitle>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  Clear all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type Filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Type</h4>
                {filters.types.map((type, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`type-${i}`} defaultChecked={i === 0} />
                      <Label htmlFor={`type-${i}`} className="text-sm text-muted-foreground cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">{type.count}</span>
                  </div>
                ))}
              </div>
              
              <div className="h-px bg-border" />
              
              {/* Status Filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Status</h4>
                {filters.status.map((status, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`status-${i}`} />
                      <Label htmlFor={`status-${i}`} className="text-sm text-muted-foreground cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">{status.count}</span>
                  </div>
                ))}
              </div>
              
              <div className="h-px bg-border" />
              
              {/* Date Range */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Date Range</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 h-9 px-3 border border-border rounded-md">
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <input 
                      type="text" 
                      placeholder="Start date" 
                      className="flex-1 text-sm bg-transparent outline-none"
                      aria-label="Start date"
                    />
                  </div>
                  <div className="flex items-center gap-2 h-9 px-3 border border-border rounded-md">
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <input 
                      type="text" 
                      placeholder="End date" 
                      className="flex-1 text-sm bg-transparent outline-none"
                      aria-label="End date"
                    />
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-border" />
              
              {/* Department Filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Department</h4>
                {filters.departments.map((dept, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`dept-${i}`} />
                      <Label htmlFor={`dept-${i}`} className="text-sm text-muted-foreground cursor-pointer">
                        {dept.label}
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">{dept.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-9 space-y-4">
          {/* Result Tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All (156)</TabsTrigger>
              <TabsTrigger value="documents">Documents (89)</TabsTrigger>
              <TabsTrigger value="processes">Processes (42)</TabsTrigger>
              <TabsTrigger value="dispatches">Dispatches (18)</TabsTrigger>
              <TabsTrigger value="users">Users (7)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <Card key={result.id} variant="interactive">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground hover:text-primary cursor-pointer">
                                {result.title}
                              </h3>
                              <Badge variant={
                                result.status === 'approved' || result.status === 'completed' || result.status === 'delivered' 
                                  ? 'approved' 
                                  : result.status === 'active' 
                                    ? 'in-progress' 
                                    : 'draft'
                              }>
                                {result.status}
                              </Badge>
                            </div>
                            {/* Highlighted excerpt */}
                            <p className="text-sm text-muted-foreground">
                              {result.excerpt.split(result.highlight).map((part, i, arr) => (
                                <span key={i}>
                                  {part}
                                  {i < arr.length - 1 && (
                                    <mark className="bg-warning-muted text-warning px-1 rounded">
                                      {result.highlight}
                                    </mark>
                                  )}
                                </span>
                              ))}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon-sm" aria-label="Bookmark">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" aria-hidden="true" />
                            <span className="capitalize">{result.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            <span>{result.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" aria-hidden="true" />
                            <span>{result.author}</span>
                          </div>
                          <Badge variant="outline">{result.department}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing 1-6 of 156 results
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">...</Button>
                  <Button variant="outline" size="sm">26</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>

              {/* Audit Log Reference */}
              <div className="pt-4">
                <AuditLogReference context="View search activity history" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchResults;
