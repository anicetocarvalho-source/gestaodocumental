

## Plano de Correcção dos Problemas Encontrados

### Contexto

O teste end-to-end revelou **1 bug crítico** e **1 problema de dados** que requerem correcção.

### 1. Corrigir bug do detalhe de documento

O problema é que a query com múltiplas joins no `useDocument` falha silenciosamente quando tabelas relacionadas (como `organizational_units`, `profiles`, `document_files`) têm RLS que bloqueia acesso ou quando FK references apontam para registos que não passam o filtro de organização.

**Solução:** Actualizar a RLS das tabelas `organizational_units`, `document_files`, `document_movements`, `document_signatures`, `document_comments` para permitir leitura quando `organization_id IS NULL` (dados pré-multi-tenancy), garantindo que as joins não falhem silenciosamente.

### 2. Backfill `organization_id` nos dados existentes

Criar uma migração que:
- Cria uma organização default ("MINAGRIF") se não existir
- Atribui `organization_id` da organização default a todos os registos com `organization_id = NULL` (profiles, documents, dispatches, protocol_entries, etc.)
- Isto resolve o filtro do Protocolo e garante consistência futura

### Ficheiros a editar

| Ficheiro | Acção |
|----------|-------|
| `supabase/migrations/...` | Backfill `organization_id` + ajustar RLS em tabelas auxiliares |

### Notas

- A correcção do RLS é conservadora: apenas adiciona `OR organization_id IS NULL` onde falta
- O backfill é idempotente (só actua em registos NULL)
- Nenhuma alteração no frontend necessária

