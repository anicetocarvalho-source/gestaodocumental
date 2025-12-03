import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HelpCircle,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building,
  Clock,
  Link2,
  User,
  BookOpen,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProcedureStep {
  number: number;
  action: string;
  tip?: string;
}

interface CommonError {
  error: string;
  prevention: string;
}

interface ProcedureGuide {
  procedure_name?: string;
  description?: string;
  applicable_roles?: string[];
  steps?: ProcedureStep[];
  required_documents?: string[];
  responsible_units?: string[];
  common_errors?: CommonError[];
  estimated_time?: string;
  related_procedures?: string[];
  text_response?: string;
  is_text_only?: boolean;
}

interface Message {
  type: "user" | "assistant";
  content: string;
  guide?: ProcedureGuide;
  timestamp: Date;
}

const roleLabels: Record<string, string> = {
  operador: "Operador",
  gestor: "Gestor",
  arquivo: "Arquivo",
  protocolo: "Protocolo",
  administrador: "Administrador",
};

const quickQuestions = [
  "Como registar um novo documento?",
  "Como criar um processo?",
  "Como fazer um despacho?",
  "Como arquivar um documento?",
  "Como tramitar entre unidades?",
  "Como digitalizar documentos?",
  "Como emitir parecer técnico?",
];

export default function ProcedureGuide() {
  const [question, setQuestion] = useState("");
  const [userRole, setUserRole] = useState<string>("operador");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAsk = async (q?: string) => {
    const questionText = q || question;
    if (!questionText.trim()) {
      toast.error("Por favor, insira uma pergunta");
      return;
    }

    const userMessage: Message = {
      type: "user",
      content: questionText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("procedure-guide", {
        body: { question: questionText, userRole },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        type: "assistant",
        content: data.guide.procedure_name || "Resposta",
        guide: data.guide,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pergunta");
      
      const errorMessage: Message = {
        type: "assistant",
        content: "Erro ao processar sua pergunta. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <DashboardLayout
      title="Guia de Procedimentos"
      subtitle="Assistente interactivo para orientação de procedimentos"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Assistente de Procedimentos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Meu perfil:</span>
                  <Select value={userRole} onValueChange={setUserRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Bem-vindo ao Guia de Procedimentos</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Faça perguntas sobre procedimentos do sistema MINAGRIF. 
                      Selecione seu perfil para receber instruções personalizadas.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickQuestions.slice(0, 4).map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAsk(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.type === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.type === "user" ? (
                          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                            <p className="text-sm">{message.content}</p>
                          </div>
                        ) : (
                          <div className="max-w-[90%]">
                            {message.guide?.is_text_only ? (
                              <Card>
                                <CardContent className="pt-4">
                                  <p className="text-sm whitespace-pre-wrap">
                                    {message.guide.text_response}
                                  </p>
                                </CardContent>
                              </Card>
                            ) : message.guide?.procedure_name ? (
                              <ProcedureCard guide={message.guide} />
                            ) : (
                              <Card>
                                <CardContent className="pt-4">
                                  <p className="text-sm text-muted-foreground">
                                    {message.content}
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <Card>
                          <CardContent className="py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">A processar...</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Faça uma pergunta sobre procedimentos..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={() => handleAsk()} disabled={isLoading || !question.trim()}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Questions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Perguntas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((q, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => handleAsk(q)}
                  disabled={isLoading}
                >
                  <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-xs">{q}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Role Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2">
                {roleLabels[userRole]}
              </Badge>
              <p className="text-xs text-muted-foreground">
                As instruções são adaptadas ao seu perfil. 
                Selecione outro perfil se necessário.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProcedureCard({ guide }: { guide: ProcedureGuide }) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{guide.procedure_name}</CardTitle>
        {guide.description && (
          <CardDescription>{guide.description}</CardDescription>
        )}
        {guide.applicable_roles && guide.applicable_roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {guide.applicable_roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                <User className="h-2.5 w-2.5 mr-1" />
                {roleLabels[role] || role}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps */}
        {guide.steps && guide.steps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Passos
            </h4>
            <ol className="space-y-2">
              {guide.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {step.number}
                  </span>
                  <div>
                    <p>{step.action}</p>
                    {step.tip && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        💡 {step.tip}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Required Documents */}
        {guide.required_documents && guide.required_documents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Documentos Necessários
            </h4>
            <ul className="space-y-1">
              {guide.required_documents.map((doc, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Responsible Units */}
        {guide.responsible_units && guide.responsible_units.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              Unidades Responsáveis
            </h4>
            <div className="flex flex-wrap gap-1">
              {guide.responsible_units.map((unit, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {unit}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Common Errors */}
        {guide.common_errors && guide.common_errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Erros Comuns a Evitar
            </h4>
            <ul className="space-y-2">
              {guide.common_errors.map((err, index) => (
                <li key={index} className="text-sm bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    ⚠️ {err.error}
                  </p>
                  {err.prevention && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ {err.prevention}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Estimated Time & Related */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
          {guide.estimated_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {guide.estimated_time}
            </span>
          )}
          {guide.related_procedures && guide.related_procedures.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Relacionados: {guide.related_procedures.join(", ")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
