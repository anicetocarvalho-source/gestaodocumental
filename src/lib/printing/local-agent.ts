/**
 * Cliente do Agente Local NODIDOC (aplicação Tauri/Electron separada).
 * Comunica via http://localhost:9876.
 *
 * Endpoints esperados:
 *   GET  /health → { status, version, printers: [{ name, model, status }] }
 *   POST /print  → body { zpl, printer_name, copies } → { job_id }
 *
 * O agente é responsável por declarar Access-Control-Allow-Origin: *.
 */
import type { AgentStatus } from "./types";

const AGENT_URL = "http://localhost:9876";

export async function checkAgent(timeoutMs = 2000): Promise<AgentStatus> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${AGENT_URL}/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, error: `Agente respondeu com erro ${res.status}.` };
    }
    const data = await res.json();
    return {
      available: true,
      version: data?.version,
      printers: Array.isArray(data?.printers) ? data.printers : [],
    };
  } catch {
    return {
      available: false,
      error:
        "Agente não está activo. Inicie a aplicação NODIDOC Print Agent no seu computador.",
    };
  }
}

export async function printZPL(
  zpl: string,
  printerName: string | null,
  copies: number,
): Promise<{ job_id: string }> {
  const res = await fetch(`${AGENT_URL}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zpl, printer_name: printerName, copies }),
  });
  if (!res.ok) {
    let message = `Falha ao enviar para impressão (${res.status}).`;
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}
