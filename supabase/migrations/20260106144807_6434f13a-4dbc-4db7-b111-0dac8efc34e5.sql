-- Enable realtime for document_movements table
ALTER TABLE public.document_movements REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_movements;