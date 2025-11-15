-- Portfolio Collaboration System Migration
-- Adds support for Growth plan users to invite collaborators to shared portfolios

-- Create portfolios table
CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create portfolio_collaborators table
CREATE TABLE public.portfolio_collaborators (
  id bigserial PRIMARY KEY,
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(portfolio_id, user_id)
);

-- Create portfolio_invitations table
CREATE TABLE public.portfolio_invitations (
  id bigserial PRIMARY KEY,
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add portfolio_id to profiles table
ALTER TABLE public.profiles
  ADD COLUMN portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL;

-- Add portfolio_id to posts table
ALTER TABLE public.posts
  ADD COLUMN portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL;

-- Add membership_type to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN membership_type text CHECK (membership_type IN ('owner', 'growth_member'));

-- Create indexes
CREATE INDEX idx_portfolios_owner_id ON public.portfolios(owner_id);
CREATE INDEX idx_portfolio_collaborators_portfolio_id ON public.portfolio_collaborators(portfolio_id);
CREATE INDEX idx_portfolio_collaborators_user_id ON public.portfolio_collaborators(user_id);
CREATE INDEX idx_portfolio_invitations_portfolio_id ON public.portfolio_invitations(portfolio_id);
CREATE INDEX idx_portfolio_invitations_token ON public.portfolio_invitations(token);
CREATE INDEX idx_portfolio_invitations_email ON public.portfolio_invitations(email);
CREATE INDEX idx_profiles_portfolio_id ON public.profiles(portfolio_id);
CREATE INDEX idx_posts_portfolio_id ON public.posts(portfolio_id);
CREATE INDEX idx_posts_portfolio_user ON public.posts(portfolio_id, user_id);

-- Enable RLS on new tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Users can view own portfolio" ON public.portfolios
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.portfolio_collaborators
      WHERE portfolio_id = portfolios.id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own portfolio" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own portfolio" ON public.portfolios
  FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for portfolio_collaborators
CREATE POLICY "Portfolio members can view collaborators" ON public.portfolio_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_collaborators.portfolio_id
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.portfolio_collaborators pc
        WHERE pc.portfolio_id = portfolio_collaborators.portfolio_id
        AND pc.user_id = auth.uid()
        AND pc.status = 'accepted'
      ))
    )
  );

CREATE POLICY "Portfolio owners can manage collaborators" ON public.portfolio_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_collaborators.portfolio_id
      AND owner_id = auth.uid()
    )
  );

-- RLS Policies for portfolio_invitations
CREATE POLICY "Portfolio owners can view invitations" ON public.portfolio_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_invitations.portfolio_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Portfolio owners can create invitations" ON public.portfolio_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_invitations.portfolio_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Portfolio owners can update invitations" ON public.portfolio_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_invitations.portfolio_id
      AND owner_id = auth.uid()
    )
  );

-- Helper function to get user's portfolio ID (as owner or collaborator)
-- Uses SECURITY DEFINER and SET LOCAL to bypass RLS and prevent recursion
CREATE OR REPLACE FUNCTION public.get_user_portfolio_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  portfolio_id_result uuid;
BEGIN
  -- Temporarily disable RLS to prevent recursion
  SET LOCAL row_security = off;

  SELECT COALESCE(
    (SELECT id FROM public.portfolios WHERE owner_id = get_user_portfolio_id.user_id),
    (SELECT portfolio_id FROM public.portfolio_collaborators
     WHERE portfolio_collaborators.user_id = get_user_portfolio_id.user_id
     AND status = 'accepted'
     LIMIT 1)
  ) INTO portfolio_id_result;

  RETURN portfolio_id_result;
END;
$$;

-- Helper function to check if user can access a post
CREATE OR REPLACE FUNCTION public.can_user_access_post(check_user_id uuid, check_post_id bigint)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  post_user_id uuid;
  post_portfolio_id uuid;
  post_publish_target text;
  user_portfolio_id uuid;
  is_owner boolean;
  is_collaborator boolean;
  user_has_org_access boolean;
BEGIN
  -- Get post details
  SELECT user_id, portfolio_id, publish_target
  INTO post_user_id, post_portfolio_id, post_publish_target
  FROM public.posts
  WHERE id = check_post_id;

  -- If post doesn't exist, return false
  IF post_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Creator can always access their own posts
  IF post_user_id = check_user_id THEN
    RETURN true;
  END IF;

  -- If post has no portfolio, only creator can access
  IF post_portfolio_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get user's portfolio
  SELECT get_user_portfolio_id(check_user_id) INTO user_portfolio_id;

  -- If user is not in the same portfolio, deny access
  IF user_portfolio_id IS NULL OR user_portfolio_id != post_portfolio_id THEN
    RETURN false;
  END IF;

  -- Check if user is portfolio owner
  SELECT EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = post_portfolio_id
    AND owner_id = check_user_id
  ) INTO is_owner;

  -- If user is portfolio owner, they can see all organization posts
  IF is_owner THEN
    -- Owner can see all organization posts
    IF post_publish_target IS NOT NULL AND post_publish_target != 'personal' THEN
      RETURN true;
    END IF;
  ELSE
    -- Check if user is a collaborator
    SELECT EXISTS (
      SELECT 1 FROM public.portfolio_collaborators
      WHERE portfolio_id = post_portfolio_id
      AND user_id = check_user_id
      AND status = 'accepted'
    ) INTO is_collaborator;
  END IF;

  -- For personal posts, only creator can access
  IF post_publish_target = 'personal' OR post_publish_target IS NULL THEN
    RETURN false;
  END IF;

  -- For organization posts, check if collaborator has access to that organization
  IF post_publish_target IS NOT NULL AND post_publish_target != 'personal' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.linkedin_organizations
      WHERE user_id = check_user_id
      AND linkedin_org_id = post_publish_target
    ) INTO user_has_org_access;

    RETURN user_has_org_access;
  END IF;

  RETURN false;
END;
$$;

-- Update posts RLS policy to include portfolio access
DROP POLICY IF EXISTS "Users can manage own posts" ON public.posts;

CREATE POLICY "Users can manage own posts" ON public.posts
  FOR ALL USING (
    auth.uid() = user_id OR
    public.can_user_access_post(auth.uid(), id)
  );

-- Note: Migration of existing Growth users will be handled by application code
-- when they next interact with the system, or via a separate migration script

-- Add comments
COMMENT ON TABLE public.portfolios IS 'Portfolios owned by Growth plan users for collaboration';
COMMENT ON TABLE public.portfolio_collaborators IS 'Users who collaborate on portfolios';
COMMENT ON TABLE public.portfolio_invitations IS 'Pending invitations to join portfolios';
COMMENT ON COLUMN public.subscriptions.membership_type IS 'Type of membership: owner (portfolio owner) or growth_member (collaborator with Growth tier access)';

