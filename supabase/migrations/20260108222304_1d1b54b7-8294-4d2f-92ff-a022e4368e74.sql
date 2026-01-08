-- Enable realtime for scanned_documents table
ALTER TABLE public.scanned_documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scanned_documents;