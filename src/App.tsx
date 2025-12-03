import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import Processes from "./pages/Processes";
import ProcessDetail from "./pages/ProcessDetail";
import DispatchManagement from "./pages/DispatchManagement";
import ApprovalQueue from "./pages/ApprovalQueue";
import UserManagement from "./pages/UserManagement";
import Permissions from "./pages/Permissions";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import SearchResults from "./pages/SearchResults";
import Wireframes from "./pages/Wireframes";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/processes" element={<Processes />} />
          <Route path="/processes/:id" element={<ProcessDetail />} />
          <Route path="/dispatches" element={<DispatchManagement />} />
          <Route path="/approvals" element={<ApprovalQueue />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/wireframes" element={<Wireframes />} />
          <Route path="/folders" element={<PlaceholderPage title="Folders" subtitle="Organize and manage document folders" />} />
          <Route path="/archive" element={<PlaceholderPage title="Archive" subtitle="Access archived documents and records" />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" subtitle="Manage notification preferences" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
