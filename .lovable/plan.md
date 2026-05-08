# Plano — UI completa de gestão de Selos Físicos

## Estado actual

Já existem `PhysicalSealsList`, `PhysicalSealRegister`, `PhysicalSealDetail` montadas em `/physical-seals/*`, e o hook `usePhysicalSeals` que fala directamente com a tabela. Vão ser **reescritas** para cumprir a nova especificação e passar a consumir as Edge Functions já criadas (`register-seal`, `register-movement`, `validate-seal-public`, `verify-pdf-integrity`). As rotas pedidas `/seals`, `/seals/new`, `/seals/:id` são adicionadas como **rotas canónicas**, mantendo `/physical-seals/*` como aliases para não partir links existentes.

## 1. Cliente API tipado — `src/lib/api/seals.ts`

Funções (todas com tratamento de erros e mensagens PT-PT formal via `sonner`):

- `listSeals(filters: { type?: 'ENT'|'SAI'|'INT'|'ALL'; from?: string; to?: string; search?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc'|'desc' })` — lê `physical_seals` directamente (RLS já filtra por organização) com `range()` e `count: 'exact'`.
- `getSeal(id)` — `physical_seals` por id (`maybeSingle`).
- `getSealMovements(sealId)` — `seal_movements` ordenado por `created_at asc`, joining com `profiles` para nome/iniciais.
- `createSeal(form: FormData)` — `supabase.functions.invoke('register-seal', { body: formData })`.
- `cancelSeal(id, reason)` — `update physical_seals set status='cancelled', cancellation_reason, cancelled_at, cancelled_by`. (Não há edge function dedicada; respeita RLS.)
- `registerMovement({ seal_id, to_user_id, to_department, notes, scanned_qr })` — invoca `register-movement`.
- `listOrgMembers()` e `listOrgDepartments()` — para os selectores do modal de movimento (membros via `profiles` da org; departamentos via `distinct to_department from seal_movements where organization_id=...`).

Tipos exportados: `Seal`, `SealMovement`, `ProtocolType = 'ENT'|'SAI'|'INT'`, `MovementType`.

## 2. Componente `<SealLabel />` — `src/components/seals/SealLabel.tsx`

Props conforme spec (`protocolNumber`, `protocolType`, `createdAt`, `pdfHashTruncated`, `organizationName`, `qrPayload`, `duplicate?`).

Implementação:
- Container 50mm × 30mm via classes utilitárias com tamanhos em `mm` (Tailwind arbitrary values). Borda tracejada `border-dashed` em tom `ice`.
- Topo: nome da organização (truncado, `font-semibold text-[7pt]`).
- Coluna esquerda: `<QRCodeSVG value={qrPayload} size={...} />` da `qrcode.react`.
- Coluna direita: linhas com label/valor — `Protocolo`, `Data`, `Hash`. Tipografia institucional (Georgia para protocolo grande nas vistas detalhadas, sans para etiqueta).
- Rodapé: URL do portal (`VALIDATION_BASE_URL` via `import.meta.env` ou prop).
- Se `duplicate=true`: marca "DUPLICADO" rotada -45° no canto superior direito, vermelha 40% opacidade.
- CSS de impressão (`@media print { @page { size: 50mm 30mm; margin: 0; } }`) num bloco `<style>` interno para que possa ser usado tal-qual em janela de impressão (deixado preparado, sem botão activo agora).
- Sem QR → placeholder cinzento se `qrPayload` vazio.

## 3. Página `/seals` (lista)

Ficheiro: `src/pages/PhysicalSealsList.tsx` (reescrito).

Estrutura:
- `PageBreadcrumb` + título "Selos de Rastreabilidade" + botão **Novo Selo** (variant primário, `Link` para `/seals/new`).
- Barra de filtros (linha responsiva → grelha 2 colunas em mobile):
  - `Select` para tipo (ENT/SAI/INT/Todos).
  - `DateRangePicker` (composto por dois Popover+Calendar shadcn — usa o padrão já existente em outras páginas).
  - `Input` de pesquisa com ícone `Search` e debounce 300ms (`useDebouncedValue` local).
