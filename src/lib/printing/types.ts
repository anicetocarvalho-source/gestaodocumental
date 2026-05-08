export type PrintMode = "agent" | "webusb" | "browser";

export interface PrintOptions {
  isDuplicate?: boolean;
  copies: number;
  speed: 2 | 3 | 4 | 6;
  density: number; // 0-30
}

export interface AgentPrinter {
  name: string;
  model?: string;
  status?: string;
}

export interface AgentStatus {
  available: boolean;
  version?: string;
  printers?: AgentPrinter[];
  error?: string;
}
