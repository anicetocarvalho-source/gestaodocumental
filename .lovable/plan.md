
User wants to seed the database with realistic test data so all flows can be exercised end-to-end across all 4 roles.

Let me check what exists already and what needs seeding.

Existing tables (from context): organizational_units, classification_codes, document_types, profiles, user_roles, documents, document_files, document_movements, document_signatures, document_comments, dispatches, dispatch_approvals, dispatch_recipients, dispatch_documents, processes, protocol_entries, digitization_batches, document_retention, notifications, conversations, messages, etc.

Existing test users (4 roles): admin, gestor, tecnico, consulta — already created.

What's needed: a seeding edge function (admin-only) that populates representative data covering all major flows.

## Plan

Create an admin-only edge function `seed-test-data` that populates the database with realistic Portuguese (PT) demo data covering every flow.

### What gets seeded

| Module | Records | Purpose |
|---|---|---|
| Organizational units | 5 (DG, DAF, DRH, DJ, DTI) | Routing/forwarding tests |
| Classification codes | 8 (CDC tree, 2 levels) | Classification & retention tests |
| Document types | 6 (Ofício, Memorando, Despacho, Requerimento, Circular, Relatório) | Type selector tests |
| Documents | 15 across all statuses (received, validating, in_progress, pending_signature, signed, dispatched, archived) | Lists, filters, detail, workflow |
| Document movements | 2-4 per doc | Movement history, notifications |
| Document comments | 1-2 per doc | Collaboration tests |
| Document signatures | On signed docs | Signature flow |
| Dispatches | 6 (rascunho, em_aprovacao, aprovado, assinado, emitido, cancelado) | Approval workflow + signing |
| Dispatch approvals + recipients | Linked to dispatches | Approval queue tests |
| Processes | 4 (different statuses) | Process flows |
| Protocol entries | 8 (4 ENT + 4 SAI) | Protocol book tests |
| Digitization batches | 3 (pending, processing, completed) | Digitization module |
| Document retention | 4 (pending destruction, expiring soon) | Archive/retention tests |
| Notifications | 5-10 per test user | Notification panel tests |

### Behaviour

- **Admin-only**: validates `has_role(caller, 'admin')` before running
- **Idempotent**: checks for existing seed data via a marker tag (`description LIKE '[SEED]%'`) and clears it before re-seeding, so it can be run multiple times safely
- **Multi-tenant aware**: all records get the caller's `organization_id` via `get_user_org_id()`
- **Realistic PT-PT content**: Portuguese subjects, sender names, ministerial context (NODIDOC)
- **Uses existing test users**: assigns documents/dispatches across the 4 test profiles to exercise role-based visibility
- **No file uploads to storage**: documents reference placeholder filenames only (real PDF upload requires Storage API + binary content; seeding metadata is enough to exercise UI flows). A note will be shown explaining this.

### UI trigger

Add a "Carregar Dados de Teste" button to `/super-admin` (admin-only page) that:
1. Calls the edge function
2. Shows a confirmation dialog warning it will reset existing seed data
3. Displays summary of created records on success
4. Includes a second button "Limpar Dados de Teste" to remove all `[SEED]` records

### Files

| File | Action |
|---|---|
| `supabase/functions/seed-test-data/index.ts` | Create — seeds + cleanup logic |
| `src/pages/SuperAdminDashboard.tsx` | Add seeding card with 2 buttons + result display |
| `mem://features/test-data-seeding` | Create memory documenting the seeder |

### Out of scope

- Real file binaries in Storage buckets (only metadata seeded)
- Email log seeding (generated naturally when triggers fire)
- Audit log seeding (auto-created by triggers on insert)