- Tabela shadcn:
  - Colunas: Protocolo (badge por tipo: ENT `bg-primary/15 text-primary`, SAI `bg-emerald-100 text-emerald-700`, INT `bg-amber-100 text-amber-700`), Documento (truncado 50), Remetente / Destinatário, Data (`dd/MM/yyyy HH:mm` via `date-fns/pt`), PDF (ícone `FileCheck` se hash existe, caso contrário `—`), Status (badge active/cancelled), Acções.
  - Cabeçalhos clicáveis para ordenação por `protocol_number`, `created_at`, `status`.
  - Acções por linha (dropdown ou ícones): Ver Detalhe (`Eye` → `/seals/:id`), Imprimir Etiqueta (`Printer` — abre `/seals/:id?print=1`, deixa stub para próximo prompt), Cancelar (`Ban` — só se `active`, abre `AlertDialog` com `Textarea` de razão).
  - Paginação: 20 por página, controlos `Pagination` shadcn.
- Estado de loading (skeleton rows) e empty state ("Nenhum selo registado.").

Substitui o uso do hook actual por `listSeals` chamada via `useQuery(["seals", filters], ...)`.

## 4. Página `/seals/new` (registo)

Ficheiro: `src/pages/PhysicalSealRegister.tsx` (reescrito).

Layout: `grid lg:grid-cols-[1fr_minmax(360px,420px)] gap-6`.

**Coluna esquerda — formulário** (react-hook-form + zod):
1. `RadioGroup` em "cards" para Tipo: ENT (ícone `ArrowDownToLine`), SAI (`ArrowUpFromLine`), INT (`Repeat`). Cada card destaca-se com borda `primary` quando seleccionado.
2. Título do documento — `Input` (max 200, contador, validação inline, borda vermelha em erro).
3. Assunto — `Textarea` (max 500, contador).
4. Remetente — `Input` (obrigatório se tipo=ENT). Mensagem de erro contextual.
5. Destinatário — `Input` (obrigatório se tipo=SAI).
6. PDF — zona drag&drop + `<input type="file" accept="application/pdf">`:
   - Validação no cliente: tipo MIME `application/pdf`, tamanho ≤ 25 MB.
   - Mostra nome, tamanho legível, badge "Hash será calculado: SHA-256", botão remover (`X`).

Botão submeter "Registar e Gerar Etiqueta" — desactivado enquanto inválido; estado loading com `Loader2`.

**Coluna direita — preview**: `<SealLabel />` em modo placeholder (protocolo `XXX-2026-XXXXX`, QR vazio cinzento) que actualiza `organizationName` e mostra os dados que ainda não dependem do servidor.

**Após sucesso** (resposta de `register-seal`): substitui o form por uma `Card` de sucesso com:
- `<SealLabel />` real com `qrPayload`, `pdfHashTruncated`.
- Botões: **Imprimir Etiqueta** (stub), **Imprimir Duplicado** (renderiza nova `<SealLabel duplicate />`, stub), **Registar Outro** (reset), **Ver Detalhes** (`/seals/{id}`).

Toast PT-PT formal em sucesso/erro. Erros 413/415 do servidor mapeados a mensagens claras.

## 5. Página `/seals/:id` (detalhe)

Ficheiro: `src/pages/PhysicalSealDetail.tsx` (reescrito).

3 secções:

**Secção 1 — Cabeçalho**
- `protocol_number` em `font-serif text-[28pt] font-bold text-primary`.
- Badges de tipo e status, datas de criação (e cancelamento + razão se aplicável).
- Acções: Imprimir Etiqueta (stub), Cancelar (se active).

