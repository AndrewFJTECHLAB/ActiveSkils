-- Delete all objects in the 'documents' storage bucket
DELETE FROM storage.objects WHERE bucket_id = 'documents';