
-- Create workflows table
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view workflows"
ON public.workflows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and managers can create workflows"
ON public.workflows FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role])
  OR auth.uid() IS NOT NULL
);

CREATE POLICY "Creators and admins can update workflows"
ON public.workflows FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role])
);

CREATE POLICY "Admins can delete workflows"
ON public.workflows FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
);

-- Trigger for updated_at
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
