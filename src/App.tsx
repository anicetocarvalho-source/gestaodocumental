import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoAuthProvider } from "@/contexts/DemoAuthContext";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import DocumentViewer from "./pages/DocumentViewer";
import RegisterDocument from "./pages/RegisterDocument";
import Processes from "./pages/Processes";
import CreateProcess from "./pages/CreateProcess";
import ProcessDetail from "./pages/ProcessDetail";
import DispatchManagement from "./pages/DispatchManagement";
import DispatchDetail from "./pages/DispatchDetail";
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
import Archive from "./pages/Archive";
import SLAConfiguration from "./pages/SLAConfiguration";
import WorkflowVisualization from "./pages/WorkflowVisualization";
import DocumentIntelligence from "./pages/DocumentIntelligence";
import IntelligentSearch from "./pages/IntelligentSearch";
import ProcedureGuide from "./pages/ProcedureGuide";
import InstitutionalAssistant from "./pages/InstitutionalAssistant";
import MovementHistory from "./pages/MovementHistory";
import PendingApprovals from "./pages/PendingApprovals";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";
import ProtectedRoute from "./components/common/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/documents/new" element={<ProtectedRoute><RegisterDocument /></ProtectedRoute>} />
              <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
              <Route path="/documents/:id/view" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
              <Route path="/processes" element={<ProtectedRoute><Processes /></ProtectedRoute>} />
              <Route path="/processes/new" element={<ProtectedRoute><CreateProcess /></ProtectedRoute>} />
              <Route path="/processes/:id" element={<ProtectedRoute><ProcessDetail /></ProtectedRoute>} />
              <Route path="/dispatches" element={<ProtectedRoute><DispatchManagement /></ProtectedRoute>} />
              <Route path="/dispatches/new" element={<ProtectedRoute><CreateDispatch /></ProtectedRoute>} />
              <Route path="/dispatches/:id" element={<ProtectedRoute><DispatchDetail /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><ApprovalQueue /></ProtectedRoute>} />
              <Route path="/pending-approvals" element={<ProtectedRoute><PendingApprovals /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
              <Route path="/wireframes" element={<ProtectedRoute><Wireframes /></ProtectedRoute>} />
              <Route path="/folders" element={<ProtectedRoute><Repository /></ProtectedRoute>} />
              <Route path="/digitization" element={<ProtectedRoute><DigitizationCenter /></ProtectedRoute>} />
              <Route path="/quality-review" element={<ProtectedRoute><QualityReview /></ProtectedRoute>} />
              <Route path="/ocr-processing" element={<ProtectedRoute><OCRProcessing /></ProtectedRoute>} />
              <Route path="/classification" element={<ProtectedRoute><DocumentClassification /></ProtectedRoute>} />
              <Route path="/workflow-builder" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />
              <Route path="/process-templates" element={<ProtectedRoute><ProcessTemplates /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/sla-configuration" element={<ProtectedRoute><SLAConfiguration /></ProtectedRoute>} />
              <Route path="/workflow-visualization" element={<ProtectedRoute><WorkflowVisualization /></ProtectedRoute>} />
              <Route path="/document-intelligence" element={<ProtectedRoute><DocumentIntelligence /></ProtectedRoute>} />
              <Route path="/intelligent-search" element={<ProtectedRoute><IntelligentSearch /></ProtectedRoute>} />
              <Route path="/procedure-guide" element={<ProtectedRoute><ProcedureGuide /></ProtectedRoute>} />
              <Route path="/assistant" element={<ProtectedRoute><InstitutionalAssistant /></ProtectedRoute>} />
              <Route path="/movement-history" element={<ProtectedRoute><MovementHistory /></ProtectedRoute>} />
              <Route path="/placeholder" element={<ProtectedRoute><PlaceholderPage title="Módulo em Desenvolvimento" subtitle="Esta funcionalidade será implementada em breve" /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DemoAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
