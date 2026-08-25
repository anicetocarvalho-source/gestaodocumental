# Corrigir eliminação de documentos

## O que se passa

A tabela `documents` tem regras de segurança apenas para consultar, criar e actualizar. **Não existe nenhuma regra que autorize eliminar.** Por isso o pedido de eliminação é aceite pela base de dados mas não apaga nada — zero linhas afectadas, sem erro. O ecrã, como não recebe erro, mostra a mensagem de sucesso "documentos eliminados" e o documento continua lá.

## O que vai ser feito

1. **Permitir eliminar na base de dados**
   Criar a política de eliminação para `documents`, limitada à mesma organização e apenas para:
   - administradores e gestores; ou
   - o utilizador que criou o documento (enquanto ainda estiver em rascunho/recebido).
   Documentos assinados ou arquivados ficam protegidos contra eliminação.

2. **Garantir a limpeza dos dados associados**
   Confirmar que ficheiros, movimentos, comentários, assinaturas e aprovações ligados ao documento são removidos em cascata (ou bloquear a eliminação com mensagem clara quando existirem assinaturas).

3. **Deixar de mostrar sucesso falso**
   A operação de eliminação passa a confirmar quantas linhas foram realmente removidas. Se nenhuma for removida, aparece um aviso claro ("Sem permissão para eliminar este documento" ou "Documento protegido") em vez da mensagem de sucesso. Aplica-se à eliminação individual e à eliminação em lote.

4. **Alinhar o botão com as permissões**
   O botão "Eliminar" deixa de aparecer nos casos em que a base de dados não permitirá a operação.

## Notas técnicas

- Migração SQL: `CREATE POLICY ... FOR DELETE ON public.documents` + `GRANT DELETE` aos papéis aplicáveis; verificação dos `ON DELETE CASCADE` nas chaves estrangeiras das tabelas dependentes.
- `useDeleteDocument` (`src/hooks/useDocuments.ts`) passa a usar `.select('id')` para detectar remoção efectiva e lançar erro quando o resultado vier vazio.
- `src/pages/Documents.tsx`: `handleBulkDelete` conta sucessos/falhas e apresenta o resultado real; `src/pages/DocumentDetail.tsx` recebe o mesmo tratamento se tiver acção de eliminar.
