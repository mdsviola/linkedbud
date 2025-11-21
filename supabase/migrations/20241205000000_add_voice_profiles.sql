-- Voice profiles table for storing AI-extracted writing voice characteristics
CREATE TABLE public.voice_profiles (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_type text NOT NULL CHECK (profile_type IN ('personal', 'organization')),
  organization_id text, -- LinkedIn org ID for organization profiles, NULL for personal
  voice_data jsonb, -- Structured voice characteristics (tone, sentence structure, vocabulary patterns, etc.)
  voice_description text, -- Natural language description for AI context
  source_posts text[] DEFAULT '{}', -- Array of post IDs used to generate/update this profile
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_type, organization_id)
);

-- Add comments to document the columns
COMMENT ON TABLE public.voice_profiles IS 'Stores AI-extracted writing voice profiles for users and organizations';
COMMENT ON COLUMN public.voice_profiles.profile_type IS 'Type of profile: personal or organization';
COMMENT ON COLUMN public.voice_profiles.organization_id IS 'LinkedIn organization ID for organization profiles, NULL for personal';
COMMENT ON COLUMN public.voice_profiles.voice_data IS 'Structured JSON with voice characteristics (tone, sentence length, vocabulary, formality, etc.)';
COMMENT ON COLUMN public.voice_profiles.voice_description IS 'Natural language description of writing voice for AI context';
COMMENT ON COLUMN public.voice_profiles.source_posts IS 'Array of post IDs used to generate or update this voice profile';

-- Create indexes for faster lookups
CREATE INDEX idx_voice_profiles_user_id ON public.voice_profiles(user_id);
CREATE INDEX idx_voice_profiles_organization_id ON public.voice_profiles(organization_id);
CREATE INDEX idx_voice_profiles_profile_type ON public.voice_profiles(profile_type);

-- Enable RLS
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own voice profiles" ON public.voice_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice profiles" ON public.voice_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice profiles" ON public.voice_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice profiles" ON public.voice_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

