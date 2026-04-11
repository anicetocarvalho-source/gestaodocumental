

## Tour Guiado por Perfil de Utilizador

### Objectivo
Transformar o tour generico actual (igual para todos) num tour personalizado que mostra a cada perfil (Admin, Gestor, Tecnico, Consulta) apenas os fluxos e funcionalidades relevantes para o seu role, na primeira vez que acedem ao sistema.

### O que existe
- `useGuidedTour.ts` — hook com driver.js, auto-start na primeira visita, tour unico para todos
- `OnboardingChecklist.tsx` — checklist localStorage no dashboard
- `useUserRole.ts` — hook que retorna o role do utilizador autenticado
- Tour key: `nodidoc_tour_completed` (localStorage)

### Alteracoes

**1. `src/hooks/useGuidedTour.ts`** — Refactoring principal:
- Criar sets de steps por role: `adminTourSteps`, `gestorTourSteps`, `tecnicoTourSteps`, `consultaTourSteps`
- Cada set inclui os steps base (sidebar, pesquisa, perfil) + steps especificos:
  - **Admin**: gestao de utilizadores, permissoes, workflow builder, SLA, relatorios, auditoria
  - **Gestor**: aprovacoes, despachos, relatorios, processos, repositorio
  - **Tecnico**: registo de documentos, processos, digitalizacao, OCR
  - **Consulta**: pesquisa, repositorio, arquivo (apenas leitura)
- Alterar auto-start para detectar o role via `useUserRole()` e seleccionar os steps adequados
- Mudar a key de localStorage para incluir o role: `nodidoc_tour_completed_<role>` — assim se o role mudar, o tour re-executa
- Adicionar funcao `startRoleTour(role: AppRole)` para iniciar manualmente

**2. `src/components/dashboard/OnboardingChecklist.tsx`**:
- Filtrar itens da checklist por role (ex: "Criar processo" nao aparece para Consulta)
- Adaptar acoes sugeridas ao perfil do utilizador

**3. `src/pages/Index.tsx`**:
- Passar o role ao tour no auto-start (ja usa `useGuidedTour` que sera actualizado internamente)

**4. Novos `data-tour` attributes** em componentes que ainda nao os tem:
- `src/components/layout/SidebarContent.tsx` — adicionar `data-tour` nos grupos de menu (admin, documentos, etc.)

### Steps por Role (resumo)

| Step | Admin | Gestor | Tecnico | Consulta |
|------|-------|--------|---------|----------|
| Boas-vindas personalizada | x | x | x | x |
| Menu principal | x | x | x | x |
| Pesquisa rapida | x | x | x | x |
| Accoes rapidas | x | x | x | - |
| KPIs | x | x | - | - |
| Aprovacoes | x | x | - | - |
| Gestao utilizadores | x | - | - | - |
| Registo documentos | x | x | x | - |
| Relatorios | x | x | - | - |
| Repositorio/Arquivo | x | x | x | x |
| Notificacoes | x | x | x | x |
| Perfil | x | x | x | x |

### Detalhe tecnico
- Sem novas dependencias — usa driver.js existente
- Role detectado via `useUserRole()` dentro do hook
- Mensagem de boas-vindas inclui o nome do role (ex: "Bem-vindo como Gestor!")
- Tour completa-se por role, nao globalmente
- Ficheiros editados: 3 (`useGuidedTour.ts`, `OnboardingChecklist.tsx`, `SidebarContent.tsx`)

