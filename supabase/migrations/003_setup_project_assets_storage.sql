-- Migration: 003_setup_project_assets_storage.sql
-- Description: Sets up the project_assets storage bucket, table, RLS, and policies.

-- 1. Drop existing table if it exists, to ensure a clean setup.
DROP TABLE IF EXISTS public.project_assets CASCADE;

-- 2. Create a function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the project_assets table to store file metadata
CREATE TABLE public.project_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    asset_type TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Add indexes for performance
CREATE INDEX idx_project_assets_project_id ON public.project_assets(project_id);
CREATE INDEX idx_project_assets_user_id ON public.project_assets(user_id);

-- 5. Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER on_project_assets_updated
  BEFORE UPDATE ON public.project_assets
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Enable Row Level Security on the project_assets table
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for the project_assets table
CREATE POLICY "Allow authenticated users to view assets for their own projects"
  ON public.project_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_assets.project_id AND p.client_id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to upload assets for their own projects"
  ON public.project_assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_assets.project_id AND p.client_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Allow authenticated users to update their own asset metadata"
  ON public.project_assets
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own assets"
  ON public.project_assets
  FOR DELETE
  USING (user_id = auth.uid());

-- 8. Create the Storage Bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', false)
ON CONFLICT (id) DO NOTHING;

-- 9. Create Storage Policies for the project-assets bucket
CREATE POLICY "Allow authenticated read access on project-assets storage"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert access on project-assets storage"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'project-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access on own objects in project-assets storage"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'project-assets' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'project-assets' AND auth.uid() = owner);

CREATE POLICY "Allow authenticated delete access on own objects in project-assets storage"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'project-assets' AND auth.uid() = owner);
