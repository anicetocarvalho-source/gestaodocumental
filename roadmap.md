# Roadmap — NODIDOC

## Em curso (auditoria "100% operacional")
- [x] Histórico de Versões com dados reais (`DocumentVersionHistory.tsx`)
- [ ] Download individual/em lote no Arquivo (`src/pages/Archive.tsx`)
- [ ] Download na Classificação Documental (`src/pages/DocumentClassification.tsx`)
- [ ] Centro de Digitalização: ligar atribuição de operador e ações do painel lateral

## Novos pedidos
- [ ] Confirmação antes de remover documentos + motivo exato quando bloqueado (UI)
- [ ] Teste E2E de aprovação real: criar doc → definir aprovadores → aprovar/rejeitar → validar estado e auditoria
- [ ] Criar contas de exemplo (Admin, Gestor, Técnico, Consulta) e validar permissões vs manual

## Novos pedidos (17:48)
- [ ] Painel de decisões internas: dashboard de despachos em trâmite e prazos (módulo Expedições)
- [ ] Fluxo completo de protocolo: entrada → tramitação interna → emissão de despacho → devolução, com estados e auditoria
- [ ] Painel de controlo GED: documentos por categoria, classificação e estado (Gestor/Técnico)
