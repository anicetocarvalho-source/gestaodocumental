## Portal Público de Validação `/v/:token`

Construir uma rota pública, sem auth, dedicada à validação institucional de selos NODIDOC, com 4 estados, integridade de PDF e respeito estrito por privacidade (sem PII).

### 1. Rota e isolamento de auth

- Adicionar em `src/App.tsx` duas novas rotas **fora** do `ProtectedRoute`:
  - `/v/:token` → `<PublicValidate />`
  - `/v` (sem token) → estado "Selo não encontrado"
- Manter as rotas internas `/validate-seal/*` existentes intactas (uso interno).
- Garantir que `AuthProvider` não força redirect quando o utilizador é anónimo nesta rota (já não força — `ProtectedRoute` é o único guard).

### 2. Edge Function — ajuste mínimo (sem PII)

A função `validate-seal` actualmente devolve `sender_name` e `recipient_name` (PII). O portal público não pode expor isto.

Opções:
- **(A) Adicionar parâmetro `public: true`** ao body de `validate-seal`. Quando `true`, omitir `sender_name`, `recipient_name` e detalhes de movimentos com nomes/departamentos. (Recomendado — preserva compatibilidade.)
- (B) Criar nova função `validate-seal-public` espelho da actual mas sem PII.

Vou usar (A): a UI pública chama com `{ token, public: true, pdf_hash? }` e a função filtra a resposta. A UI interna continua a receber tudo.

A resposta pública conterá apenas:
`protocol_number`, `protocol_type`, `document_title`, `subject` (truncado a 200 chars), `created_at`, `has_pdf_hash`, `organization_name`, `status`, `cancelled_at`, `cancelled_reason`, `pdf_hash` (apenas primeiros 8 chars), `pdf_hash_match`.

### 3. Página `src/pages/PublicValidate.tsx`

Layout único, max-width 720px, mobile-first, system fonts, sem dependências externas de fonts.

Estrutura:

```text
┌─────────────────────────────────┐
│  Banda navy #0A1F44             │
│  NODIDOC · Portal Público       │
├─────────────────────────────────┤
│  Banner de estado               │
│  Card de metadados              │
│  Verificação de integridade PDF │
│  Nota legal                     │
│  Footer minimal                 │
└─────────────────────────────────┘
```

Quatro estados:
1. **Loading** — spinner + "A verificar selo..."
2. **Válido** (`valid: true`) — banner verde `#1F7A5C` "SELO VÁLIDO" + card metadados + secção verificação PDF (se `has_pdf_hash`).
3. **Cancelado** (`status: 'cancelled'`) — banner vermelho `#B83A3A` "SELO CANCELADO" + data + razão + restantes metadados desbotados (`opacity-60`).
4. **Não encontrado** (resposta sem `seal` ou `valid:false` com erro) — card cinzento, mensagem genérica, sem detalhes técnicos.

### 4. Verificação de integridade PDF

- Componente interno `<PdfIntegrityCheck sealHash={...} token={...} />`:
  - Drag & drop + `<input type="file" accept="application/pdf">`
  - Validar tipo MIME e tamanho ≤ 25MB inline (sem toasts).
  - Calcular SHA-256 no browser via `crypto.subtle.digest('SHA-256', arrayBuffer)` (não enviar ficheiro para servidor).
  - Re-chamar `validate-seal` com `pdf_hash` para registar tentativa no `seal_validation_log` (ficheiro continua sem sair do browser).
  - Mostrar dois banners possíveis (✓ íntegro / ✗ divergente) + comparação lado-a-lado dos primeiros 8 chars.
  - Botão "Verificar outro ficheiro" reinicia.

### 5. SEO, meta e privacidade

Em `index.html` não dá para personalizar por rota. Solução: usar `react-helmet-async` se já instalado, senão um pequeno hook que actualiza `document.title` e meta tags ao montar:

- `<title>`: `Validação de Selo {protocol_number} · NODIDOC` (ou `Validação de Selo · NODIDOC` se não encontrado).
- `<meta name="description">`: "Verificação pública de autenticidade de documento institucional via NODIDOC."
- `<meta name="robots" content="noindex, nofollow">`
- `<html lang="pt-PT">` — definir via `document.documentElement.lang = 'pt-PT'`.
- Open Graph genérico: título "NODIDOC — Validação de Selo" e descrição genérica (sem dados do selo).

### 6. Design tokens

Adicionar a `src/index.css` (ou re-aproveitar se existirem):

```css
--seal-public-navy: 218 73% 16%;     /* #0A1F44 */
--seal-public-text: 217 26% 15%;     /* #1A2332 */
--seal-public-success: 158 60% 30%;  /* #1F7A5C */
--seal-public-danger: 0 53% 48%;     /* #B83A3A */
--seal-public-gold: 41 49% 60%;      /* #C9A961 */
```

E classes utilitárias `bg-seal-success`, `bg-seal-danger`, `text-seal-navy` no `tailwind.config.ts`.

Tipografia: cabeçalho com `font-family: Georgia, 'Times New Roman', serif`; corpo com `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`. Protocolo em `ui-monospace, Menlo, Consolas, monospace`.

### 7. Acessibilidade

- `lang="pt-PT"` no `<html>` enquanto a rota está activa.
- Contraste verificado AA (navy/branco, success/branco, danger/branco).
- Estados de erro com ícone + texto + cor (não só cor).
- Inputs e botões com `aria-label` e `aria-describedby` para mensagens de validação.
- Drag&drop também acessível via clique (botão visível).

### 8. Ficheiros a criar/editar

**Criar**
- `src/pages/PublicValidate.tsx` — página principal.
- `src/components/seals/public/StateBanner.tsx` — banner reutilizável.
- `src/components/seals/public/PdfIntegrityCheck.tsx` — secção upload + hash.
- `src/components/seals/public/SealMetadataCard.tsx` — card de metadados.
- `src/lib/api/sealsPublic.ts` — wrapper `validatePublic(token, pdfHash?)` usando `fetch` directo (sem `supabase.functions.invoke` para não exigir client autenticado).
- `src/lib/hooks/usePageMeta.ts` — hook para title/meta/robots.

**Editar**
- `src/App.tsx` — adicionar rotas `/v` e `/v/:token`.
- `supabase/functions/validate-seal/index.ts` — aceitar `public: boolean`; quando `true`, remover PII da resposta e dos movimentos.
- `src/index.css` + `tailwind.config.ts` — tokens de cor do portal público.

### 9. Fora de âmbito

- QR codes nas etiquetas (já feito noutra fase).
- Analytics/tracking de terceiros — explicitamente não.
- i18n — apenas pt-PT.
- Fontes externas — apenas system fonts.