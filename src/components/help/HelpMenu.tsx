import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  BookOpen,
  PlayCircle,
  FileText,
  Users,
  FolderOpen,
  Send,
  Archive,
  BarChart3,
  Settings,
  Shield,
  Clock,
  Bell,
  Sparkles,
  MessageSquare,
  Keyboard,
  ExternalLink,
} from "lucide-react";
import { useGuidedTour } from "@/hooks/useGuidedTour";
import { Badge } from "@/components/ui/badge";

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Primeiros Passos",
    icon: <PlayCircle className="h-5 w-5" />,
    description: "Aprenda os conceitos básicos do sistema",
    articles: [
      {
        id: "intro",
        title: "Introdução ao NODOC",
        content: `O NODOC é um sistema integrado de gestão documental desenvolvido para a gestão eficiente de documentos, processos e fluxos de trabalho institucionais. O sistema permite:

• **Registo de Documentos**: Registar e classificar documentos de entrada e saída
• **Gestão de Processos**: Criar e acompanhar processos administrativos
• **Expediente**: Emitir e gerir despachos, circulares e comunicações
• **Arquivo**: Gestão do ciclo de vida documental e retenção
• **Relatórios**: Análises e indicadores de desempenho

Para começar, navegue pelo menu lateral e explore as diferentes secções.`,
        tags: ["básico", "introdução"],
      },
      {
        id: "navigation",
        title: "Navegação no Sistema",
        content: `**Menu Principal (Barra Lateral)**
O menu lateral contém todas as secções do sistema. Pode expandir ou recolher o menu clicando no botão de alternância.

**Barra Superior**
• Pesquisa Global: Encontre documentos e processos rapidamente
• Notificações: Alertas sobre movimentações e prazos
• Aprovações Pendentes: Itens aguardando sua decisão
• Configurações: Personalize sua experiência

**Atalhos de Teclado**
• Ctrl+K: Pesquisa rápida
• Ctrl+N: Novo documento
• Esc: Fechar modais`,
        tags: ["navegação", "menu", "atalhos"],
      },
      {
        id: "tour",
        title: "Tour Guiado",
        content: `O NODOC oferece um tour interactivo para novos utilizadores. O tour apresenta as principais funcionalidades e ajuda a familiarizar-se com a interface.

**Como iniciar o tour:**
1. Clique no botão de Ajuda (?) na barra superior
2. Seleccione "Iniciar Tour Guiado"

O tour pode ser reiniciado a qualquer momento através do menu de ajuda.`,
        tags: ["tour", "tutorial"],
      },
    ],
  },
  {
    id: "documents",
    title: "Documentos",
    icon: <FileText className="h-5 w-5" />,
    description: "Registo e gestão de documentos",
    articles: [
      {
        id: "register-doc",
        title: "Registar um Documento",
        content: `**Passo a passo para registar um documento:**

1. Aceda a **Documentos** > **Registar Documento**
2. Preencha os campos obrigatórios:
   • Título do documento
   • Tipo de documento
   • Data de entrada
   • Remetente/Origem
3. Classifique o documento usando o código arquivístico
4. Anexe os ficheiros digitalizados (PDF, imagens)
5. Clique em **Guardar**

**Dica:** Use a classificação automática para acelerar o processo.`,
        tags: ["documento", "registo", "criar"],
      },
      {
        id: "search-doc",
        title: "Pesquisar Documentos",
        content: `**Pesquisa Básica**
Use a barra de pesquisa global para encontrar documentos por:
• Número de registo
• Título ou assunto
• Remetente

**Pesquisa Avançada**
Na página de Documentos, use os filtros para refinar:
• Tipo de documento
• Estado (pendente, em andamento, concluído)
• Unidade orgânica
• Período de datas
• Classificação arquivística

**Dica:** Combine múltiplos filtros para resultados mais precisos.`,
        tags: ["pesquisa", "busca", "filtros"],
      },
      {
        id: "doc-workflow",
        title: "Fluxo de Trabalho de Documentos",
        content: `**Estados do Documento**
• **Rascunho**: Documento em preparação
• **Registado**: Documento oficialmente registado
• **Em Tramitação**: Documento sendo movimentado entre unidades
• **Concluído**: Processamento finalizado
• **Arquivado**: Documento no arquivo

**Movimentação**
Para movimentar um documento:
1. Abra os detalhes do documento
2. Clique em **Movimentar**
3. Seleccione a unidade de destino
4. Adicione observações (opcional)
5. Confirme a movimentação`,
        tags: ["fluxo", "tramitação", "estados"],
      },
    ],
  },
  {
    id: "processes",
    title: "Processos",
    icon: <FolderOpen className="h-5 w-5" />,
    description: "Gestão de processos administrativos",
    articles: [
      {
        id: "create-process",
        title: "Criar um Processo",
        content: `**Passos para criar um processo:**

1. Aceda a **Processos** > **Novo Processo**
2. Preencha as informações:
   • Tipo de processo
   • Assunto/Descrição
   • Prioridade
   • Prazo estimado
3. Vincule documentos relacionados
4. Defina as etapas do fluxo de trabalho
5. Submeta para aprovação (se aplicável)

**Modelos de Processo**
Use modelos pré-definidos para tipos de processos frequentes. Os modelos incluem etapas e prazos padronizados.`,
        tags: ["processo", "criar", "novo"],
      },
      {
        id: "process-stages",
        title: "Etapas e Pareceres",
        content: `**Gestão de Etapas**
Cada processo pode ter múltiplas etapas definidas. Para gerir etapas:
• Avance etapas quando concluídas
• Adicione notas e pareceres
• Acompanhe os prazos

**Pareceres**
Adicione pareceres técnicos ou jurídicos:
1. Abra o processo
2. Clique em **Adicionar Parecer**
3. Seleccione o tipo de parecer
4. Escreva a análise e decisão
5. Submeta o parecer

Os pareceres ficam registados no histórico do processo.`,
        tags: ["etapas", "pareceres", "workflow"],
      },
    ],
  },
  {
    id: "dispatches",
    title: "Expediente",
    icon: <Send className="h-5 w-5" />,
    description: "Despachos, circulares e comunicações",
    articles: [
      {
        id: "create-dispatch",
        title: "Emitir um Despacho",
        content: `**Tipos de Expediente**
• **Despacho**: Decisão ou orientação de superior hierárquico
• **Circular**: Comunicação a múltiplos destinatários
• **Informação**: Documento informativo interno
• **Memorando**: Comunicação breve entre unidades

**Passos para emitir:**
1. Aceda a **Expediente** > **Novo**
2. Seleccione o tipo
3. Preencha o conteúdo
4. Adicione anexos (se necessário)
5. Defina destinatários
6. Configure aprovadores (se aplicável)
7. Submeta para aprovação ou emita directamente`,
        tags: ["despacho", "circular", "expediente"],
      },
      {
        id: "dispatch-approval",
        title: "Aprovação de Despachos",
        content: `**Fluxo de Aprovação**
Despachos podem requerer aprovação antes da emissão:

1. O criador submete para aprovação
2. Os aprovadores recebem notificação
3. Cada aprovador pode:
   • **Aprovar**: Autoriza o despacho
   • **Rejeitar**: Recusa com justificação
   • **Devolver**: Solicita alterações

**Assinatura Digital**
Despachos aprovados podem ser assinados digitalmente:
• Assinatura desenhada
• Assinatura digital certificada

As assinaturas ficam registadas com data, hora e informações do assinante.`,
        tags: ["aprovação", "assinatura", "workflow"],
      },
    ],
  },
  {
    id: "archive",
    title: "Arquivo",
    icon: <Archive className="h-5 w-5" />,
    description: "Gestão arquivística e retenção",
    articles: [
      {
        id: "classification",
        title: "Classificação Arquivística",
        content: `**Plano de Classificação**
O sistema usa um plano de classificação hierárquico para organizar documentos:
• Códigos numéricos estruturados
• Prazos de retenção definidos
• Destinação final (eliminação ou guarda permanente)

**Como classificar:**
1. Ao registar um documento, seleccione o código
2. Use a pesquisa para encontrar o código correcto
3. O sistema sugere classificações baseado no conteúdo

**Reclassificação**
É possível reclassificar documentos. O histórico de classificações é mantido para auditoria.`,
        tags: ["classificação", "arquivo", "plano"],
      },
      {
        id: "retention",
        title: "Política de Retenção",
        content: `**Ciclo de Vida Documental**
• **Fase Corrente**: Documento em uso activo
• **Fase Intermediária**: Consulta eventual
• **Fase Permanente**: Guarda definitiva ou eliminação

**Alertas de Retenção**
O sistema envia alertas automáticos quando:
• Documentos atingem prazo de retenção
• Está próximo da data de eliminação
• Requer revisão da classificação

**Eliminação**
A eliminação de documentos requer:
1. Aprovação do gestor de arquivo
2. Registo da justificação
3. Geração de termo de eliminação`,
        tags: ["retenção", "eliminação", "ciclo de vida"],
      },
    ],
  },
  {
    id: "reports",
    title: "Relatórios",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Análises e indicadores",
    articles: [
      {
        id: "dashboard-kpis",
        title: "Indicadores do Dashboard",
        content: `**Indicadores Principais**
• **Total de Documentos**: Volume total registado
• **Documentos Pendentes**: Aguardando processamento
• **Taxa de Conclusão**: Percentual de documentos finalizados
• **Conformidade SLA**: Cumprimento de prazos

**Gráficos**
• Distribuição por tipo de documento
• Movimentação por unidade
• Tendência temporal
• Comparativo de períodos

**Filtros**
Use os filtros de data para analisar períodos específicos.`,
        tags: ["indicadores", "KPIs", "dashboard"],
      },
      {
        id: "export-reports",
        title: "Exportar Relatórios",
        content: `**Formatos Disponíveis**
• **PDF**: Para impressão e distribuição
• **Excel**: Para análise adicional
• **CSV**: Para integração com outros sistemas

**Relatórios Pré-definidos**
• Movimento documental mensal
• Processos por estado
• Análise de SLA
• Estatísticas de utilizadores

**Relatórios Agendados**
Configure envio automático de relatórios:
1. Aceda a Relatórios > Agendar
2. Seleccione o relatório
3. Configure a frequência
4. Defina os destinatários`,
        tags: ["exportar", "relatórios", "pdf", "excel"],
      },
    ],
  },
  {
    id: "ai-features",
    title: "Funcionalidades IA",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Inteligência artificial e automação",
    articles: [
      {
        id: "ai-assistant",
        title: "Assistente Institucional",
        content: `**O que é o Assistente?**
O Assistente Institucional é um chatbot inteligente que responde perguntas sobre:
• Procedimentos do Ministério
• Legislação aplicável
• Uso do sistema NODOC
• Dúvidas operacionais

**Como usar:**
1. Aceda a **IA** > **Assistente**
2. Digite sua pergunta
3. O assistente responde com base na documentação

**Conversas**
Suas conversas são salvas e podem ser consultadas posteriormente.`,
        tags: ["assistente", "chatbot", "IA"],
      },
      {
        id: "ai-classification",
        title: "Classificação Automática",
        content: `**Classificação por IA**
O sistema usa inteligência artificial para sugerir:
• Código de classificação arquivística
• Tipo de documento
• Prioridade
• Entidades mencionadas

**Como funciona:**
1. Ao registar um documento, clique em **Análise IA**
2. O sistema analisa o conteúdo
3. Recebe sugestões de classificação
4. Aceite ou ajuste as sugestões

**OCR Inteligente**
Documentos digitalizados passam por OCR para:
• Extracção de texto
• Identificação de dados
• Indexação para pesquisa`,
        tags: ["classificação automática", "OCR", "IA"],
      },
      {
        id: "smart-search",
        title: "Pesquisa Inteligente",
        content: `**Pesquisa Semântica**
A pesquisa inteligente entende o contexto da sua busca:
• Sinónimos e variações
• Contexto semântico
• Relevância por conteúdo

**Como usar:**
1. Aceda a **IA** > **Pesquisa Inteligente**
2. Digite sua pergunta em linguagem natural
3. Receba resultados ordenados por relevância

**Exemplos de Perguntas:**
• "Documentos sobre contratação de pessoal em 2024"
• "Processos relacionados com licenças ambientais"
• "Despachos do Director Geral sobre orçamento"`,
        tags: ["pesquisa", "semântica", "IA"],
      },
    ],
  },
  {
    id: "admin",
    title: "Administração",
    icon: <Settings className="h-5 w-5" />,
    description: "Configurações e gestão de utilizadores",
    articles: [
      {
        id: "user-management",
        title: "Gestão de Utilizadores",
        content: `**Criar Utilizadores**
Apenas administradores podem criar utilizadores:
1. Aceda a **Gestão** > **Utilizadores**
2. Clique em **Novo Utilizador**
3. Preencha os dados (nome, email, unidade)
4. Atribua perfil/função
5. O utilizador recebe email de activação

**Perfis de Acesso**
• **Administrador**: Acesso total
• **Gestor**: Gestão da unidade
• **Técnico**: Operações diárias
• **Consulta**: Apenas visualização`,
        tags: ["utilizadores", "perfis", "administração"],
      },
      {
        id: "permissions",
        title: "Permissões e Segurança",
        content: `**Controlo de Acesso**
O sistema usa controlo de acesso baseado em funções (RBAC):
• Cada função tem permissões específicas
• Permissões podem ser personalizadas
• Acesso é registado para auditoria

**Logs de Auditoria**
Todas as acções são registadas:
• Quem fez a acção
• O que foi feito
• Quando ocorreu
• Valores anteriores e novos

**Segurança**
• Sessões expiram após inactividade
• Senhas devem ser complexas
• Autenticação em duas etapas (opcional)`,
        tags: ["permissões", "segurança", "auditoria"],
      },
    ],
  },
  {
    id: "notifications",
    title: "Notificações",
    icon: <Bell className="h-5 w-5" />,
    description: "Alertas e preferências de notificação",
    articles: [
      {
        id: "notification-types",
        title: "Tipos de Notificação",
        content: `**Notificações do Sistema**
• **Movimentação**: Documento recebido ou enviado
• **Aprovação**: Itens pendentes de sua aprovação
• **Prazos**: Alertas de SLA e vencimentos
• **Retenção**: Documentos atingindo prazo de guarda
• **Sistema**: Actualizações e manutenções

**Canais de Notificação**
• **In-App**: Notificações dentro do sistema
• **Email**: Envio por correio electrónico
• **Som**: Alerta sonoro para novas notificações`,
        tags: ["notificações", "alertas"],
      },
      {
        id: "notification-settings",
        title: "Configurar Preferências",
        content: `**Personalizar Notificações**
Aceda a **Configurações** > **Notificações** para:

• Activar/desactivar tipos específicos
• Escolher canais por tipo de notificação
• Configurar resumo diário por email
• Definir horários de não perturbar

**Dicas**
• Mantenha activadas as notificações de aprovação
• Configure o resumo diário para não perder nada
• Desactive sons se trabalha em ambiente partilhado`,
        tags: ["configurações", "preferências", "notificações"],
      },
    ],
  },
];