**Secção 2 — Card "Dados do documento"**
- Título, assunto, remetente, destinatário em grelha 2 colunas.
- Hash SHA-256 completo numa caixa monoespaçada com botão "Copiar" (`navigator.clipboard`) e truncamento visual `font-mono text-xs break-all`.
- Botão "Descarregar PDF" se `pdf_storage_path` existe → `supabase.storage.from('seal-pdfs').createSignedUrl(path, 60)`.

**Secção 3 — Card "Cadeia de Custódia"** (timeline vertical)
- Lista de `seal_movements` com:
  - Ícone por tipo: `initial` `Sparkles`, `handoff` `ArrowRightLeft`, `archive` `Archive`, `return` `Undo2`.
  - Linha "De → Para" com avatares (iniciais) baseados em `profiles.full_name`.
  - Departamento e notas; data/hora `dd/MM/yyyy HH:mm`; chip "Por leitura de QR" se `scanned_qr`.
- Botão "Registar Movimento" abre **modal** `RegisterMovementModal`.

**Modal `RegisterMovementModal`**:
- `Combobox` (shadcn `Command` + `Popover`) com pesquisa, mostrando membros da organização (`listOrgMembers`).
- `Combobox` de departamento com autocomplete (lista vinda de `listOrgDepartments` + opção "Outro" que abre Input livre).
- `Textarea` notas (max 2000).
- `Switch` "Foi por leitura de QR?".
- Submete via `registerMovement` → invalida `["seal-movements", id]`.

## 6. Routing — `src/App.tsx`

Adicionar (manter os antigos como aliases):

```text
/seals          → PhysicalSealsList
/seals/new      → PhysicalSealRegister
/seals/:id      → PhysicalSealDetail
```

Os 3 routes existentes em `/physical-seals/*` ficam apontando aos mesmos componentes para retro-compatibilidade.

## 7. Tema e tokens

Confirmar/adicionar em `tailwind.config.ts`/`index.css` (se ainda não presentes) tokens HSL para a paleta NODIDOC:
- `--seal-navy: 218 73% 15%` (#0A1F44)
- `--seal-gold: 42 47% 59%` (#C9A961)
- `--seal-ice: 215 41% 94%` (#E8EEF7)

Usar via classes utilitárias `bg-[hsl(var(--seal-navy))]` apenas dentro de `<SealLabel />` e cabeçalhos institucionais; resto do UI usa `primary`/`secondary` do design system.

## 8. Detalhes técnicos relevantes

- Toda a obtenção de `organization_name` (necessária para a etiqueta) usa hook leve `useCurrentOrganization()` (consulta `organizations` via `get_user_org_id`).
- Validação com `zod` + `@hookform/resolvers/zod`.
- Datas: `date-fns` com locale `pt`.
- Mensagens de erro/sucesso: `sonner` (`toast.success` / `toast.error`) — formal PT-PT, ex.: "Não foi possível registar o selo. Tente novamente.".
- Sem `localStorage`/`sessionStorage`. Estado de filtros guardado no URL via `useSearchParams`.

## 9. Fora de âmbito (para próximos prompts)

- Implementação real da impressão (modal de impressão / janela `window.print()` configurada).
- Portal público de validação (já existe `ValidateSeal.tsx` interno; o portal anónimo virá no prompt #4).
- Integração com `verify-pdf-integrity` na UI interna (não pedida aqui).

## Entregáveis

1. `src/lib/api/seals.ts` — cliente API tipado.
2. `src/components/seals/SealLabel.tsx` — etiqueta reutilizável.
3. `src/components/seals/RegisterMovementModal.tsx` — modal.
4. `src/hooks/useCurrentOrganization.ts` — hook leve.
5. `src/pages/PhysicalSealsList.tsx`, `PhysicalSealRegister.tsx`, `PhysicalSealDetail.tsx` — reescritas.
6. `src/App.tsx` — novas rotas `/seals`, `/seals/new`, `/seals/:id`.
7. Tokens da paleta NODIDOC em `index.css`/`tailwind.config.ts` se em falta.
