-- =============================================
-- MINAGRIF - Sistema de Gestão Documental
-- Migração Inicial - Módulo de Documentos
-- =============================================

-- 1. Tabela de Unidades Orgânicas
CREATE TABLE public.organizational_units (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.organizational_units(id),
    level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de Perfis de Utilizador
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT,
    unit_id UUID REFERENCES public.organizational_units(id),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de Plano de Classificação
CREATE TABLE public.classification_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.classification_codes(id),
    level INTEGER NOT NULL DEFAULT 1,
    retention_years INTEGER,
    final_destination TEXT CHECK (final_destination IN ('elimination', 'permanent', 'sample')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de Tipos de Documento
CREATE TABLE public.document_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    default_classification_id UUID REFERENCES public.classification_codes(id),
    requires_signature BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabela Principal de Documentos
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    document_type_id UUID REFERENCES public.document_types(id),
    classification_id UUID REFERENCES public.classification_codes(id),
    origin TEXT,
    origin_unit_id UUID REFERENCES public.organizational_units(id),
    current_unit_id UUID REFERENCES public.organizational_units(id),
    responsible_user_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'validating', 'validated', 'in_progress', 'pending_signature', 'signed', 'dispatched', 'archived', 'rejected')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    confidentiality TEXT NOT NULL DEFAULT 'public' CHECK (confidentiality IN ('public', 'internal', 'confidential', 'secret')),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    subject TEXT,
    sender_name TEXT,
    sender_institution TEXT,
    external_reference TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabela de Ficheiros/Anexos
CREATE TABLE public.document_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    is_main_file BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Tabela de Tramitações/Movimentações
CREATE TABLE public.document_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    from_unit_id UUID REFERENCES public.organizational_units(id),
    to_unit_id UUID NOT NULL REFERENCES public.organizational_units(id),
    from_user_id UUID REFERENCES public.profiles(id),
    to_user_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL CHECK (action_type IN ('receive', 'validate', 'dispatch', 'forward', 'return', 'assign', 'reject', 'archive', 'sign')),
    dispatch_text TEXT,
    notes TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Tabela de Assinaturas Digitais
CREATE TABLE public.document_signatures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL REFERENCES public.profiles(id),
    signature_type TEXT NOT NULL CHECK (signature_type IN ('approval', 'acknowledgment', 'certification', 'digital')),
    signature_data TEXT,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    device_info TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true
);

-- 9. Tabela de Comentários/Notas
CREATE TABLE public.document_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Tabela de Histórico/Auditoria de Documentos
CREATE TABLE public.document_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_documents_entry_number ON public.documents(entry_number);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_current_unit ON public.documents(current_unit_id);
CREATE INDEX idx_documents_responsible ON public.documents(responsible_user_id);
CREATE INDEX idx_documents_entry_date ON public.documents(entry_date);
CREATE INDEX idx_document_movements_document ON public.document_movements(document_id);
CREATE INDEX idx_document_movements_to_unit ON public.document_movements(to_unit_id);
CREATE INDEX idx_document_files_document ON public.document_files(document_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_unit ON public.profiles(unit_id);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizational_units_updated_at
    BEFORE UPDATE ON public.organizational_units
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON public.document_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNÇÃO PARA GERAR NÚMERO DE ENTRADA
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_entry_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_number INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(entry_number FROM 'DOC-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_number
    FROM public.documents
    WHERE entry_number LIKE 'DOC-' || year_part || '-%';
    
    NEW.entry_number := 'DOC-' || year_part || '-' || LPAD(sequence_number::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_document_entry_number
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    WHEN (NEW.entry_number IS NULL)
    EXECUTE FUNCTION public.generate_entry_number();

-- =============================================
-- FUNÇÃO PARA AUDITORIA AUTOMÁTICA
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_document_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.document_audit_log (document_id, action, description, new_values, performed_by)
        VALUES (NEW.id, 'create', 'Documento criado', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO public.document_audit_log (document_id, action, description, old_values, new_values, performed_by)
            VALUES (NEW.id, 'status_change', 'Estado alterado de ' || OLD.status || ' para ' || NEW.status, 
                    jsonb_build_object('status', OLD.status), 
                    jsonb_build_object('status', NEW.status), 
                    NEW.created_by);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER audit_documents
    AFTER INSERT OR UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_document_changes();

-- =============================================
-- RLS - ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.organizational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para tabelas de referência (leitura pública para autenticados)
CREATE POLICY "Authenticated users can view organizational units"
    ON public.organizational_units FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view classification codes"
    ON public.classification_codes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view document types"
    ON public.document_types FOR SELECT
    TO authenticated
    USING (true);

-- Políticas para perfis
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Políticas para documentos (acesso baseado na unidade)
CREATE POLICY "Users can view documents in their unit or assigned to them"
    ON public.documents FOR SELECT
    TO authenticated
    USING (
        current_unit_id IN (
            SELECT unit_id FROM public.profiles WHERE user_id = auth.uid()
        )
        OR responsible_user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
        OR created_by = auth.uid()
    );

CREATE POLICY "Users can create documents"
    ON public.documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update documents they are responsible for"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (
        responsible_user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
        OR created_by = auth.uid()
    );

-- Políticas para ficheiros
CREATE POLICY "Users can view files of accessible documents"
    ON public.document_files FOR SELECT
    TO authenticated
    USING (
        document_id IN (
            SELECT id FROM public.documents WHERE 
                current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
                OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
                OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to accessible documents"
    ON public.document_files FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Políticas para movimentações
CREATE POLICY "Users can view movements of accessible documents"
    ON public.document_movements FOR SELECT
    TO authenticated
    USING (
        document_id IN (
            SELECT id FROM public.documents WHERE 
                current_unit_id IN (SELECT unit_id FROM public.profiles WHERE user_id = auth.uid())
                OR responsible_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
                OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create movements"
    ON public.document_movements FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Políticas para assinaturas
CREATE POLICY "Users can view signatures"
    ON public.document_signatures FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own signatures"
    ON public.document_signatures FOR INSERT
    TO authenticated
    WITH CHECK (
        signer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- Políticas para comentários
CREATE POLICY "Users can view comments"
    ON public.document_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create comments"
    ON public.document_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
    ON public.document_comments FOR UPDATE
    TO authenticated
    USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Políticas para auditoria
CREATE POLICY "Users can view audit logs"
    ON public.document_audit_log FOR SELECT
    TO authenticated
    USING (true);

-- =============================================
-- STORAGE BUCKET PARA DOCUMENTOS
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents', 
    'documents', 
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/tiff']
);

-- Políticas de storage
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);