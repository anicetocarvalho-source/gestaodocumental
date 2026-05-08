# Plano — Edge Functions do Selo Físico de Rastreabilidade

## Resumo

Criar 4 Edge Functions (`register-seal`, `validate-seal-public`, `verify-pdf-integrity`, `register-movement`), 1 bucket privado de storage e 2 secrets. Não cria UI.

## 1. Infra-estrutura (migração + secrets)

**Migração SQL:**
- Criar bucket privado `seal-pdfs` (não público).
- RLS em `storage.objects` para `seal-pdfs`:
  - SELECT/INSERT/DELETE apenas por utilizadores cuja `get_user_org_id(auth.uid())::text` corresponda ao primeiro segmento do `name` (path: `{org_id}/{protocol_number}.pdf`). Acesso público é feito server-side via service role nas funções públicas.

**Secrets a adicionar (via add_secret):**
- `SEAL_SECRET` — string aleatória de 64 chars hex (gerada no momento).
- `VALIDATION_BASE_URL` — default `https://valida.nodidoc.ao`.
- `FRONTEND_ORIGIN` — origem permitida no CORS das funções autenticadas (ex.: URL preview/published).

Comando de geração local: `openssl rand -hex 32`.

## 2. CORS

Helper partilhado por função:
- **Funções autenticadas** (`register-seal`, `register-movement`): `Access-Control-Allow-Origin` = `FRONTEND_ORIGIN` (sem wildcard), `Vary: Origin`, métodos `POST, OPTIONS`.
- **Funções públicas** (`validate-seal-public`, `verify-pdf-integrity`): wildcard `*` permitido.

## 3. Edge Function: `register-seal`

`POST /register-seal` — multipart/form-data.

Fluxo:
1. Validar `Authorization: Bearer ...` via `supabase.auth.getClaims(token)`. 401 se inválido.
2. Cliente Supabase com JWT do utilizador (não service_role) para inserts → respeita RLS.
3. Ler form: `protocol_type`, `document_title`, `sender_name`, `recipient_name`, `subject`, `pdf_file`.
4. Validar com Zod: `protocol_type ∈ {ENT,SAI,INT}`, `document_title` 1–200, `subject` 1–2000.
5. Se `pdf_file` presente: validar MIME `application/pdf` (415) e tamanho ≤ 25 MB (413).
6. Obter `organization_id` via `get_user_org_id` (RPC) — `user_id` vem do JWT.
7. `protocol_number` ← `rpc('get_next_protocol_number', {org_id, ptype, yr})`.
8. Se PDF: SHA-256 (Web Crypto), upload para `seal-pdfs/{org_id}/{protocol_number}.pdf` (com cliente service_role apenas para storage upload por causa de path).
9. `validation_token` = HMAC-SHA256(`SEAL_SECRET`, `protocol_number || created_at_iso`) → hex, truncar 16 chars.
10. `qr_payload` = `${VALIDATION_BASE_URL}/v/${validation_token}`.
11. Insert em `physical_seals` (status default `active`).
12. Insert inicial em `seal_movements`: `movement_type='initial'`, `from_user_id=null`, `to_user_id=user_id`, `to_department=null`, `scanned_qr=false`.
13. Resposta: `{protocol_number, validation_token, qr_payload, pdf_hash, created_at}`.

Erros: 400 (Zod), 401, 413, 415, 500 (sem stack ao cliente; `console.error` no log).

## 4. Edge Function: `validate-seal-public`

`GET /validate-seal-public/{token}` — sem auth.

Fluxo:
1. Extrair `token` do path; validar `^[0-9a-f]{16}$`. 400 se inválido.
2. Cliente service_role (necessário porque é público e RLS bloqueia anónimos).
3. `physical_seals` por `validation_token` (`maybeSingle`).
4. 404 se não encontrado.
5. 410 se `status='cancelled'` com mensagem `Selo cancelado em {cancelled_at}: {cancellation_reason}`.
6. Buscar `organizations.name`.
7. Insert em `seal_validation_log` (best-effort, IP de `x-forwarded-for`/`cf-connecting-ip`, `user_agent`, `pdf_uploaded=false`).
8. Resposta SÓ com campos públicos: `status`, `protocol_number`, `protocol_type`, `organization_name`, `subject`, `created_at`, `has_pdf`, `pdf_hash_truncated` (8 chars).

Nunca devolve `sender_name`, `recipient_name`, `pdf_storage_path`, `created_by`, hash completo.

## 5. Edge Function: `verify-pdf-integrity`

`POST /verify-pdf-integrity/{token}` — sem auth, multipart.

Fluxo:
1. Validar token como acima.
2. Carregar selo (service_role). 404/410 conforme acima.
3. Se `pdf_hash` for null → 400 "Este selo não tem PDF associado para verificação".
4. Ler `pdf_file` (obrigatório, 25 MB máx, MIME pdf).
5. SHA-256 do upload → comparar com `pdf_hash`.
6. Insert em `seal_validation_log` (`pdf_uploaded=true`, `pdf_hash_match`).
7. Resposta: `{match, uploaded_hash_truncated, stored_hash_truncated, verified_at}`.

## 6. Edge Function: `register-movement`

`POST /register-movement` — JWT obrigatório, JSON.

Fluxo:
1. Validar JWT → `user_id`, `organization_id` (via `get_user_org_id`).
2. Cliente Supabase com JWT (RLS aplica-se).
3. Body Zod: `seal_id?` (uuid) OU `validation_token?` (16 hex), `to_user_id` (uuid), `to_department` (1–200), `notes?` (≤2000), `scanned_qr` (boolean).
4. Resolver selo por `seal_id` ou `validation_token`. 404 se não existir.
5. Validar `seal.organization_id === organization_id` do utilizador. 403 caso contrário.
6. Buscar último `seal_movements` para o `seal_id` (`order created_at desc limit 1`).
7. `from_user_id = ultimo?.to_user_id ?? null`; `from_department = ultimo?.to_department ?? null`.
8. `movement_type = to_department.toUpperCase().includes('ARQUIVO') ? 'archive' : 'handoff'`.
9. Insert em `seal_movements` e devolver registo criado.

## 7. Detalhes técnicos

```text
Estrutura final:
supabase/functions/
  register-seal/index.ts
  validate-seal-public/index.ts
  verify-pdf-integrity/index.ts
  register-movement/index.ts
```

Decisões:
- **Não tocar** na função `validate-seal` existente (continua a servir a UI interna autenticada com filtros e histórico). Esta nova `validate-seal-public` é o endpoint estritamente público com payload mínimo.
- Web Crypto API (`crypto.subtle.digest('SHA-256', ...)` e `importKey`/`sign` para HMAC) — sem dependências.
- Validação com `zod` via `npm:zod@3`.
- Storage upload usa cliente service_role apenas para escrever no bucket privado; reads públicos são via download em ficheiro próprio (não faz parte deste prompt) — as funções públicas não devolvem o PDF, só o hash truncado.

## 8. Entregáveis

1. Migração: bucket `seal-pdfs` + policies de storage.
2. 4 ficheiros `index.ts` das funções.
3. `add_secret` para `SEAL_SECRET`, `VALIDATION_BASE_URL`, `FRONTEND_ORIGIN`.
4. No final, no chat: comando `openssl rand -hex 32` e exemplos cURL para cada endpoint.
