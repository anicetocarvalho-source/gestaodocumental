

## Testes Automatizados para Rotas Protegidas e Redirects

### Objectivo
Configurar Vitest + Testing Library e criar testes que verificam: rotas protegidas redirecionam para `/auth` sem sessão, `/auth` redireciona para `/` com sessão, rotas inexistentes mostram 404, e rotas restritas por role redirecionam para `/access-denied`.

### Setup (3 ficheiros novos + 2 edições)

**1. Instalar dependências**
- `@testing-library/jest-dom`, `@testing-library/react`, `jsdom`, `vitest` como devDependencies

**2. Criar `vitest.config.ts`**
- Ambiente jsdom, globals, setup file, alias `@/`

**3. Criar `src/test/setup.ts`**
- Import jest-dom matchers, mock `window.matchMedia`

**4. Editar `tsconfig.app.json`**
- Adicionar `"vitest/globals"` aos types

**5. Editar `package.json`**
- Adicionar script `"test": "vitest run"`

### Testes (1 ficheiro)

**`src/test/routing.test.tsx`** — ~8 testes:

Mocks necessários:
- `@/integrations/supabase/client` — mock de `auth.getUser`, `auth.getSession`, `auth.onAuthStateChange`
- `@/hooks/useUserRole` — mock de `primaryRole`

Cenários:
1. **Rota protegida sem sessão** → redireciona para `/auth`
2. **Rota protegida com sessão (role admin)** → renderiza conteúdo
3. **Rota admin com role consulta** → redireciona para `/access-denied`
4. **Rota `/auth` com sessão activa** → redireciona para `/`
5. **Rota inexistente** → renderiza NotFound
6. **`canAccessRoute` unit tests** — testa a função directamente com várias combinações role/path
7. **`canPerformAction` unit tests** — testa permissões de acção

### Detalhe técnico
- ProtectedRoute depende de `useAuth` e `useUserRole` — ambos serão mockados
- Os testes usam `MemoryRouter` com `initialEntries` para simular navegação
- Sem necessidade de browser — tudo em jsdom
- Ficheiros: 4 novos, 2 editados

