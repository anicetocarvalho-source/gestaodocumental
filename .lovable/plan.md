

## Teste de Limites e Casos Extremos — Plano de Execução

### Objectivo
Testar sistematicamente todos os módulos de criação/edição da plataforma com inputs extremos e documentar como reage a cada caso. O teste será executado via browser automation nos formulários reais.

### Módulos a Testar

#### 1. Registo de Documento (`/register-document`)
**Validação existente**: Apenas `title`, `documentTypeId`, `currentUnitId` (campos obrigatórios no passo 1). Sem limite de tamanho nos campos de texto. Sem validação de tamanho de ficheiro no código (apenas label "máx. 20MB" mas sem enforcement).

Testes:
- Campos obrigatórios em branco → avançar passo
- Título com 500+ caracteres, caracteres especiais (`<script>`, emojis, acentos)
- Campo `subject` e `description` com strings enormes
- Upload de ficheiro `.exe`, `.zip` (formatos não listados no `accept`)
- Upload de ficheiro >20MB

#### 2. Criar Despacho (`/create-dispatch`)
**Validação existente**: `dispatchType`, `subject.trim()`, `dispatchText.trim()`, `recipients.length > 0`. Tudo via toasts, sem inline. Sem limites de tamanho.

Testes:
- Emitir sem tipo, sem assunto, sem conteúdo, sem destinatários
- Assunto e conteúdo com 500+ caracteres e caracteres especiais
- Prazo no passado

#### 3. Criar Processo (`/create-process`)
**Validação existente**: Validação por steps (`isStep3Valid`), mas sem verificação de campos obrigatórios explícita no `handleSubmit`. Sem limites de tamanho.

Testes:
- Submeter sem assunto
- Campos com strings enormes
- Prazo no passado, SLA negativo

#### 4. Criar Utilizador (modal em `/user-management`)
**Validação existente**: Zod schema com `email`, `password` (8+ chars, maiúscula, minúscula, número), `full_name` (2-100 chars). Bem validado.

Testes:
- Email inválido, password fraca
- Nome com 1 char, nome com 101+ chars
- Caracteres especiais no nome e cargo

#### 5. Upload de Ficheiros (vários modais)
**Validação existente**: `accept` no input limita no selector, mas não bloqueia drag-and-drop. Sem validação de tamanho no código.

Testes:
- Drag-and-drop de `.exe`
- Ficheiro de 0 bytes
- Ficheiro >25MB

#### 6. Assinatura de Documento (modal)
**Validação existente**: `signerName.trim()` obrigatório + assinatura desenhada.

Testes:
- Nome em branco, só espaços
- Nome com 500+ caracteres

### Execução

Para cada teste, registar:
- **Input**: O que foi inserido
- **Resultado**: O que aconteceu (erro inline, toast, crash, aceite silencioso)
- **Veredicto**: OK / Vulnerável / Melhoria necessária

### Entregável

Um documento PDF (`/mnt/documents/edge-case-test-report.pdf`) com tabela de resultados por módulo, categorizando cada caso como:
- ✅ **Tratado** — erro claro e adequado
- ⚠️ **Parcial** — aceita mas não deveria, ou mensagem confusa
- ❌ **Vulnerável** — sem validação, crash, ou comportamento inesperado

### Implementação

1. Navegar a cada formulário no browser e testar cada caso
2. Documentar resultados
3. Gerar relatório PDF com todas as descobertas
4. Opcionalmente propor correcções para os casos vulneráveis

### Análise Prévia (já identificado no código)

| Módulo | Problema Provável |
|--------|-------------------|
| Registo Documento | Sem limite de tamanho nos campos de texto, sem validação de tamanho de ficheiro |
| Criar Despacho | Sem limite de tamanho, sem validação inline (só toasts) |
| Criar Processo | Sem validação explícita de campos obrigatórios no submit |
| Upload Ficheiros | `accept` não bloqueia drag-and-drop de formatos inválidos, sem check de tamanho |
| Todos os módulos | Sem sanitização de HTML/XSS no input (embora React escape por defeito no render) |

