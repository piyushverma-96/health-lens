-- Add intake_responses column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intake_responses JSONB DEFAULT '{}'::jsonb;
