# Auditoria e Activação de Funcionalidades Incompletas

Fiz uma varredura completa do frontend. A plataforma está, na sua maioria, ligada a dados reais (Dashboard, Documentos, Processos, Despachos, Aprovações, Utilizadores, Selos, Auditoria). Mas existem pontos concretos onde a UI existe e a acção não faz nada.

## O que está em falta (confirmado no código)

### 1. Parecer em Processos — o caso que referiste
- O botão "Novo Parecer" (`ProcessDetail.tsx`) não tem acção nenhuma.
- Já existe no backend uma função pronta para gravar pareceres (com numeração automática PAR-TEC / PAR-JUR / DESP), mas nunca chega a ser chamada pela interface.
- O botão "Ver Completo" de um parecer também não abre nada.

### 2. Visualizador de Documento (`/documents/:id/view`) — página inteiramente fictícia
- Os dados mostrados (título, versões, log de auditoria, etiquetas) são fixos no código, não vêm da base de dados. Nem sequer lê o ID do documento do endereço.
- A "área do PDF" é um desenho simulado, não mostra o ficheiro real.
- Sem acção: Descarregar, Imprimir, Copiar Link, Partilhar, Adicionar a Processo, adicionar etiqueta, e botões do histórico de versões.

### 3. Acções soltas noutras páginas
- Detalhe do Documento: "Visualizar" e "Remover" anexo sem acção.
- Repositório: botões em lote "Classificar", "Mover", "Transferir" sem acção.
- Processos: botão "Exportar" sem acção.
- Criar Processo: pré-visualizar anexo sem acção.
- Centro de Digitalização: "Iniciar Digitalização", "Atribuir Operador", "Classificar" (lote) e "Aprovar"/"Rejeitar" da revisão de qualidade sem acção.

### 4. Definições — secções decorativas
- Sessões activas, backups recentes e chave de API são listas/valores inventados no código.
- Sem acção: Carregar Logótipo, Renovar Certificado, Configurar 2FA, Terminar sessões, Regenerar API key, Restaurar/Baixar backup.

## Proposta de execução (por fases, da maior para a menor prioridade)

**Fase 1 — Parecer em Processos (fecha o problema que levantaste)**
- Novo modal "Emitir Parecer": tipo (técnico, jurídico, despacho), decisão (favorável, desfavorável, informativo), resumo e conteúdo, com validação inline em PT-PT.
- Liga o botão à função de gravação já existente; a lista de pareceres actualiza de imediato.
- "Ver Completo" passa a abrir o conteúdo integral do parecer.
- Respeita a permissão `processes.addParecer` já definida.

**Fase 2 — Visualizador de Documento a sério**
- Passa a carregar o documento real pelo ID do endereço (título, metadados, versões, anexos, etiquetas, histórico).
- Mostra o ficheiro real (PDF/imagem) a partir do armazenamento; estado próprio quando não há ficheiro.
- Activa Descarregar, Imprimir, Copiar Link e gestão de etiquetas; grava a classificação em vez de a descartar.

**Fase 3 — Acções soltas**
- Anexos: pré-visualizar e remover (com confirmação).
- Repositório: classificar/mover em lote; "Transferir" como exportação da selecção.
- Processos: exportar lista em CSV, no mesmo padrão já usado noutras páginas.
- Digitalização: ligar "Iniciar Digitalização", atribuição de operador, classificação em lote e aprovar/rejeitar na revisão de qualidade.

**Fase 4 — Definições**
- Remover os blocos puramente decorativos ou substituí-los por dados reais quando existirem (sessões via sessão actual, logótipo via armazenamento).
- Os que exigem infraestrutura não disponível (backups, API keys, 2FA) ficam claramente marcados como indisponíveis em vez de aparentarem funcionar.

## Notas técnicas
- Fase 1 usa a mutation `useAddOpinion` de `src/hooks/useProcesses.ts` (já implementada, nunca importada) e um novo `src/components/processes/AddOpinionModal.tsx`.
- Fase 2 reescreve `src/pages/DocumentViewer.tsx` sobre os hooks existentes `useDocument`/`useDocumentAttachments` e URLs assinados do armazenamento.
- Exportações reutilizam o padrão de `ExportMovements` / `ExportRepository`.
- Nenhuma alteração de schema é necessária nas fases 1 a 3.
