-- Add column for extracted formations data in profiles table
ALTER TABLE public.profiles 
ADD COLUMN extracted_formations_data text;