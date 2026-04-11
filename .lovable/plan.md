

## Página de Documentação Interactiva dos Fluxos

### Objectivo
Criar uma nova página `/flow-documentation` que apresenta visualmente todos os fluxos da plataforma, com navegação por perfil de utilizador e diagramas interactivos.

### Estrutura da Página

A página terá:
1. **Filtro por Role** — Tabs (Admin / Gestor / Técnico / Consulta) que filtram os fluxos visíveis
2. **Lista de Fluxos** — Cards colapsáveis (Accordion) com cada fluxo
3. **Detalhe do Fluxo** — Dentro de cada accordion: diagrama visual (Mermaid renderizado como SVG), tabela de passos, ecrãs envolvidos (links clicáveis para as páginas reais), dados necessários, e condições de erro

### Ficheiros a criar/editar

| Ficheiro | Acção |
|----------|-------|
| `src/pages/FlowDocumentation.tsx` | **Criar** — Página principal com tabs por role, accordion por fluxo, diagramas inline |
| `src/lib/flowData.ts` | **Criar** — Dados estáticos dos 11 fluxos documentados (passos, ecrãs, erros, roles aplicáveis) |
| `src/App.tsx` | **Editar** — Adicionar rota `/flow-documentation` |
| `src/components/layout/SidebarContent.tsx` | **Editar** — Adicionar link na secção "Ferramentas" |
| `src/lib/permissions.ts` | **Editar** — Adicionar permissão para a rota (todos os roles) |

### Componentes utilizados
- `DashboardLayout` (layout existente)
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` (UI existente)
- `Accordion` / `AccordionItem` / `AccordionTrigger` / `AccordionContent` (UI existente)
- `Card`, `Badge`, `ScrollArea` (UI existente)
- Diagramas de fluxo renderizados com CSS/HTML (setas e caixas estilizadas com Tailwind) — sem dependência externa

### Dados dos fluxos (em `flowData.ts`)
Os 11 fluxos documentados anteriormente, cada um com:
- `id`, `name`, `description`
- `roles: AppRole[]` — perfis que executam este fluxo
- `steps: { number, action, screen, route }[]`
- `requiredData: string[]`
- `errors: { condition, consequence }[]`

### Design visual
- Cada fluxo mostra uma sequência horizontal/vertical de caixas conectadas por setas (estilizadas com Tailwind, sem biblioteca externa)
- Caixas clicáveis que navegam para o ecrã correspondente
- Badges coloridos por role
- Secção de erros com ícones de alerta

