-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    gender TEXT DEFAULT 'unknown',
    height NUMERIC,
    blood_group TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies (Idempotent)
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Create profile auto-generation on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, date_of_birth, gender, height, blood_group)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    CASE 
      WHEN new.raw_user_meta_data->>'date_of_birth' IS NOT NULL THEN (new.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    COALESCE(new.raw_user_meta_data->>'gender', 'unknown'),
    CASE
      WHEN new.raw_user_meta_data->>'height' IS NOT NULL THEN (new.raw_user_meta_data->>'height')::NUMERIC
      ELSE NULL
    END,
    COALESCE(new.raw_user_meta_data->>'blood_group', 'unknown')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (idempotent drops/creates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    raw_ocr_text TEXT,
    summary TEXT,
    explanation TEXT,
    error_message TEXT,
    recorded_at DATE DEFAULT CURRENT_DATE NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create reports policies (Idempotent)
DROP POLICY IF EXISTS "Users can manage their own reports" ON public.reports;
CREATE POLICY "Users can manage their own reports" ON public.reports
    FOR ALL USING (auth.uid() = user_id);

-- Create biomarkers table
CREATE TABLE IF NOT EXISTS public.biomarkers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    reference_range TEXT,
    status TEXT NOT NULL, -- normal, low, high
    recorded_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on biomarkers
ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

-- Create biomarkers policies (Idempotent)
DROP POLICY IF EXISTS "Users can manage their own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can manage their own biomarkers" ON public.biomarkers
    FOR ALL USING (auth.uid() = user_id);

-- Create report chunks table for vector search
CREATE TABLE IF NOT EXISTS public.report_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    chunk_index INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on chunks
ALTER TABLE public.report_chunks ENABLE ROW LEVEL SECURITY;

-- Create chunks policies (Idempotent)
DROP POLICY IF EXISTS "Users can manage their own report chunks" ON public.report_chunks;
CREATE POLICY "Users can manage their own report chunks" ON public.report_chunks
    FOR ALL USING (auth.uid() = user_id);

-- Create medical knowledge base table
CREATE TABLE IF NOT EXISTS public.medical_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    biomarker_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on medical knowledge
ALTER TABLE public.medical_knowledge ENABLE ROW LEVEL SECURITY;

-- Create medical knowledge policies (Idempotent)
DROP POLICY IF EXISTS "Users can read medical knowledge" ON public.medical_knowledge;
CREATE POLICY "Users can read medical knowledge" ON public.medical_knowledge
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Chat' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on chat sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create chat sessions policies (Idempotent)
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage their own chat sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions ON DELETE CASCADE NOT NULL,
    sender TEXT CHECK (sender IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create chat messages policies (Idempotent)
DROP POLICY IF EXISTS "Users can manage messages in their chat sessions" ON public.chat_messages;
CREATE POLICY "Users can manage messages in their chat sessions" ON public.chat_messages
    FOR ALL USING (
        auth.uid() = (
            SELECT user_id FROM public.chat_sessions WHERE id = session_id
        )
    );

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_recorded ON public.biomarkers(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_uploaded ON public.reports(user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_chunks_report ON public.report_chunks(report_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.chat_messages(session_id);

-- Initialize Storage bucket and security policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload files to their own directory in 'reports' bucket
DROP POLICY IF EXISTS "Allow users to upload reports to their own folder" ON storage.objects;
CREATE POLICY "Allow users to upload reports to their own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'reports' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

-- Allow users to download files from their own directory in 'reports' bucket
DROP POLICY IF EXISTS "Allow users to read their own reports" ON storage.objects;
CREATE POLICY "Allow users to read their own reports" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'reports' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

-- Allow users to delete files from their own directory in 'reports' bucket
DROP POLICY IF EXISTS "Allow users to delete their own reports" ON storage.objects;
CREATE POLICY "Allow users to delete their own reports" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'reports' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );
