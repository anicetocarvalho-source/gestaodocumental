-- Tabela para gestão de retenção e eliminação documental
CREATE TABLE public.document_retention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'destroyed')),
  scheduled_destruction_date DATE NOT NULL,
  retention_reason TEXT,
  destruction_reason TEXT,
  legal_basis TEXT,
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  destroyed_by UUID REFERENCES auth.users(id),
  destroyed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id)
);

-- Índices para performance
CREATE INDEX idx_document_retention_document_id ON public.document_retention(document_id);
CREATE INDEX idx_document_retention_status ON public.document_retention(status);
CREATE INDEX idx_document_retention_scheduled_date ON public.document_retention(scheduled_destruction_date);

-- Trigger para updated_at
CREATE TRIGGER update_document_retention_updated_at
  BEFORE UPDATE ON public.document_retention
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.document_retention ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Consulta: todos podem ver
CREATE POLICY "Document retention viewable by authenticated users"
  ON public.document_retention
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir: admin e gestor podem marcar para eliminação
CREATE POLICY "Admin and gestor can mark for destruction"
  ON public.document_retention
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role])
  );

-- Actualizar: admin e gestor podem actualizar
CREATE POLICY "Admin and gestor can update retention"
  ON public.document_retention
  FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role])
  );

-- Eliminar: apenas admin
CREATE POLICY "Only admin can delete retention records"
  ON public.document_retention
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Comentários
COMMENT ON TABLE public.document_retention IS 'Gestão de retenção e eliminação de documentos arquivados';
COMMENT ON COLUMN public.document_retention.status IS 'Estado: pending (aguarda aprovação), approved (aprovado para eliminação), rejected (eliminação rejeitada), destroyed (eliminado)';
COMMENT ON COLUMN public.document_retention.scheduled_destruction_date IS 'Data prevista para eliminação do documento';
COMMENT ON COLUMN public.document_retention.retention_reason IS 'Razão para período de retenção específico';
COMMENT ON COLUMN public.document_retention.destruction_reason IS 'Razão para eliminação do documento';
COMMENT ON COLUMN public.document_retention.legal_basis IS 'Base legal para eliminação ou retenção';