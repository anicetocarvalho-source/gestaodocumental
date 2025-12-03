import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import Processes from "./pages/Processes";
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
          <Route path="/processes" element={<Processes />} />
          <Route path="/wireframes" element={<Wireframes />} />
          <Route path="/folders" element={<PlaceholderPage title="Folders" subtitle="Organize and manage document folders" />} />
          <Route path="/archive" element={<PlaceholderPage title="Archive" subtitle="Access archived documents and records" />} />
          <Route path="/users" element={<PlaceholderPage title="Users" subtitle="Manage user accounts and access" />} />
          <Route path="/permissions" element={<PlaceholderPage title="Permissions" subtitle="Configure roles and permissions" />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" subtitle="Manage notification preferences" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="System configuration and preferences" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
