import { AppRole } from "@/hooks/useUserRole";

export interface FlowStep {
  number: number;
  action: string;
  screen: string;
  route: string;
}

export interface FlowError {
  condition: string;
  consequence: string;
}

export interface FlowData {
  id: string;
  name: string;
  description: string;
  roles: AppRole[];
  steps: FlowStep[];
  requiredData: string[];
  errors: FlowError[];
}

export const flows: FlowData[] = [
  {
    id: "auth",
    name: "Autenticação e Acesso",
    description: "Registo, login e controlo de sessão na plataforma",
    roles: ["admin", "gestor", "tecnico", "consulta"],
    steps: [
      { number: 1, action: "Aceder à página de login", screen: "Autenticação", route: "/auth" },
      { number: 2, action: "Inserir email e password", screen: "Autenticação", route: "/auth" },
      { number: 3, action: "Sistema valida credenciais e verifica role", screen: "Autenticação", route: "/auth" },
      { number: 4, action: "Redireccionamento para o Painel", screen: "Painel", route: "/" },
      { number: 5, action: "Logout via sidebar", screen: "Painel", route: "/" },
    ],
    requiredData: ["Email", "Password"],
    errors: [
      { condition: "Email não registado", consequence: "Mensagem de erro genérica" },
      { condition: "Password incorrecta", consequence: "Mensagem de erro genérica" },
      { condition: "Email não confirmado", consequence: "Bloqueio de acesso até confirmação" },
      { condition: "Sessão expirada", consequence: "Redireccionamento para login" },
    ],
  },
  {
    id: "register-document",
    name: "Registo de Documento",
    description: "Criação e registo de um novo documento no sistema",
    roles: ["admin", "gestor", "tecnico"],
    steps: [
      { number: 1, action: "Clicar em 'Novo Documento'", screen: "Documentos", route: "/documents" },
      { number: 2, action: "Preencher dados básicos (título, tipo, assunto)", screen: "Registar Documento", route: "/documents/new" },
      { number: 3, action: "Preencher dados do remetente", screen: "Registar Documento", route: "/documents/new" },
      { number: 4, action: "Anexar ficheiros", screen: "Registar Documento", route: "/documents/new" },
      { number: 5, action: "Rever e confirmar", screen: "Registar Documento", route: "/documents/new" },
      { number: 6, action: "Documento registado com número de entrada", screen: "Detalhe do Documento", route: "/documents/:id" },
    ],
    requiredData: ["Título", "Tipo de documento", "Assunto", "Remetente", "Ficheiro(s)"],
    errors: [
      { condition: "Campos obrigatórios em falta", consequence: "Validação impede submissão" },
      { condition: "Ficheiro demasiado grande", consequence: "Erro de upload" },
      { condition: "Erro de rede durante upload", consequence: "Retry automático ou manual" },
      { condition: "Sem permissão (role consulta)", consequence: "Acesso negado" },
    ],
  },
  {
    id: "document-workflow",
    name: "Workflow de Documento",
    description: "Ciclo de vida do documento: validação, despacho e arquivamento",
    roles: ["admin", "gestor", "tecnico"],
    steps: [
      { number: 1, action: "Abrir documento pendente", screen: "Detalhe do Documento", route: "/documents/:id" },
      { number: 2, action: "Validar ou rejeitar documento", screen: "Detalhe do Documento", route: "/documents/:id" },
      { number: 3, action: "Despachar para unidade orgânica", screen: "Detalhe do Documento", route: "/documents/:id" },
      { number: 4, action: "Unidade recebe e processa", screen: "Movimentações", route: "/movement-history" },
      { number: 5, action: "Arquivar documento concluído", screen: "Detalhe do Documento", route: "/documents/:id" },
    ],
    requiredData: ["ID do documento", "Decisão (validar/rejeitar)", "Unidade destino", "Despacho"],
    errors: [
      { condition: "Documento já validado", consequence: "Acção indisponível" },
      { condition: "Unidade destino inactiva", consequence: "Seleccionar outra unidade" },
      { condition: "Sem permissão para validar", consequence: "Acesso negado (apenas admin/gestor)" },
    ],
  },
  {
    id: "create-process",
    name: "Criação de Processo",
    description: "Abertura de um novo processo administrativo",
    roles: ["admin", "gestor", "tecnico"],
    steps: [
      { number: 1, action: "Clicar em 'Novo Processo'", screen: "Processos", route: "/processes" },
      { number: 2, action: "Preencher dados do processo", screen: "Criar Processo", route: "/processes/new" },
      { number: 3, action: "Vincular documentos existentes", screen: "Criar Processo", route: "/processes/new" },
      { number: 4, action: "Submeter processo", screen: "Criar Processo", route: "/processes/new" },
      { number: 5, action: "Processo criado com número sequencial", screen: "Detalhe do Processo", route: "/processes/:id" },
    ],
    requiredData: ["Assunto", "Tipo de processo", "Prioridade", "Documentos vinculados (opcional)"],
    errors: [
      { condition: "Assunto em falta", consequence: "Validação impede submissão" },
      { condition: "Documento vinculado já arquivado", consequence: "Aviso mas permite continuar" },
    ],
  },
  {
    id: "dispatch-management",
    name: "Gestão de Expedições",
    description: "Criação, aprovação e envio de despachos/expedições",
    roles: ["admin", "gestor", "tecnico"],
    steps: [
      { number: 1, action: "Criar nova expedição", screen: "Expedições", route: "/dispatches" },
      { number: 2, action: "Preencher assunto, conteúdo e destinatários", screen: "Criar Expedição", route: "/dispatches/new" },
      { number: 3, action: "Submeter para aprovação (se necessário)", screen: "Criar Expedição", route: "/dispatches/new" },
      { number: 4, action: "Aprovador revê e aprova/rejeita", screen: "Aprovações", route: "/approvals" },
      { number: 5, action: "Expedição emitida e enviada", screen: "Detalhe da Expedição", route: "/dispatches/:id" },
    ],
    requiredData: ["Assunto", "Conteúdo", "Tipo", "Destinatários", "Prioridade"],
    errors: [
      { condition: "Sem destinatários", consequence: "Validação impede envio" },
      { condition: "Aprovador rejeita", consequence: "Expedição devolvida ao criador" },
      { condition: "Prazo ultrapassado", consequence: "Alerta SLA" },
    ],
  },
  {
    id: "approval-queue",
    name: "Fila de Aprovações",
    description: "Revisão e decisão sobre itens pendentes de aprovação",
    roles: ["admin", "gestor"],
    steps: [
      { number: 1, action: "Aceder à fila de aprovações", screen: "Aprovações", route: "/approvals" },
      { number: 2, action: "Seleccionar item pendente", screen: "Aprovações", route: "/approvals" },
      { number: 3, action: "Rever detalhes e documentos associados", screen: "Aprovações", route: "/approvals" },
      { number: 4, action: "Aprovar ou rejeitar com comentário", screen: "Aprovações", route: "/approvals" },
      { number: 5, action: "Notificação enviada ao requerente", screen: "Notificações", route: "/notifications" },
    ],
    requiredData: ["Decisão (aprovar/rejeitar)", "Comentário (opcional)"],
    errors: [
      { condition: "Item já decidido por outro aprovador", consequence: "Acção indisponível" },
      { condition: "Sem permissão de aprovação", consequence: "Acesso negado" },
    ],
  },
  {
    id: "digitization",
    name: "Digitalização e OCR",
    description: "Digitalização de documentos físicos com reconhecimento óptico",
    roles: ["admin", "gestor", "tecnico"],
    steps: [
      { number: 1, action: "Aceder ao centro de digitalização", screen: "Digitalização", route: "/digitization" },
      { number: 2, action: "Criar lote de digitalização", screen: "Digitalização", route: "/digitization" },
      { number: 3, action: "Carregar imagens digitalizadas", screen: "Digitalização", route: "/digitization" },
      { number: 4, action: "Executar OCR nos documentos", screen: "OCR", route: "/ocr-processing" },
      { number: 5, action: "Classificar documentos processados", screen: "Classificação", route: "/classification" },
      { number: 6, action: "Revisão de qualidade", screen: "Revisão", route: "/quality-review" },
    ],
    requiredData: ["Ficheiros digitalizados", "Nome do lote", "Classificação (opcional)"],
    errors: [
      { condition: "Imagem ilegível", consequence: "OCR falha — requer reprocessamento" },
      { condition: "Formato não suportado", consequence: "Erro de upload" },
    ],
  },
  {
    id: "archive",
    name: "Arquivo e Retenção",
    description: "Gestão do arquivo documental e políticas de retenção",
    roles: ["admin", "gestor", "tecnico", "consulta"],
    steps: [
      { number: 1, action: "Aceder ao repositório de pastas", screen: "Pastas", route: "/folders" },
      { number: 2, action: "Navegar pela árvore classificativa", screen: "Pastas", route: "/folders" },
      { number: 3, action: "Consultar documentos arquivados", screen: "Arquivo", route: "/archive" },
      { number: 4, action: "Verificar prazos de retenção", screen: "Arquivo", route: "/archive" },
      { number: 5, action: "Marcar para destruição (se aplicável)", screen: "Arquivo", route: "/archive" },
    ],
    requiredData: ["Classificação documental", "Prazo de retenção"],
    errors: [
      { condition: "Documento ainda em uso", consequence: "Não pode ser destruído" },
      { condition: "Sem permissão para destruir", consequence: "Requer aprovação de admin/gestor" },
    ],
  },
  {
    id: "reports",
    name: "Relatórios e Estatísticas",
    description: "Geração de relatórios e análise de indicadores",
    roles: ["admin", "gestor"],
    steps: [
      { number: 1, action: "Aceder à página de relatórios", screen: "Relatórios", route: "/reports" },
      { number: 2, action: "Seleccionar período e filtros", screen: "Relatórios", route: "/reports" },
      { number: 3, action: "Visualizar gráficos e KPIs", screen: "Relatórios", route: "/reports" },
      { number: 4, action: "Exportar relatório (PDF/Excel)", screen: "Relatórios", route: "/reports" },
    ],
    requiredData: ["Período temporal", "Filtros (opcional)"],
    errors: [
      { condition: "Sem dados no período", consequence: "Gráficos vazios" },
      { condition: "Exportação falha", consequence: "Retry manual" },
    ],
  },
  {
    id: "user-management",
    name: "Gestão de Utilizadores",
    description: "Criação, edição e gestão de contas e permissões",
    roles: ["admin"],
    steps: [
      { number: 1, action: "Aceder à gestão de utilizadores", screen: "Utilizadores", route: "/users" },
      { number: 2, action: "Criar novo utilizador", screen: "Utilizadores", route: "/users" },
      { number: 3, action: "Atribuir role e unidade orgânica", screen: "Utilizadores", route: "/users" },
      { number: 4, action: "Gerir permissões detalhadas", screen: "Permissões", route: "/permissions" },
      { number: 5, action: "Configurar fluxos de trabalho", screen: "Fluxos", route: "/workflow-builder" },
    ],
    requiredData: ["Nome", "Email", "Password inicial", "Role", "Unidade orgânica"],
    errors: [
      { condition: "Email já registado", consequence: "Erro de duplicação" },
      { condition: "Role inválido", consequence: "Validação impede criação" },
    ],
  },
  {
    id: "ai-assistant",
    name: "Assistente IA",
    description: "Interacção com o assistente inteligente para consultas e orientação",
    roles: ["admin", "gestor", "tecnico", "consulta"],
    steps: [
      { number: 1, action: "Aceder ao assistente IA", screen: "Assistente IA", route: "/assistant" },
      { number: 2, action: "Escrever pergunta ou pedido", screen: "Assistente IA", route: "/assistant" },
      { number: 3, action: "Receber resposta contextualizada", screen: "Assistente IA", route: "/assistant" },
      { number: 4, action: "Seguir sugestões ou navegar para ecrãs sugeridos", screen: "Assistente IA", route: "/assistant" },
    ],
    requiredData: ["Pergunta em linguagem natural"],
    errors: [
      { condition: "Serviço IA indisponível", consequence: "Mensagem de erro temporário" },
      { condition: "Pergunta fora de contexto", consequence: "Resposta genérica" },
    ],
  },
];
