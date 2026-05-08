const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface PublicSealResponse {
  valid: boolean;
  status?: "active" | "cancelled" | string;
  error?: string;
  seal?: {
    protocol_number: string;
    protocol_type: "ENT" | "SAI" | "INT" | string;
    document_title: string | null;
    subject: string | null;
    created_at: string;
    cancelled_at: string | null;
    has_pdf_hash: boolean;
    pdf_hash_prefix: string | null;
    organization_name: string | null;
  };
  movements_count?: number;
  pdf_hash_match?: boolean | null;
}

export async function validatePublic(
  token: string,
  pdfHash?: string,
): Promise<PublicSealResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-seal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify({ token, public: true, ...(pdfHash ? { pdf_hash: pdfHash } : {}) }),
  });
  if (!res.ok && res.status !== 200) {
    return { valid: false, error: "Selo não encontrado" };
  }
  return (await res.json()) as PublicSealResponse;
}

export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
