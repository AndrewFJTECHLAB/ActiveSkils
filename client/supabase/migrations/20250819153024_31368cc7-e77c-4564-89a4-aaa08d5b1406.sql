-- Add extracted_individual_data column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN extracted_individual_data TEXT;