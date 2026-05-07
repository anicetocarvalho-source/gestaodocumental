
# Plano: Selo Físico de Rastreabilidade — Schema da Base de Dados

Esta migração cria a fundação de dados para a feature. Sem UI nem Edge Functions ainda.

## Desvio importante face ao pedido

O pedido especifica RLS via `auth.jwt() ->> 'organization_id'`. Este projeto **não coloca `organization_id` no JWT**; usa a função `public.get_user_org_id(auth.uid())` (SECURITY DEFINER, lê de `profiles`). Vou usar esse padrão, que é o já adotado em todo o NODIDOC e é equivalente em segurança. Confirmem se preferem outra abordagem antes de aprovar.

## O que vai ser criado

### 1. Tabela `audit_log` (nova — não existe)
Append-only. Colunas: `id, table_name, record_id, action, old_data jsonb, new_data jsonb, user_id, created_at`.
- RLS ON. Policy: `INSERT` permitido (executado via triggers SECURITY DEFINER); `SELECT` para admin/gestor da mesma org (filtra cruzando `record_id` quando aplicável — aqui simplificado para admin/gestor).
- **Sem policies de UPDATE/DELETE** → bloqueia mutação. Adicionalmente, `REVOKE UPDATE, DELETE` em `authenticated, anon`.

### 2. Tabela `physical_seals`
Conforme spec, com FK `organization_id → organizations(id)` e `created_by → auth.users(id)`.
- Trigger `BEFORE INSERT` para preencher `organization_id` automaticamente via `get_user_org_id(auth.uid())` se vier null (padrão NODIDOC).
- CHECKs em `protocol_type` e `status`.

### 3. Tabela `seal_movements` (cadeia de custódia)
Conforme spec. FK para `physical_seals(id)` ON DELETE CASCADE.

### 4. Tabela `seal_validation_log`
Conforme spec. `seal_id` ON DELETE SET NULL (preserva analítica).

### 5. Tabela auxiliar `protocol_counters`
```
(organization_id uuid, protocol_type text, year int, counter int, PRIMARY KEY(organization_id, protocol_type, year))
```

### 6. Função `get_next_protocol_number(org_id uuid, ptype text, yr int) returns text`
- `SECURITY DEFINER`, `SET search_path = public`.
- Faz `INSERT ... ON CONFLICT DO UPDATE SET counter = protocol_counters.counter + 1 RETURNING counter` (atómico, sem race conditions, sem `LOCK TABLE`).
- Devolve `format('%s-%s-%s', ptype, yr, lpad(counter::text, 5, '0'))` → ex: `ENT-2026-00417`.
- Valida `ptype IN ('ENT','SAI','INT')`.

### 7. Triggers de auditoria
Função `public.log_audit_event()` SECURITY DEFINER que insere em `audit_log` com `TG_OP`, `TG_TABLE_NAME`, `OLD/NEW` em jsonb e `auth.uid()`.
Triggers `AFTER INSERT OR UPDATE OR DELETE` em `physical_seals` e `seal_movements`.

### 8. Índices (todos os pedidos)
- `physical_seals`: `(organization_id, protocol_number) UNIQUE`, `(validation_token)` UNIQUE já no constraint, `(organization_id, created_at DESC)`, `(pdf_hash) WHERE pdf_hash IS NOT NULL`.
- `seal_movements`: `(seal_id, created_at DESC)`, `(to_user_id, created_at DESC)`.
- `seal_validation_log`: `(seal_id, validated_at DESC)`, `(validation_token, validated_at DESC)`.

## Policies RLS — resumo

| Tabela | Operação | Quem | Condição |
|---|---|---|---|
| physical_seals | SELECT | authenticated | `organization_id = get_user_org_id(auth.uid())` |
| physical_seals | INSERT | authenticated | mesma org + `created_by = auth.uid()` |
| physical_seals | UPDATE | authenticated | mesma org (apenas admin/gestor cancelar — via `has_any_role`) |
| seal_movements | SELECT | authenticated | seal pertence à org do user |
| seal_movements | INSERT | authenticated | seal pertence à org + `to_user_id` é do mesmo tenant |
| seal_validation_log | INSERT | anon, authenticated | `true` (portal público) |
| seal_validation_log | SELECT | authenticated | seal pertence à org do user |
| audit_log | INSERT | (definer) | trigger SECURITY DEFINER |
| audit_log | SELECT | authenticated | `has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])` |
| audit_log | UPDATE/DELETE | — | sem policy + REVOKE |

## Exemplo de execução de `get_next_protocol_number`

```sql
SELECT public.get_next_protocol_number(
  '00000000-0000-0000-0000-000000000001'::uuid, 'ENT', 2026
);
-- → 'ENT-2026-00001'

SELECT public.get_next_protocol_number(
  '00000000-0000-0000-0000-000000000001'::uuid, 'ENT', 2026
);
-- → 'ENT-2026-00002'

SELECT public.get_next_protocol_number(
  '00000000-0000-0000-0000-000000000001'::uuid, 'SAI', 2026
);
-- → 'SAI-2026-00001'  -- contador independente por tipo
```

## O que NÃO está incluído (por design)
- Sem UI, sem Edge Functions, sem geração de QR, sem upload PDF, sem cálculo SHA-256.
- Sem alterações a tabelas existentes.
- Storage: o bucket `documents` já existe e será reutilizado quando a feature de upload for implementada.

## Após aprovação
Executo a migração via ferramenta de migrações Supabase (1 ficheiro SQL único). Os tipos TypeScript em `src/integrations/supabase/types.ts` serão regenerados automaticamente.
