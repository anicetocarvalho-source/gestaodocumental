GRANT DELETE ON public.documents TO authenticated;

CREATE POLICY "Users can delete documents in their org"
ON public.documents
FOR DELETE
TO authenticated
USING (
  (organization_id = public.get_user_org_id(auth.uid()) OR organization_id IS NULL)
  AND is_archived IS NOT TRUE
  AND status NOT IN ('signed', 'archived')
  AND (
    public.has_any_role(auth.uid(), ARRAY['admin','gestor']::app_role[])
    OR (created_by = auth.uid() AND status IN ('draft', 'received'))
  )
);