# Auditoria: o que ainda não está 100% operacional

Varri a plataforma inteira à procura de botões sem acção, blocos com dados fixos no código e módulos duplicados. A grande maioria dos fluxos (Documentos, Processos, Pareceres, Despachos, Aprovações, Selos, Arquivo Físico, Rastreabilidade, Relatórios, Digitalização, Assistente) está ligada a dados reais. Abaixo está apenas o que confirmei estar incompleto, com a linha exacta no código.

## Confirmado sem acção

### 1. Centro de Digitalização (`DigitizationCenter.tsx`)
- Botão "Atribuir" operador num documento digitalizado não faz nada (linha ~660).
- No painel lateral de revisão, "Aprovar" e "Rejeitar" não têm acção (linhas ~1170-1174) — enquanto a página dedicada `/quality-review` já aprova e rejeita a sério. Ou seja, há dois sítios para a mesma tarefa e só um funciona.

### 2. Fila de Aprovações (`ApprovalQueue.tsx`)
- "Aprovar Seleccionados" funciona; "Rejeitar Seleccionados" (linha ~627) e "Comentário em Massa" (linha ~635) não têm acção.

### 3. Arquivo (`Archive.tsx`)
- "Descarregar" da barra de selecção (linha ~363) e o ícone de descarregar por linha (linha ~695) não fazem nada.

### 4. Histórico de Versões (`DocumentVersionHistory.tsx`)
- "Baixar versão" (linha ~289) sem acção.

### 5. Classificação Documental (`DocumentClassification.tsx`)
- Ícone de descarregar num item da lista (linha ~1789) sem acção.

### 6. Modelos de Processo (`ProcessTemplates.tsx`)
- Botão "Importar" (linha ~340) sem acção.

### 7. Definições (`Settings.tsx`) — a área mais incompleta
- "Carregar Logótipo" (linha ~522) — sem upload.
- "Eliminar Organização" (linha ~649) — botão destrutivo sem qualquer efeito nem confirmação.
- "Renovar Certificado" digital (linha ~1048) — decorativo.
- 2FA "Configurar" (linha ~1291) — decorativo.
- Integrações: "Configurar" de cada integração ligada (linha ~1437) — sem acção.
- Bloco "Chaves de API" diz que a emissão "será disponibilizada" — mas a página `/api-integrations` já gere chaves e webhooks a sério contra a base de dados. Texto desactualizado a contradizer uma funcionalidade que existe.

## Proposta de correcção, por prioridade

**Prioridade 1 — acções que o utilizador espera que funcionem**
- Rejeição em massa na Fila de Aprovações (com motivo obrigatório) e comentário em massa.
- Descarregar no Arquivo (individual e em lote) e no Histórico de Versões, usando URLs assinados do armazenamento, tal como já se faz no Visualizador de Documento.
- Descarregar na Classificação Documental.

**Prioridade 2 — Centro de Digitalização**
- Ligar "Atribuir" operador (selecção de utilizador da organização, grava no documento digitalizado).
- Remover o painel de revisão duplicado e encaminhar "Aprovar/Rejeitar" para `/quality-review`, que já tem a lógica completa — evita manter dois caminhos divergentes.

**Prioridade 3 — Definições**
- "Carregar Logótipo": upload real para o armazenamento e gravação nas definições da organização.
- "Eliminar Organização": diálogo de confirmação por escrita do nome, restrito a admin; se a eliminação global não for desejável, substituir por desactivação.
- Actualizar o texto das Chaves de API para remeter para `/api-integrations`.
- Certificado Digital, 2FA e "Configurar" de integrações: marcar claramente como indisponíveis (estado desactivado com nota) em vez de aparentarem funcionar, até haver infra-estrutura para os suportar.

**Prioridade 4 — Modelos de Processo**
- "Importar" a partir de JSON exportado, ou remover o botão se a importação não for prioritária.

## Notas técnicas
- Descargas reutilizam `supabase.storage.createSignedUrl` já usado em `DocumentViewer.tsx`.
- Rejeição em massa reutiliza a mutation existente em `useDocumentApprovals.ts`, em ciclo resiliente com relatório de sucessos/falhas (mesmo padrão de `handleBulkDelete` em `Documents.tsx`).
- Atribuição de operador escreve em `scanned_documents` (coluna de operador já existente); confirmo o nome exacto antes de implementar.
- Logótipo precisa de um bucket de armazenamento para activos da organização e de uma coluna/entrada em `organization_settings`.
- Nenhuma destas correcções altera fluxos de assinatura ou auditoria.
