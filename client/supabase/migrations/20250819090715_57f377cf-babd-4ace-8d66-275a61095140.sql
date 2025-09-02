-- Add markdown_file_path column to documents table
ALTER TABLE public.documents 
ADD COLUMN markdown_file_path TEXT;