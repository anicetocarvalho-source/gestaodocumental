

## Check-in/Check-out de Documentos

### Objectivo
Implementar bloqueio de edição concorrente em documentos com indicação visual de quem tem o documento em check-out e desbloqueio automático por timeout.

### 1. Migração de base de dados

Criar tabela `document_checkouts`:

```sql
CREATE TABLE public.document_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE,
  checked_out_by UUID NOT NULL,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours'),
  notes TEXT,
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

ALTER TABLE public.document_checkouts ENABLE ROW LEVEL SECURITY;
```

RLS policies:
- **SELECT**: todos os authenticated podem ver (para mostrar quem bloqueou)
- **INSERT**: authenticated users podem fazer check-out
- **DELETE**: o próprio utilizador que fez check-out, admins, ou quando expirado
- **UPDATE**: o próprio utilizador ou admins

Função `security definer` para verificar se um documento está em check-out válido (não expirado):

```sql
CREATE FUNCTION public.is_document_checked_out(doc_id UUID)
RETURNS TABLE(checked_out boolean, user_id uuid, full_name text, expires_at timestamptz)
```

### 2. Hook `useDocumentCheckout`

Novo ficheiro `src/hooks/useDocumentCheckout.ts`:
- `useCheckoutStatus(documentId)` — query que retorna o estado actual do check-out (polling a cada 30s)
- `useCheckOut()` — mutation para fazer check-out (insere na tabela, falha se já existe registo não expirado)
- `useCheckIn()` — mutation para devolver o documento (apaga o registo)
- `useForceCheckIn()` — mutation para admin forçar desbloqueio
- `useExtendCheckout()` — mutation para renovar o timeout

### 3. Componente `DocumentCheckoutBanner`

Novo ficheiro `src/components/documents/DocumentCheckoutBanner.tsx`:
- Banner amarelo/vermelho no topo do `DocumentDetail` mostrando:
  - **Se eu tenho check-out**: "Documento em edição por si. Expira em X min." + botão "Devolver"
  - **Se outro utilizador tem**: "Documento bloqueado por [Nome] desde [hora]. Expira em [hora]." + botão "Forçar Desbloqueio" (só admin)
  - **Se expirado**: apaga automaticamente o registo na próxima query
- Ícone de cadeado no header do documento

### 4. Integração no `DocumentDetail.tsx`

- Importar `DocumentCheckoutBanner` e renderizar antes do conteúdo principal
- Desabilitar botões de edição/workflow quando documento está em check-out por outro utilizador
- Adicionar botão "Check-out para Edição" nas acções do documento
- O check-in automático acontece via limpeza: a query ignora registos com `expires_at < now()`

### 5. Indicação visual na lista de documentos

- No `Documents.tsx` / tabela de documentos, mostrar ícone de cadeado ao lado de documentos em check-out
- Query join com `document_checkouts` na listagem

### Ficheiros a criar/editar

| Ficheiro | Acção |
|----------|-------|
| `supabase/migrations/...` | Nova tabela + RLS + função |
| `src/hooks/useDocumentCheckout.ts` | **Novo** — hook completo |
| `src/components/documents/DocumentCheckoutBanner.tsx` | **Novo** — banner visual |
| `src/pages/DocumentDetail.tsx` | Editar — integrar banner + desabilitar acções |
| `src/hooks/useDocuments.ts` | Editar — join com checkouts na listagem |
| `src/pages/Documents.tsx` | Editar — ícone de cadeado na tabela |

