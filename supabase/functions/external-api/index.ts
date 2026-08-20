import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOVEMENT_TYPES = ["entrada", "saida", "transferencia", "arquivo", "emprestimo", "devolucao"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const apiKey = req.headers.get("x-api-key")?.trim();
    if (!apiKey) return json({ error: "Missing x-api-key header" }, 401);

    const keyHash = await sha256Hex(apiKey);
    const { data: keyRow, error: keyError } = await supabase
      .from("api_keys")
      .select("id, organization_id, scopes, is_active, expires_at")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (keyError) throw keyError;
    if (!keyRow || !keyRow.is_active) return json({ error: "Invalid API key" }, 401);
    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
      return json({ error: "API key expired" }, 401);
    }

    const orgId = keyRow.organization_id as string;
    const scopes: string[] = keyRow.scopes ?? [];

    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/functions\/v1\/external-api/, "").replace(/\/+$/, "");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

    // GET /documents
    if (req.method === "GET" && path === "/documents") {
      const { data, error } = await supabase
        .from("documents")
        .select("id, entry_number, title, subject, status, priority, entry_date, is_archived")
        .eq("organization_id", orgId)
        .order("entry_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return json({ data });
    }

    // GET /documents/{entry_number}
    if (req.method === "GET" && path.startsWith("/documents/")) {
      const entryNumber = decodeURIComponent(path.slice("/documents/".length));
      const { data, error } = await supabase
        .from("documents")
        .select("id, entry_number, title, subject, description, status, priority, entry_date, due_date, is_archived")
        .eq("organization_id", orgId)
        .eq("entry_number", entryNumber)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Document not found" }, 404);

      const { data: location } = await supabase
        .from("document_locations")
        .select("physical_status, placed_at, location:storage_locations(code, name, path)")
        .eq("document_id", data.id)
        .maybeSingle();

      return json({ data: { ...data, location: location ?? null } });
    }

    // GET /locations
    if (req.method === "GET" && path === "/locations") {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, code, name, location_type, level, path, capacity, is_active")
        .eq("organization_id", orgId)
        .order("path")
        .limit(limit);
      if (error) throw error;
      return json({ data });
    }

    // GET /movements
    if (req.method === "GET" && path === "/movements") {
      let query = supabase
        .from("physical_movements")
        .select("id, document_id, movement_type, from_location_id, to_location_id, reason, notes, scanned_qr, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);

      const documentId = url.searchParams.get("document_id");
      if (documentId) {
        if (!UUID_RE.test(documentId)) return json({ error: "Invalid document_id" }, 400);
        query = query.eq("document_id", documentId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return json({ data });
    }

    // POST /movements
    if (req.method === "POST" && path === "/movements") {
      if (!scopes.includes("write")) return json({ error: "Scope 'write' required" }, 403);

      const body = await req.json().catch(() => ({}));
      const documentId = String(body?.document_id ?? "");
      const movementType = String(body?.movement_type ?? "");
      const toLocationId = body?.to_location_id ? String(body.to_location_id) : null;

      if (!UUID_RE.test(documentId)) return json({ error: "Invalid document_id" }, 400);
      if (!MOVEMENT_TYPES.includes(movementType)) {
        return json({ error: `movement_type must be one of ${MOVEMENT_TYPES.join(", ")}` }, 400);
      }
      if (toLocationId && !UUID_RE.test(toLocationId)) {
        return json({ error: "Invalid to_location_id" }, 400);
      }

      const { data: doc } = await supabase
        .from("documents")
        .select("id")
        .eq("id", documentId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!doc) return json({ error: "Document not found" }, 404);

      const { data, error } = await supabase
        .from("physical_movements")
        .insert({
          organization_id: orgId,
          document_id: documentId,
          movement_type: movementType,
          to_location_id: toLocationId,
          reason: body?.reason ? String(body.reason).slice(0, 500) : null,
          notes: body?.notes ? String(body.notes).slice(0, 1000) : null,
          scanned_qr: false,
        })
        .select("id, created_at")
        .single();
      if (error) throw error;

      if (toLocationId) {
        await supabase
          .from("document_locations")
          .upsert(
            {
              organization_id: orgId,
              document_id: documentId,
              location_id: toLocationId,
              physical_status: movementType === "emprestimo" ? "emprestado" : "arquivado",
              placed_at: new Date().toISOString(),
            },
            { onConflict: "document_id" },
          );
      }

      return json({ data }, 201);
    }

    return json({ error: "Endpoint not found" }, 404);
  } catch (err) {
    console.error("external-api error:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
