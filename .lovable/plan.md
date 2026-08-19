# Controlo Documental Físico + Gestão Documental Completa

Objectivo: completar o NODIDOC face às duas soluções descritas, reutilizando o módulo de Selo Físico (QR) já existente e acrescentando a gestão de localização física hierárquica, empréstimo/devolução e integração externa.

## O que já existe (aproveitar)

- Selo Físico com QR, protocolo automático (ENT/SAI/INT), etiquetas, impressão (Agente Local, WebUSB, navegador) e portal público de validação.
- Movimentos de selo (handoff, arquivo, retorno) com marcação de QR escaneado e timeline.
- GED: documentos, anexos, digitalização com OCR, classificação, versões, check-in/check-out.
- Workflow de aprovação, assinatura electrónica, perfis/permissões (Admin, Gestor, Técnico, Consulta), auditoria (`audit_log` + painel Sistema), relatórios e dashboards.

## O que falta construir

### 1. Localização física hierárquica

Nova estrutura Depósito > Sala > Estante > Prateleira > Caixa/Pasta, com etiqueta QR própria em cada contentor.

- Árvore de localizações (criar, editar, desactivar, navegar).
- Cada contentor tem código único e QR imprimível (reutiliza o motor de etiquetas existente).
- Ecrã "Onde está?": pesquisa por documento ou por código, mostrando o caminho completo da localização.
- Mapa de ocupação por depósito/sala (quantos documentos/caixas em cada contentor).

### 2. Rastreamento por leitura de QR

- Ecrã de leitura contínua (câmara do telemóvel ou leitor tipo teclado) para operar em série sem rato.
- Acções rápidas após leitura: Entrada, Saída (empréstimo), Devolução, Transferência de localização, Arquivo.
- Cada leitura regista automaticamente utilizador responsável, data/hora e localização de origem/destino.

### 3. Empréstimo e devolução

- Registo de saída com destinatário (utilizador ou unidade), motivo e prazo de devolução.
- Lista de documentos em atraso, com alerta e destaque no dashboard.
- Devolução com confirmação de reposição na localização de origem ou noutra.

### 4. Histórico e consulta

- Histórico unificado de movimentações por documento/caixa, com filtros por tipo, período, utilizador e localização.
- Exportação CSV do histórico.
- Etiquetas de documento físico ligadas ao registo GED correspondente (do físico para o digital e vice-versa).

### 5. Integração com ERP / sistemas externos

- Chaves de API por organização com âmbitos de leitura/escrita.
- Endpoints para consulta de documentos, estado e localização, e registo de movimentos.
- Webhooks de eventos (movimento registado, documento arquivado, prazo excedido).
- Página de gestão de integrações com registo de chamadas.

### 6. Relatórios do arquivo físico

- Indicadores: documentos por localização, taxa de ocupação, empréstimos activos e em atraso, movimentos por utilizador/período.
- Adicionados como novo separador nos Relatórios existentes.

## Detalhes técnicos

- Novas tabelas: `storage_locations` (auto-referenciada, com `level` e `path`), `document_locations` (posição actual + histórico), `document_loans`, `api_keys`, `api_key_logs`, `webhook_endpoints`.
- Todas com `organization_id`, GRANTs explícitos, RLS por `get_user_org_id()` e triggers `log_audit_event` para auditoria imutável, seguindo o padrão já usado nos selos.
- Numeração de contentores por função atómica idêntica a `get_next_protocol_number`.
- Leitura de QR no browser com biblioteca de scanner via câmara; leitores USB funcionam como entrada de teclado no mesmo campo.
- Etiquetas de contentor reutilizam `sealLabelPdf.ts`, `zpl.ts` e `PrintLabelDialog`.
- API externa através de Edge Functions com validação de chave por hash, sem expor a chave após criação.

## Faseamento sugerido

1. Localização física hierárquica + etiquetas de contentor.
2. Leitura de QR e registo de movimentos com localização.
3. Empréstimo/devolução e alertas de atraso.
4. Histórico unificado, consulta e exportação.
5. Relatórios do arquivo físico.
6. API/webhooks para ERP.
