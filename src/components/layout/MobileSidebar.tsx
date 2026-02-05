import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarContent } from "./SidebarContent";

export function MobileSidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>
        <SidebarContent onNavigate={close} />
      </SheetContent>
    </Sheet>
  );
}
