
User wants test users for each role (admin, gestor, tecnico, consulta) to test all flows.

Existing infrastructure:
- `create-user` edge function already exists and works (admin-only)
- `CreateUserModal` component exists in `/users` page
- Roles: admin, gestor, tecnico, consulta
- Existing admin: anicetojjc@gmail.com / 123456

Approach: Create 3 test users directly via the `create-user` edge function (called server-side with service role), since the user already has admin access. Simplest: create a one-off script/migration that uses Supabase admin API to provision users.

Better approach: use a temporary edge function call OR directly insert via admin API. Since plan mode is read-only, I'll plan to invoke the existing `create-user` function from a script using the admin's session, OR create a dedicated seed edge function.

Cleanest plan: create a one-time edge function `seed-test-users` that uses service role to create the 3 missing test users with predictable credentials, assign roles, and link to the default organization (MINAGRIF). Idempotent — skips if email exists.

## Plano: Criar utilizadores de teste para cada perfil

### Utilizadores a criar

| Email | Password | Perfil | Nome |
|-------|----------|--------|------|
| gestor@nodidoc.test | 123456 | gestor | Gestor Teste |
| tecnico@nodidoc.test | 123456 | tecnico | Técnico Teste |
| consulta@nodidoc.test | 123456 | consulta | Consulta Teste |

(O admin `anicetojjc@gmail.com / 123456` já existe.)

### Implementação

1. **Criar Edge Function `seed-test-users`** (one-shot, idempotente):
   - Usa service role para criar utilizadores via `auth.admin.createUser` com `email_confirm: true`
   - Para cada utilizador: verifica se já existe (skip se sim), cria, atribui role correspondente em `user_roles` (remove o default `consulta` quando necessário), associa `organization_id` da organização "MINAGRIF" no `profiles`
   - Protegida: apenas admin pode invocar (verifica `has_role`)
   - Retorna sumário: criados / já existentes / erros

2. **Invocar a função uma vez** após deploy para provisionar os 3 utilizadores.

3. **Atualizar memory** `mem://auth/quick-access-credentials` com as novas credenciais para acesso rápido durante testes.

### Opcional (recomendado)
Adicionar botões de "Acesso Rápido" para cada perfil na página `/auth`, similar ao botão admin existente, para facilitar troca rápida entre perfis durante o teste de fluxos.

### Ficheiros

| Ficheiro | Acção |
|----------|-------|
| `supabase/functions/seed-test-users/index.ts` | Criar (nova edge function) |
| `src/pages/Auth.tsx` | Adicionar 3 botões de acesso rápido (gestor/técnico/consulta) |
| `mem://auth/quick-access-credentials` | Atualizar com as 4 credenciais |