export function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { startDashboardTour, resetTour } = useGuidedTour();

  const filteredCategories = searchQuery
    ? helpCategories.map((category) => ({
        ...category,
        articles: category.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags?.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ),
      })).filter((category) => category.articles.length > 0)
    : helpCategories;

  const handleStartTour = () => {
    setIsOpen(false);
    setTimeout(() => {
      startDashboardTour();
    }, 300);
  };

  const handleResetTour = () => {
    resetTour();
    setIsOpen(false);
    setTimeout(() => {
      startDashboardTour();
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          data-tour="help-btn"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Central de Ajuda
          </SheetTitle>
          <SheetDescription>
            Documentação, tutoriais e suporte do NODOC
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar na ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleStartTour}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Iniciar Tour
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleResetTour}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Reiniciar Tour
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="topics" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="topics" className="flex-1">
                <BookOpen className="mr-2 h-4 w-4" />
                Tópicos
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="flex-1">
                <Keyboard className="mr-2 h-4 w-4" />
                Atalhos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="topics" className="mt-4">
              <ScrollArea className="h-[calc(100vh-320px)]">
                <Accordion type="multiple" className="w-full">
                  {filteredCategories.map((category) => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {category.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{category.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.articles.length} artigos
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-11">
                          {category.articles.map((article) => (
                            <Accordion
                              key={article.id}
                              type="single"
                              collapsible
                              className="w-full"
                            >
                              <AccordionItem
                                value={article.id}
                                className="border-l-2 border-muted pl-3"
                              >
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                  {article.title}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {article.content.split("\n\n").map((paragraph, i) => (
                                      <p
                                        key={i}
                                        className="text-sm text-muted-foreground whitespace-pre-line mb-2"
                                        dangerouslySetInnerHTML={{
                                          __html: paragraph
                                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                            .replace(/• /g, "• "),
                                        }}
                                      />
                                    ))}
                                  </div>
                                  {article.tags && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                      {article.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shortcuts" className="mt-4">
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 font-medium">Navegação</h4>
                    <div className="space-y-2">
                      <ShortcutRow keys={["Ctrl", "K"]} description="Pesquisa rápida" />
                      <ShortcutRow keys={["Ctrl", "/"]} description="Mostrar ajuda" />
                      <ShortcutRow keys={["Esc"]} description="Fechar modal" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Documentos</h4>
                    <div className="space-y-2">
                      <ShortcutRow keys={["Ctrl", "N"]} description="Novo documento" />
                      <ShortcutRow keys={["Ctrl", "S"]} description="Guardar" />
                      <ShortcutRow keys={["Ctrl", "P"]} description="Imprimir" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Revisão de Qualidade</h4>
                    <div className="space-y-2">
                      <ShortcutRow keys={["A"]} description="Aprovar documento" />
                      <ShortcutRow keys={["R"]} description="Rejeitar documento" />
                      <ShortcutRow keys={["←", "→"]} description="Navegar documentos" />
                      <ShortcutRow keys={["+"]} description="Aumentar zoom" />
                      <ShortcutRow keys={["-"]} description="Diminuir zoom" />
                      <ShortcutRow keys={["0"]} description="Reset zoom" />
                      <ShortcutRow keys={["F"]} description="Ecrã inteiro" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Geral</h4>
                    <div className="space-y-2">
                      <ShortcutRow keys={["?"]} description="Mostrar atalhos" />
                      <ShortcutRow keys={["Ctrl", "Z"]} description="Desfazer" />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Support Links */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">Precisa de mais ajuda?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href="mailto:suporte@nodoc.gov.ao">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contactar Suporte
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Documentação
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 text-xs font-semibold bg-muted border rounded"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
