-- Add missing reports metadata columns required by worker.py and reports.py
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_mismatched BOOLEAN DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS approved_for_history BOOLEAN DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS extracted_biomarkers_json TEXT;
