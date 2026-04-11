

## Dashboard de Super-Admin

### Objectivo
Criar uma página dedicada `/super-admin` com dashboard de gestão global da plataforma: organizações, quotas de armazenamento, estatísticas de uso por instituição e configurações globais. Acessível apenas ao role `admin`.

### 1. Migração de base de dados

Criar tabelas para suportar multi-tenancy básico e métricas:

```sql
-- Tabela de organizações (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  storage_quota_mb INTEGER NOT NULL DEFAULT 5120, -- 5GB default
  storage_used_mb INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 50,
  plan TEXT NOT NULL DEFAULT 'standard',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de configurações globais da plataforma
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS: apenas admin pode ver/gerir estas tabelas.

Seed de configurações globais iniciais (max upload size, manutenção, versão, etc.).

### 2. Nova página `SuperAdminDashboard.tsx`

Página com 4 tabs:

- **Visão Geral**: cards com total de organizações, utilizadores, documentos, armazenamento; gráficos de uso
- **Organizações**: tabela CRUD de organizações com quota, plano, estado activo, nº utilizadores
- **Armazenamento**: barra de progresso por organização, alertas de quota perto do limite
- **Configurações Globais**: edição de parâmetros da plataforma (tamanho máximo upload, modo manutenção, etc.)

### 3. Hook `useSuperAdmin.ts`

- `useOrganizations()` — CRUD de organizações
- `usePlatformStats()` — estatísticas globais (conta documentos, processos, utilizadores, armazenamento)
- `usePlatformSettings()` — gestão de configurações globais

### 4. Integração na navegação

- Adicionar item "Super-Admin" na sidebar (grupo Administração, apenas `admin`)
- Registar rota `/super-admin` em `App.tsx` com `ProtectedRoute`
- Adicionar permissão em `permissions.ts`

### Ficheiros a criar/editar

| Ficheiro | Acção |
|----------|-------|
| `supabase/migrations/...` | Nova tabela `organizations`, `platform_settings` + RLS |
| `src/hooks/useSuperAdmin.ts` | **Novo** — hooks para organizações, stats e settings |
| `src/pages/SuperAdminDashboard.tsx` | **Novo** — dashboard completo com 4 tabs |
| `src/App.tsx` | Editar — registar rota `/super-admin` |
| `src/lib/permissions.ts` | Editar — adicionar `/super-admin: ["admin"]` |
| `src/components/layout/SidebarContent.tsx` | Editar — adicionar item na sidebar |

