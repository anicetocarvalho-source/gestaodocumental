

## Multi-Tenancy: Isolamento de Dados por Organização

### Contexto

A tabela `organizations` já existe (criada no Super-Admin dashboard). Falta:
1. Adicionar `organization_id` às tabelas principais
2. Associar utilizadores a organizações (via `profiles`)
3. Actualizar RLS para isolar dados
4. Criar fluxo de registo de nova organização
5. Actualizar queries frontend para funcionar com o novo modelo

### Escala do impacto

**387 queries** em **16 ficheiros** referenciam tabelas afectadas. Isto é uma refactoring estrutural profundo.

### 1. Migração de base de dados

Adicionar `organization_id` a todas as tabelas principais:

```text
profiles                 ← FK para organizations (obrigatório)
documents                ← FK para organizations
processes                ← FK para organizations  
dispatches               ← FK para organizations
organizational_units     ← FK para organizations
document_movements       ← herda via document
protocol_entries         ← FK para organizations
classification_codes     ← FK para organizations (ou global)
document_types           ← FK para organizations (ou global)
notifications            ← herda via user
digitization_batches     ← FK para organizations
```

**Abordagem**: `organization_id` nullable inicialmente (para não quebrar dados existentes), com trigger para auto-preencher baseado no `profiles.organization_id` do utilizador autenticado.

**Função helper** `get_user_organization_id(uuid)` — SECURITY DEFINER que retorna o `organization_id` do utilizador.

### 2. RLS por organização

Actualizar **todas** as políticas RLS das tabelas acima para incluir filtro:
```sql
organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
```

Usar a função helper para evitar recursão.

### 3. Fluxo de registo de organização

Nova página `/register-organization` (pública ou admin-only):
- Formulário: nome, código, domínio, email contacto, plano
- Cria organização + primeiro utilizador admin
- Edge function `create-organization` que:
  1. Cria registo em `organizations`
  2. Cria utilizador via `auth.admin.createUser`
  3. Atribui role `admin` e `organization_id`

### 4. AuthContext + Profile

- Adicionar `organization_id` ao tipo `Profile` em `AuthContext.tsx`
- Expor `organizationId` no contexto para uso nos hooks

### 5. Hooks frontend

Actualizar queries em ~16 ficheiros para filtrar por `organization_id` quando aplicável. Na prática, o RLS cuida disto — mas inserts precisam incluir o campo.

Ficheiros afectados:
- `useDocuments.ts` — insert com `organization_id`
- `useProcesses.ts` — insert com `organization_id`  
- `useDispatches.ts` — insert com `organization_id`
- `useProtocol.ts` — insert com `organization_id`
- `useRepository.ts` — sem alteração (RLS filtra)
- `useDashboardStats.ts` — sem alteração (RLS filtra)
- `useMovements.ts` — sem alteração (herda do documento)
- `useSettings.ts` — verificar scope
- `useSuperAdmin.ts` — manter acesso global (admin vê tudo)

### Ficheiros a criar/editar

| Ficheiro | Acção |
|----------|-------|
| `supabase/migrations/...` | `organization_id` em ~10 tabelas + RLS + função helper + trigger auto-fill |
| `supabase/functions/create-organization/index.ts` | **Novo** — edge function para criar org + admin user |
| `src/contexts/AuthContext.tsx` | Editar — expor `organization_id` |
| `src/hooks/useDocuments.ts` | Editar — incluir `organization_id` nos inserts |
| `src/hooks/useProcesses.ts` | Editar — incluir `organization_id` nos inserts |
| `src/hooks/useDispatches.ts` | Editar — incluir `organization_id` nos inserts |
| `src/hooks/useProtocol.ts` | Editar — incluir `organization_id` nos inserts |
| `src/hooks/useDigitization.ts` | Editar — incluir `organization_id` nos inserts |
| `src/hooks/useSuperAdmin.ts` | Editar — stats por organização |
| `src/pages/SuperAdminDashboard.tsx` | Editar — vista de dados por organização |
| `src/types/database.ts` | Editar — adicionar `organization_id` aos tipos |

### Notas técnicas

- **SELECTs não mudam** — o RLS filtra automaticamente por organização
- **INSERTs precisam** do `organization_id` — via trigger automático (preenche se null) ou explícito
- **Super-admin** mantém visão global com política RLS separada (`has_role(admin)`)
- Tabelas de referência (`classification_codes`, `document_types`) podem ser globais ou per-org — recomendo per-org com opção de templates globais

