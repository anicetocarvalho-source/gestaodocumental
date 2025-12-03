import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import DocumentViewer from "./pages/DocumentViewer";
import RegisterDocument from "./pages/RegisterDocument";
import Processes from "./pages/Processes";
import CreateProcess from "./pages/CreateProcess";
import ProcessDetail from "./pages/ProcessDetail";
import DispatchManagement from "./pages/DispatchManagement";
import ApprovalQueue from "./pages/ApprovalQueue";
import UserManagement from "./pages/UserManagement";
import Permissions from "./pages/Permissions";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import SearchResults from "./pages/SearchResults";
import Wireframes from "./pages/Wireframes";
import Repository from "./pages/Repository";
import DigitizationCenter from "./pages/DigitizationCenter";
import QualityReview from "./pages/QualityReview";
import CreateDispatch from "./pages/CreateDispatch";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import ProcessTemplates from "./pages/ProcessTemplates";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import OCRProcessing from "./pages/OCRProcessing";
import DocumentClassification from "./pages/DocumentClassification";
import PlaceholderPage from "./pages/PlaceholderPage";
import SLAConfiguration from "./pages/SLAConfiguration";
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
          <Route path="/documents/new" element={<RegisterDocument />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/documents/:id/view" element={<DocumentViewer />} />
          <Route path="/processes" element={<Processes />} />
          <Route path="/processes/new" element={<CreateProcess />} />
          <Route path="/processes/:id" element={<ProcessDetail />} />
          <Route path="/dispatches" element={<DispatchManagement />} />
          <Route path="/dispatches/new" element={<CreateDispatch />} />
          <Route path="/approvals" element={<ApprovalQueue />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/wireframes" element={<Wireframes />} />
          <Route path="/folders" element={<Repository />} />
          <Route path="/digitization" element={<DigitizationCenter />} />
          <Route path="/quality-review" element={<QualityReview />} />
          <Route path="/ocr-processing" element={<OCRProcessing />} />
          <Route path="/classification" element={<DocumentClassification />} />
          <Route path="/workflow-builder" element={<WorkflowBuilder />} />
          <Route path="/process-templates" element={<ProcessTemplates />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/archive" element={<PlaceholderPage title="Archive" subtitle="Access archived documents and records" />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/sla-configuration" element={<SLAConfiguration />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
