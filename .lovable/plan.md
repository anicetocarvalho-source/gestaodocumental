## Impressão de etiquetas — 3 modos

Adicionar `<PrintLabelDialog />` accionado pelos botões existentes em `PhysicalSealRegister.tsx` e `PhysicalSealDetail.tsx`. Sem libs novas. Sem localStorage (estado em React + contexto leve).

### Estrutura de ficheiros

**Criar**
- `src/lib/printing/zpl.ts` — `generateZPL(seal, { isDuplicate, copies, speed, density })`.
- `src/lib/printing/local-agent.ts` — `checkAgent()`, `printZPL(zpl, printerName, copies)`.
- `src/lib/printing/webusb.ts` — `isWebUSBAvailable()`, `requestZebraPrinter()`, `printZPLViaUSB(device, zpl, copies)`.
- `src/lib/printing/browser-print.ts` — `printViaBrowser(seal, isDuplicate, copies)` (janela A4 2×4).
- `src/lib/printing/types.ts` — tipos partilhados (`PrintMode`, `PrintOptions`, `AgentStatus`).
- `src/contexts/PrintPreferencesContext.tsx` — guarda `lastMode` e `lastDevice` na sessão (apenas React state, sem persistência).
- `src/components/seals/PrintLabelDialog.tsx` — modal principal.

**Editar**
- `src/pages/PhysicalSealRegister.tsx` — substituir handlers dos botões "Imprimir Etiqueta" / "Imprimir Duplicado" por abertura do dialog.
- `src/pages/PhysicalSealDetail.tsx` — idem para botão "Imprimir".
- `src/App.tsx` — montar `<PrintPreferencesProvider>` dentro do `AuthProvider`.

### `generateZPL`

Etiqueta 50×30mm @ 203dpi → 400×240 dots.

```text
^XA
^PW400
^LL240
^CI28                      ; UTF-8
^PR{speed}                 ; velocidade ips
^MD{density}               ; densidade 0-30
^FO20,15^A0N,18,18^FB360,1,0,C^FD{org_name}^FS
^FO20,40^GB360,2,2^FS
^FO20,55^BQN,2,4^FDLA,{qr_payload}^FS    ; QR esquerda
^FO180,60^A0N,12,12^FDPROTOCOLO^FS
^FO180,75^A0N,22,22^FD{protocol_number}^FS
^FO180,105^A0N,12,12^FDDATA^FS
^FO180,120^A0N,16,16^FD{date}^FS
^FO180,145^A0N,12,12^FDHASH^FS
^FO180,160^A0N,16,16^FD{hash8}^FS
^FO20,210^A0N,14,14^FB360,1,0,C^FDvalida.nodidoc.ao^FS
{if isDuplicate}
^FO80,80^A0N,40,40^FWR^FDDUPLICADO^FS
{endif}
^PQ{copies}
^XZ
```

Escape obrigatório de `^`, `~`, `\` no payload de texto. Multi-cópias usa `^PQ` (mais eficiente que repetir).

### Modo 1 — Agente Local

`checkAgent()`:
- `fetch("http://localhost:9876/health", { signal: AbortSignal.timeout(2000) })` numa promise race.
- Devolve `{ available, version, printers[] }` ou `{ available: false, error }`.
- Se exception/timeout → "Agente não está activo. Inicie a aplicação NODIDOC Print Agent."

`printZPL(zpl, printerName, copies)`:
- `POST /print` JSON `{ zpl, printer_name, copies }`.
- Devolve `{ job_id }` em sucesso, throw com mensagem do servidor em erro.

### Modo 2 — WebUSB

`isWebUSBAvailable()` → `typeof navigator !== 'undefined' && 'usb' in navigator`.

`requestZebraPrinter()`:
- `navigator.usb.requestDevice({ filters: [{ vendorId: 0x0A5F }, { vendorId: 0x04F9 }] })`.

`printZPLViaUSB(device, zpl, copies)`:
- `device.open()` → `selectConfiguration(1)` → `claimInterface(0)`.
- Encontrar endpoint `direction === 'out' && type === 'bulk'`.
- Para cada cópia: `device.transferOut(endpointNumber, new TextEncoder().encode(zpl))`.
- `releaseInterface(0)` → `close()`.
- Try/finally garante release mesmo em erro.

### Modo 3 — Print do navegador

`printViaBrowser(seal, isDuplicate, copies)`:
- `window.open('', '_blank', 'width=800,height=600')`.
- Injectar HTML standalone com `@page { size: A4; margin: 10mm }` e grelha CSS de 8 etiquetas (88,9 × 67,7 mm cada — formato L7165 equivalente).
- Renderizar QR via `qrcode` (já instalado) como SVG inline data-uri.
- `win.document.write(html); win.document.close(); win.focus(); win.print();`
- Listener `afterprint` → `win.close()`.

### `<PrintLabelDialog />`

```tsx
interface Props {
  seal: PhysicalSeal;
  isDuplicate?: boolean;
  isOpen: boolean;
  onClose: () => void;
}
```

Estado interno:
- `mode: 'agent' | 'webusb' | 'browser'` (default = `lastMode` do contexto, fallback `'agent'`).
- `agentStatus: AgentStatus | null`, `selectedPrinter: string | null`.
- `usbDevice: USBDevice | null`.
- `copies: number` (1-10), `speed: 2|3|4|6` (default 4), `density: number` (default 15).
- `printing: boolean`.

Comportamento:
- On mount: `checkAgent()` automaticamente. Se WebUSB disponível, mostra a opção.
- Radio cards mostram indicadores em tempo real.
- Botão "Procurar agente" reactiva `checkAgent()`.
- Botão "Selecionar impressora" → `requestZebraPrinter()`.
- Speed/density apenas visíveis em modos `agent`/`webusb`.
- Avisos:
  - WebUSB: banner amarelo "Modo experimental. Para uso institucional, recomendamos o Agente Local NODIDOC."
  - Browser: aviso "Use papel A4 com layout 2×4 de etiquetas auto-adesivas (88,9 × 67,7 mm)."
- "Imprimir" → gera ZPL (modos 1/2) ou chama browser-print, mostra `toast.success("Etiqueta enviada para impressão")`, fecha modal.
- Erros → `toast.error(mensagem)`, modal permanece aberto.
- `console.info('[print]', { sealId, mode, copies, ts })` como log temporário.

### Integração nos botões existentes

Em `PhysicalSealRegister.tsx` e `PhysicalSealDetail.tsx`:
- Adicionar `useState` para `printOpen` + `printDuplicate`.
- Cada botão passa a abrir o dialog com `isDuplicate` adequado.
- Renderizar `<PrintLabelDialog seal={seal} isDuplicate={...} isOpen={printOpen} onClose={...} />` no fim do JSX.

### Fora de âmbito

- Implementação do agente Tauri/Electron.
- Persistência cross-session de preferências.
- Fallback automático entre modos.
- Reporte server-side de jobs de impressão (próximo prompt).