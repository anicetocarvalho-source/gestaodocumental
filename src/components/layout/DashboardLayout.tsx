import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  // Subscribe to realtime notifications with sound
  useNotificationSound();
  // Enable global keyboard shortcuts
  useGlobalKeyboardShortcuts();
  
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto">
          <div className="content-area page-section animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <KeyboardShortcutsModal />
    </div>
  );
}
