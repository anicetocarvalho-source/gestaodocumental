import { useNavigate } from "react-router-dom";
import { 
  FilePlus, 
  FolderPlus, 
  Upload, 
  ClipboardPlus, 
  UserPlus, 
  FileSearch,
  FileSignature,
  Send,
  LucideIcon
} from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}

const actions: QuickAction[] = [
  { icon: FilePlus, label: "Novo Documento", description: "Criar novo documento", href: "/documents/new" },
  { icon: Upload, label: "Carregar Ficheiro", description: "Carregar do computador", href: "/documents" },
  { icon: ClipboardPlus, label: "Iniciar Processo", description: "Iniciar novo fluxo", href: "/processes" },
  { icon: FolderPlus, label: "Nova Pasta", description: "Organizar documentos", href: "/folders" },
  { icon: FileSearch, label: "Pesquisar", description: "Encontrar documentos", href: "/search" },
  { icon: FileSignature, label: "Pedir Assinatura", description: "Obter aprovações", href: "/approvals" },
  { icon: UserPlus, label: "Adicionar Utilizador", description: "Convidar membro", href: "/users" },
  { icon: Send, label: "Enviar Relatório", description: "Partilhar com partes", href: "/dispatches" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="animate-slide-up" data-tour="quick-actions">
      <h3 className="text-sm font-semibold text-foreground mb-4">Acções Rápidas</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.href)}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-card p-4 text-center transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 transition-all duration-200 group-hover:bg-primary/10 group-hover:scale-105">
                <IconComponent className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[13px] font-medium text-foreground leading-tight">{action.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
