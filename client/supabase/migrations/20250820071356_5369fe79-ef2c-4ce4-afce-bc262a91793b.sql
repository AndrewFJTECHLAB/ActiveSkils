-- Add column for extracted parcours professionnel data in profiles table
ALTER TABLE public.profiles 
ADD COLUMN extracted_parcours_data text;