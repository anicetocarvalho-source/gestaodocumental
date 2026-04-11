

## Implementação das Correcções de Validação

### Objectivo
Aplicar todas as correcções recomendadas no relatório de testes de casos extremos, endurecendo a validação em 6 módulos.

### Ficheiros a editar

**1. `src/components/documents/wizard/WizardStepBasicData.tsx`**
- Adicionar `maxLength={200}` ao campo Título
- Adicionar `maxLength={200}` ao campo Assunto
- Adicionar `maxLength={2000}` ao campo Descrição (Textarea)
- Adicionar `maxLength={100}` aos campos Remetente e Instituição (no WizardStepSender)
- Adicionar `min` da data de hoje ao campo Data Limite (impedir datas no passado)
- Mostrar contador de caracteres nos campos com limite

**2. `src/components/documents/wizard/WizardStepSender.tsx`**
- Adicionar `maxLength={150}` ao Nome do Remetente, Instituição e Referência Externa

**3. `src/components/documents/wizard/WizardStepFiles.tsx`**
- Validar tamanho de ficheiro (rejeitar >20MB) no `handleDrop` e `handleFileSelect`
- Validar tipo MIME/extensão no drag-and-drop (bloquear `.exe`, `.zip`, etc.)
- Mostrar toast de erro com nome do ficheiro rejeitado

**4. `src/components/documents/RegisterDocumentWizard.tsx`**
- Adicionar validação de `maxLength` no `validateStep`: título >200 chars = erro
- Trim nos campos antes de submeter

**5. `src/pages/CreateDispatch.tsx`**
- Adicionar `maxLength={200}` ao campo Assunto com contador
- Adicionar `maxLength={5000}` ao Textarea de conteúdo
- Converter `validateForm` para erros inline (`fieldErrors` state) em vez de só toasts
- Impedir prazo no passado (já tem `disabled` no Calendar, confirmar)

**6. `src/pages/CreateProcess.tsx`**
- Adicionar `maxLength={200}` ao campo Assunto
- Adicionar `maxLength={2000}` à Descrição
- Adicionar `maxLength={150}` ao campo Requerente
- Validar campos obrigatórios no `handleSubmit` (subject, processTypeId, requesterName) com toast
- Validar tipo e tamanho de ficheiro no upload (mesma lógica do wizard)
- Impedir deadline no passado via `min={new Date().toISOString().split('T')[0]}`

**7. `src/components/documents/DocumentSignatureModal.tsx`**
- Adicionar `maxLength={100}` ao Nome do Signatário
- Adicionar `maxLength={100}` ao Cargo

**8. `src/components/documents/UploadModal.tsx`**
- Validar tipo e tamanho de ficheiro no `handleDrop` e `handleFileSelect`
- Rejeitar ficheiros >25MB e formatos não suportados

### Constantes partilhadas
Criar `src/lib/validation-constants.ts` com:
- `MAX_TITLE_LENGTH = 200`
- `MAX_SUBJECT_LENGTH = 200`
- `MAX_DESCRIPTION_LENGTH = 2000`
- `MAX_DISPATCH_CONTENT_LENGTH = 5000`
- `MAX_NAME_LENGTH = 150`
- `MAX_FILE_SIZE_MB = 20`
- `ALLOWED_FILE_EXTENSIONS` e `ALLOWED_MIME_TYPES`
- Função utilitária `validateFile(file: File): { valid: boolean; error?: string }`

### Padrão de implementação
- Todos os campos de texto recebem `maxLength` no HTML (prevenção nativa)
- Campos com limite mostram contador `{value.length}/{max}`
- Ficheiros validados tanto no `onChange` do input como no `onDrop` do drag-and-drop
- Erros inline com bordas vermelhas (padrão já usado no wizard de documentos)
- Toasts mantidos como feedback secundário

