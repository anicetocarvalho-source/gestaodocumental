import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEED_TAG = "[SEED]";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return json({ error: "Sessão inválida" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Apenas administradores" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "seed";

    // Resolve org
    const { data: callerProfile } = await admin.from("profiles").select("id, organization_id, unit_id").eq("user_id", caller.id).maybeSingle();
    const orgId: string | null = callerProfile?.organization_id ?? null;

    if (action === "clear") {
      const cleared = await clearSeedData(admin, orgId);
      return json({ success: true, cleared });
    }

    // SEED
    await clearSeedData(admin, orgId);
    const summary = await seedAll(admin, caller.id, orgId);
    return json({ success: true, summary });
  } catch (e) {
    console.error("seed-test-data error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function clearSeedData(admin: any, orgId: string | null) {
  const counts: Record<string, number> = {};

  // Find seed documents (description starts with [SEED])
  const { data: seedDocs } = await admin.from("documents").select("id").like("description", `${SEED_TAG}%`);
  const docIds = (seedDocs ?? []).map((d: any) => d.id);

  const { data: seedDispatches } = await admin.from("dispatches").select("id").like("content", `${SEED_TAG}%`);
  const dispIds = (seedDispatches ?? []).map((d: any) => d.id);

  const { data: seedProcesses } = await admin.from("processes").select("id").like("description", `${SEED_TAG}%`);
  const procIds = (seedProcesses ?? []).map((p: any) => p.id);

  if (docIds.length) {
    await admin.from("document_retention").delete().in("document_id", docIds);
    await admin.from("document_signatures").delete().in("document_id", docIds);
    await admin.from("document_comments").delete().in("document_id", docIds);
    await admin.from("document_movements").delete().in("document_id", docIds);
    await admin.from("document_files").delete().in("document_id", docIds);
    await admin.from("protocol_entries").delete().in("document_id", docIds);
    await admin.from("documents").delete().in("id", docIds);
    counts.documents = docIds.length;
  }

  if (dispIds.length) {
    await admin.from("dispatch_signatures").delete().in("dispatch_id", dispIds);
    await admin.from("dispatch_recipients").delete().in("dispatch_id", dispIds);
    await admin.from("dispatch_approvals").delete().in("dispatch_id", dispIds);
    await admin.from("dispatch_documents").delete().in("dispatch_id", dispIds);
    await admin.from("dispatches").delete().in("id", dispIds);
    counts.dispatches = dispIds.length;
  }

  if (procIds.length) {
    await admin.from("processes").delete().in("id", procIds);
    counts.processes = procIds.length;
  }

  // Standalone protocol entries (no doc)
  const { data: protos } = await admin.from("protocol_entries").select("id").like("observations", `${SEED_TAG}%`);
  if (protos?.length) {
    await admin.from("protocol_entries").delete().in("id", protos.map((p: any) => p.id));
    counts.protocol_entries = (counts.protocol_entries ?? 0) + protos.length;
  }

  const { data: batches } = await admin.from("digitization_batches").select("id").like("notes", `${SEED_TAG}%`);
  if (batches?.length) {
    await admin.from("digitization_batches").delete().in("id", batches.map((b: any) => b.id));
    counts.digitization_batches = batches.length;
  }

  // Notifications tagged
  const { error: notifErr } = await admin.from("notifications").delete().like("title", `${SEED_TAG}%`);
  if (!notifErr) counts.notifications_cleared = 1;

  // Org units (only seeded ones, code prefix SEED-)
  await admin.from("organizational_units").delete().like("code", "SEED-%");

  return counts;
}

async function seedAll(admin: any, callerAuthId: string, orgId: string | null) {
  const summary: Record<string, number> = {};

  // ───── Organizational units ─────
  const unitDefs = [
    { code: "SEED-DG", name: "Direcção-Geral", level: 1 },
    { code: "SEED-DAF", name: "Direcção Administrativa e Financeira", level: 2 },
    { code: "SEED-DRH", name: "Direcção de Recursos Humanos", level: 2 },
    { code: "SEED-DJ", name: "Direcção Jurídica", level: 2 },
    { code: "SEED-DTI", name: "Direcção de Tecnologias", level: 2 },
  ];
  const { data: units } = await admin
    .from("organizational_units")
    .insert(unitDefs.map(u => ({ ...u, organization_id: orgId, is_active: true })))
    .select();
  summary.units = units?.length ?? 0;
  const unitIds = (units ?? []).map((u: any) => u.id);
  const dgUnit = units?.[0]?.id;

  // ───── Profiles of test users ─────
  const { data: testProfiles } = await admin
    .from("profiles")
    .select("id, user_id, email")
    .in("email", ["gestor@nodidoc.test", "tecnico@nodidoc.test", "consulta@nodidoc.test"]);
  const profilesByEmail: Record<string, any> = {};
  (testProfiles ?? []).forEach((p: any) => { profilesByEmail[p.email] = p; });
  const gestor = profilesByEmail["gestor@nodidoc.test"];
  const tecnico = profilesByEmail["tecnico@nodidoc.test"];
  const consulta = profilesByEmail["consulta@nodidoc.test"];
  const { data: callerProfile } = await admin.from("profiles").select("id, user_id").eq("user_id", callerAuthId).maybeSingle();

  // Assign test users to seeded units (gestor->DG, tecnico->DAF, consulta->DRH)
  if (gestor) await admin.from("profiles").update({ unit_id: units?.[0]?.id }).eq("id", gestor.id);
  if (tecnico) await admin.from("profiles").update({ unit_id: units?.[1]?.id }).eq("id", tecnico.id);
  if (consulta) await admin.from("profiles").update({ unit_id: units?.[2]?.id }).eq("id", consulta.id);

  // ───── Reference: classifications & doc types (existing) ─────
  const { data: classifs } = await admin.from("classification_codes").select("id, code").limit(10);
  const { data: docTypes } = await admin.from("document_types").select("id, code").limit(10);
  const classifId = classifs?.[0]?.id ?? null;
  const docTypeId = docTypes?.[0]?.id ?? null;

  // ───── Documents (15 across statuses) ─────
  const statuses = [
    "received","received","validating","validating",
    "in_progress","in_progress","in_progress",
    "pending_signature","pending_signature",
    "signed","signed","dispatched","dispatched",
    "archived","archived",
  ];
  const subjectsPool = [
    "Pedido de cooperação institucional",
    "Relatório anual de actividades",
    "Convocatória para reunião extraordinária",
    "Solicitação de parecer técnico",
    "Proposta de orçamento sectorial",
    "Notificação de auditoria interna",
    "Pedido de licença de funcionamento",
    "Comunicado de alteração regulamentar",
    "Ofício de resposta a reclamação",
    "Convite para sessão de trabalho",
    "Memorando interno sobre procedimentos",
    "Pedido de informação ao público",
    "Proposta de revisão de regulamento",
    "Acta de reunião do conselho",
    "Despacho sobre nomeação",
  ];
  const senders = [
    { name: "João Manuel Silva", inst: "Ministério das Finanças" },
    { name: "Maria da Conceição", inst: "Ministério da Saúde" },
    { name: "Carlos Alberto Neto", inst: "Governo Provincial de Luanda" },
    { name: "Ana Paula Santos", inst: "Universidade Agostinho Neto" },
    { name: "Pedro Quintas", inst: "INSS" },
  ];

  const seedStamp = Date.now().toString().slice(-8);
  const docsToInsert = statuses.map((status, i) => {
    const sender = senders[i % senders.length];
    return {
      entry_number: `SEED-${seedStamp}-${String(i + 1).padStart(3, "0")}`,
      title: subjectsPool[i],
      subject: subjectsPool[i],
      description: `${SEED_TAG} Documento de teste #${i + 1} para validação de fluxos.`,
      status,
      priority: ["normal", "high", "urgent", "low"][i % 4],
      confidentiality: "public",
      sender_name: sender.name,
      sender_institution: sender.inst,
      origin: "external",
      classification_id: classifId,
      document_type_id: docTypeId,
      organization_id: orgId,
      origin_unit_id: dgUnit,
      current_unit_id: unitIds[i % unitIds.length],
      responsible_user_id: [gestor?.id, tecnico?.id, callerProfile?.id, gestor?.id, tecnico?.id][i % 5],
      created_by: callerAuthId,
      entry_date: new Date(Date.now() - (i * 2 + 1) * 86400000).toISOString(),
      due_date: new Date(Date.now() + (15 - i) * 86400000).toISOString(),
      is_archived: status === "archived",
      archived_at: status === "archived" ? new Date().toISOString() : null,
    };
  });
  const { data: insertedDocs, error: docsErr } = await admin.from("documents").insert(docsToInsert).select();
  if (docsErr) throw new Error(`documents: ${docsErr.message}`);
  summary.documents = insertedDocs?.length ?? 0;

  // ───── Document files (placeholder metadata) ─────
  const fileRows = (insertedDocs ?? []).map((d: any, i: number) => ({
    document_id: d.id,
    file_name: `documento_${i + 1}.pdf`,
    file_path: `seed/${d.id}/documento_${i + 1}.pdf`,
    file_size: 100000 + i * 5000,
    mime_type: "application/pdf",
    is_main_file: true,
    uploaded_by: callerAuthId,
    version: 1,
  }));
  await admin.from("document_files").insert(fileRows);
  summary.document_files = fileRows.length;

  // ───── Document movements (2 per doc) ─────
  const movRows: any[] = [];
  (insertedDocs ?? []).forEach((d: any, i: number) => {
    movRows.push({
      document_id: d.id,
      action_type: "recebimento",
      from_unit_id: dgUnit,
      to_unit_id: unitIds[(i + 1) % unitIds.length],
      from_user_id: callerProfile?.id,
      to_user_id: i % 2 === 0 ? gestor?.id : tecnico?.id,
      notes: `${SEED_TAG} Recebido para análise inicial.`,
      dispatch_text: "Para os devidos efeitos.",
    });
    if (["in_progress","pending_signature","signed","dispatched","archived"].includes(d.status)) {
      movRows.push({
        document_id: d.id,
        action_type: "encaminhamento",
        from_unit_id: unitIds[(i + 1) % unitIds.length],
        to_unit_id: unitIds[(i + 2) % unitIds.length],
        from_user_id: gestor?.id,
        to_user_id: tecnico?.id,
        notes: `${SEED_TAG} Encaminhado para parecer técnico.`,
        dispatch_text: "Solicito análise e parecer.",
      });
    }
  });
  await admin.from("document_movements").insert(movRows);
  summary.movements = movRows.length;

  // ───── Document comments ─────
  const commentRows: any[] = [];
  (insertedDocs ?? []).slice(0, 10).forEach((d: any, i: number) => {
    commentRows.push({
      document_id: d.id,
      author_id: i % 2 === 0 ? gestor?.id : tecnico?.id,
      content: `${SEED_TAG} Comentário inicial sobre o documento.`,
      is_internal: i % 3 === 0,
    });
  });
  await admin.from("document_comments").insert(commentRows.filter(r => r.author_id));
  summary.comments = commentRows.length;

  // ───── Document signatures (on signed/dispatched) ─────
  const sigRows: any[] = [];
  (insertedDocs ?? []).forEach((d: any) => {
    if (["signed","dispatched"].includes(d.status) && gestor) {
      sigRows.push({
        document_id: d.id,
        signer_id: gestor.id,
        signature_type: "digital",
        signature_data: "data:image/png;base64,SEED",
        is_valid: true,
      });
    }
  });
  if (sigRows.length) await admin.from("document_signatures").insert(sigRows);
  summary.signatures = sigRows.length;

  // ───── Document retention (4) ─────
  const retentionRows = (insertedDocs ?? []).slice(0, 4).map((d: any, i: number) => ({
    document_id: d.id,
    status: i === 0 ? "approved" : "pending",
    scheduled_destruction_date: new Date(Date.now() + (i === 0 ? -5 : (i * 30)) * 86400000).toISOString().slice(0, 10),
    retention_reason: `${SEED_TAG} Prazo de retenção atingido conforme Tabela de Temporalidade.`,
    legal_basis: "Decreto-Lei n.º 16/15",
    marked_by: callerAuthId,
    notes: `${SEED_TAG} Marcado para destruição.`,
  }));
  if (retentionRows.length) await admin.from("document_retention").insert(retentionRows);
  summary.retention = retentionRows.length;

  // ───── Dispatches (6) ─────
  const dispatchDefs = [
    { status: "rascunho", workflow: "nao_iniciado", subject: "Despacho de nomeação interina" },
    { status: "rascunho", workflow: "em_aprovacao", subject: "Despacho sobre comissão de serviço" },
    { status: "rascunho", workflow: "aprovado", subject: "Despacho de autorização orçamental" },
    { status: "rascunho", workflow: "assinado", subject: "Despacho de homologação" },
    { status: "emitido", workflow: "assinado", subject: "Despacho informativo geral" },
    { status: "cancelado", workflow: "rejeitado", subject: "Despacho cancelado por revisão" },
  ];
  const dispRows = dispatchDefs.map((d, i) => ({
    subject: d.subject,
    content: `${SEED_TAG} Conteúdo do despacho de teste número ${i + 1}. Para validação dos fluxos de aprovação, assinatura e emissão.`,
    dispatch_type: ["informativo","determinativo","autorizativo","homologativo","decisorio"][i % 5],
    status: d.status,
    workflow_status: d.workflow,
    priority: ["normal","alta","urgente","baixa"][i % 4],
    requires_approval: i !== 0,
    requires_response: i % 2 === 0,
    created_by: callerAuthId,
    signer_id: gestor?.id,
    origin_unit_id: dgUnit,
    organization_id: orgId,
    deadline: new Date(Date.now() + (10 - i) * 86400000).toISOString(),
    emitted_at: d.status === "emitido" ? new Date().toISOString() : null,
    cancelled_at: d.status === "cancelado" ? new Date().toISOString() : null,
    cancellation_reason: d.status === "cancelado" ? `${SEED_TAG} Necessária revisão do conteúdo.` : null,
  }));
  const { data: insertedDisp, error: dispErr } = await admin.from("dispatches").insert(dispRows).select();
  if (dispErr) throw new Error(`dispatches: ${dispErr.message}`);
  summary.dispatches = insertedDisp?.length ?? 0;

  // ───── Dispatch approvals ─────
  const apprRows: any[] = [];
  (insertedDisp ?? []).forEach((disp: any, i: number) => {
    if (!disp.requires_approval) return;
    const status = disp.workflow_status === "aprovado" ? "aprovado"
      : disp.workflow_status === "assinado" ? "aprovado"
      : disp.workflow_status === "rejeitado" ? "rejeitado"
      : "pendente";
    if (gestor) {
      apprRows.push({
        dispatch_id: disp.id,
        approver_id: gestor.id,
        approval_order: 1,
        status,
        comments: status !== "pendente" ? `${SEED_TAG} Análise concluída.` : null,
        approved_at: status === "aprovado" ? new Date().toISOString() : null,
      });
    }
  });
  if (apprRows.length) await admin.from("dispatch_approvals").insert(apprRows);
  summary.dispatch_approvals = apprRows.length;

  // ───── Dispatch recipients ─────
  const recRows: any[] = [];
  (insertedDisp ?? []).forEach((disp: any, i: number) => {
    recRows.push({
      dispatch_id: disp.id,
      recipient_type: "unit",
      unit_id: unitIds[(i + 1) % unitIds.length],
    });
    if (tecnico) recRows.push({ dispatch_id: disp.id, recipient_type: "user", profile_id: tecnico.id });
  });
  if (recRows.length) await admin.from("dispatch_recipients").insert(recRows);
  summary.dispatch_recipients = recRows.length;

  // ───── Dispatch signatures (on assinado/emitido) ─────
  const dispSigRows: any[] = [];
  (insertedDisp ?? []).forEach((disp: any) => {
    if (["assinado"].includes(disp.workflow_status) && gestor) {
      dispSigRows.push({
        dispatch_id: disp.id,
        signer_id: gestor.id,
        signature_type: "digital",
        signature_data: "data:image/png;base64,SEED",
        is_valid: true,
      });
    }
  });
  if (dispSigRows.length) await admin.from("dispatch_signatures").insert(dispSigRows);
  summary.dispatch_signatures = dispSigRows.length;

  // ───── Processes (4) ─────
  const procDefs = [
    { status: "rascunho", subject: "Processo de aquisição de equipamento informático" },
    { status: "em_andamento", subject: "Processo disciplinar de funcionário público" },
    { status: "aguardando_aprovacao", subject: "Processo de revisão regulamentar interna" },
    { status: "concluido", subject: "Processo de auditoria contabilística 2024" },
  ];
  const procRows = procDefs.map((p, i) => ({
    subject: p.subject,
    description: `${SEED_TAG} Processo de teste #${i + 1}.`,
    status: p.status,
    priority: ["normal","alta","urgente","normal"][i],
    origin: "interno",
    requester_name: "Departamento Solicitante",
    requester_unit_id: dgUnit,
    current_unit_id: unitIds[i % unitIds.length],
    responsible_user_id: gestor?.id,
    sla_days: 30,
    deadline: new Date(Date.now() + (30 - i * 5) * 86400000).toISOString(),
    started_at: p.status !== "rascunho" ? new Date(Date.now() - 10 * 86400000).toISOString() : null,
    completed_at: p.status === "concluido" ? new Date().toISOString() : null,
    created_by: callerAuthId,
  }));
  const { error: procErr } = await admin.from("processes").insert(procRows);
  if (procErr) console.error("processes:", procErr.message);
  summary.processes = procRows.length;

  // ───── Protocol entries (linked to first 8 docs would need direction; create standalone) ─────
  const protoRows: any[] = [];
  for (let i = 0; i < 4; i++) {
    protoRows.push({
      direction: "entrada",
      subject: subjectsPool[i],
      sender_name: senders[i % senders.length].name,
      sender_institution: senders[i % senders.length].inst,
      document_date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      received_at: new Date().toISOString(),
      delivery_method: ["correio","email","mao_propria","correio"][i],
      observations: `${SEED_TAG} Entrada de teste ${i + 1}`,
      unit_id: dgUnit,
      registered_by: callerAuthId,
      organization_id: orgId,
    });
  }
  for (let i = 0; i < 4; i++) {
    protoRows.push({
      direction: "saida",
      subject: `Resposta — ${subjectsPool[i]}`,
      recipient_name: senders[i % senders.length].name,
      recipient_institution: senders[i % senders.length].inst,
      document_date: new Date().toISOString().slice(0, 10),
      sent_at: new Date().toISOString(),
      delivery_method: "email",
      observations: `${SEED_TAG} Saída de teste ${i + 1}`,
      unit_id: dgUnit,
      registered_by: callerAuthId,
      organization_id: orgId,
    });
  }
  const { error: protoErr } = await admin.from("protocol_entries").insert(protoRows);
  if (protoErr) console.error("protocol_entries:", protoErr.message);
  summary.protocol_entries = protoRows.length;

  // ───── Digitization batches (3) ─────
  const batchRows = [
    { name: "Lote Arquivo 2023 — Janeiro", status: "pending", priority: "normal", total_pages: 250, processed_pages: 0 },
    { name: "Lote Arquivo 2023 — Fevereiro", status: "processing", priority: "high", total_pages: 380, processed_pages: 145 },
    { name: "Lote Arquivo 2022 — Dezembro", status: "completed", priority: "normal", total_pages: 200, processed_pages: 200, completed_at: new Date().toISOString() },
  ].map(b => ({
    ...b,
    notes: `${SEED_TAG} Lote de digitalização de teste.`,
    classification_id: classifId,
    operator_id: tecnico?.id,
    created_by: callerAuthId,
    organization_id: orgId,
    started_at: b.status !== "pending" ? new Date(Date.now() - 5 * 86400000).toISOString() : null,
  }));
  const { error: batchErr } = await admin.from("digitization_batches").insert(batchRows);
  if (batchErr) console.error("batches:", batchErr.message);
  summary.digitization_batches = batchRows.length;

  // ───── Notifications (5 per test user) ─────
  const notifTargets = [callerAuthId, gestor?.user_id, tecnico?.user_id, consulta?.user_id].filter(Boolean);
  const notifRows: any[] = [];
  notifTargets.forEach((uid: string) => {
    for (let i = 0; i < 5; i++) {
      notifRows.push({
        user_id: uid,
        title: `${SEED_TAG} Notificação de teste ${i + 1}`,
        message: ["Novo documento atribuído à sua unidade.","Despacho aguarda a sua aprovação.","Prazo de resposta a expirar em 3 dias.","Documento foi assinado com sucesso.","Alerta de retenção: arquivo elegível para destruição."][i],
        type: ["info","warning","warning","success","info"][i],
        is_read: i > 2,
        reference_type: "document",
      });
    }
  });
  if (notifRows.length) await admin.from("notifications").insert(notifRows);
  summary.notifications = notifRows.length;

  return summary;
}
