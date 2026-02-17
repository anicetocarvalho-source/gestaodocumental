import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, X, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  action?: string;
  href?: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "tour",
    title: "Completar o tour guiado",
    description: "Familiarize-se com a interface do sistema",
  },
  {
    id: "profile",
    title: "Configurar perfil",
    description: "Adicione a sua foto e informações",
    action: "Configurar",
    href: "/settings",
  },
  {
    id: "document",
    title: "Registar primeiro documento",
    description: "Crie o seu primeiro registo documental",
    action: "Registar",
    href: "/documents/new",
  },
  {
    id: "process",
    title: "Criar primeiro processo",
    description: "Inicie um processo administrativo",
    action: "Criar",
    href: "/processes/new",
  },
  {
    id: "notifications",
    title: "Configurar notificações",
    description: "Personalize os seus alertas",
    action: "Configurar",
    href: "/settings",
  },
];

const CHECKLIST_KEY = "nodidoc_onboarding_checklist";

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(`${CHECKLIST_KEY}_dismissed`) === "true";
  });
  const [completedItems, setCompletedItems] = useState<string[]>(() => {
    const stored = localStorage.getItem(CHECKLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Check if tour is completed
  useEffect(() => {
    if (localStorage.getItem("nodidoc_tour_completed") === "true" && !completedItems.includes("tour")) {
      const updated = [...completedItems, "tour"];
      setCompletedItems(updated);
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updated));
    }
  }, [completedItems]);

  const progress = (completedItems.length / checklistItems.length) * 100;
  const allCompleted = completedItems.length === checklistItems.length;

  const toggleItem = (id: string) => {
    const updated = completedItems.includes(id)
      ? completedItems.filter((item) => item !== id)
      : [...completedItems, id];
    setCompletedItems(updated);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updated));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`${CHECKLIST_KEY}_dismissed`, "true");
  };

  if (isDismissed || allCompleted) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Começar a Usar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">
            {completedItems.length}/{checklistItems.length}
          </span>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2">
          <div className="space-y-2">
            {checklistItems.map((item) => {
              const isCompleted = completedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                    isCompleted ? "bg-success/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  <button className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCompleted && "line-through text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  {item.action && !isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.href) navigate(item.href);
                      }}
                    >
                      {item.action}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
