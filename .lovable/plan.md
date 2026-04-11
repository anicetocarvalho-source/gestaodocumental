

## Plano de Correcção: Funções de Auditoria Bloqueadas por RLS

### Problema Encontrado

Ao testar o registo de documento, o POST falha com erro **42501**: `new row violates row-level security policy for table "document_audit_log"`.

**Causa raiz**: As 3 funções de auditoria (`audit_document_changes`, `audit_process_changes`, `audit_dispatch_changes`) executam com as permissões do utilizador actual, mas as tabelas de audit log têm políticas RLS de INSERT com `WITH CHECK (false)` — ou seja, nenhum utilizador pode inserir directamente. Estas funções precisam de `SECURITY DEFINER` para contornar o RLS e inserir registos de auditoria via triggers.

### Correcção (1 migração SQL)

Criar uma migração que altera as 3 funções para `SECURITY DEFINER` com `SET search_path = public`:

1. **`audit_document_changes`** → `SECURITY DEFINER`
2. **`audit_process_changes`** → `SECURITY DEFINER`
3. **`audit_dispatch_changes`** → `SECURITY DEFINER`

Isto é seguro porque estas funções são invocadas apenas por triggers (não por chamadas directas), e o `search_path` é fixado para prevenir ataques de injecção.

### Verificação pós-correcção

Após aplicar a migração, repetir o teste:
- Registar documento → deve gravar na BD e redirecionar
- Criar processo → deve funcionar sem erro 403
- Criar despacho → deve funcionar sem erro 403

### Nota sobre outros problemas observados

- Pedido `notification_preferences` retorna **406** (provavelmente `.single()` sem dados) — não bloqueia funcionalidade
- Pedidos HEAD a `dispatch_approvals` falham — são provavelmente verificações de realtime, não críticos

