-- Migration: Optimize RLS policies for performance
-- This migration addresses Supabase linter warnings about:
-- 1. Auth RLS Initialization Plan - wrapping auth functions in SELECT subqueries
--    This prevents re-evaluation of auth.uid(), auth.role(), and auth.jwt() for each row
-- 2. Multiple Permissive Policies - consolidating where possible
--    This reduces the number of policies that need to be evaluated per query

-- First, update the is_admin() function to use optimized auth.uid()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  );
$$;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Note: Keeping separate admin policy as it serves different purpose
-- Multiple permissive policies are acceptable when they have different conditions

-- ============================================================================
-- USER_PREFS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_prefs;
CREATE POLICY "Users can manage own preferences" ON public.user_prefs
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- POSTS TABLE
-- ============================================================================
-- Consolidate posts policies: combine user and service role into single policy per action
DROP POLICY IF EXISTS "Users can manage own posts" ON public.posts;
DROP POLICY IF EXISTS "Service role can manage all posts" ON public.posts;

-- Single policy for all operations that handles both user and service role
CREATE POLICY "Users and service role can manage posts" ON public.posts
  FOR ALL USING (
    (select auth.uid()) = user_id OR
    public.can_user_access_post((select auth.uid()), id) OR
    ((select auth.jwt()) ->> 'role' = 'service_role')
  );

-- ============================================================================
-- ENGAGEMENT_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own engagement logs" ON public.engagement_logs;
CREATE POLICY "Users can manage own engagement logs" ON public.engagement_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Consolidate subscriptions policies
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

-- Single policy that handles both user and admin access
CREATE POLICY "Users and admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    (select auth.uid()) = user_id OR
    public.is_admin()
  );

-- ============================================================================
-- USAGE_COUNTERS TABLE
-- ============================================================================
-- Consolidate usage_counters policies
DROP POLICY IF EXISTS "Users can manage own usage counters" ON public.usage_counters;
DROP POLICY IF EXISTS "Admins can view all usage counters" ON public.usage_counters;

-- Single policy that handles both user and admin access
CREATE POLICY "Users and admins can manage usage counters" ON public.usage_counters
  FOR ALL USING (
    (select auth.uid()) = user_id OR
    public.is_admin()
  );

-- ============================================================================
-- FEATURE_COOLDOWNS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own feature cooldowns" ON public.feature_cooldowns;
CREATE POLICY "Users can manage own feature cooldowns" ON public.feature_cooldowns
  FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================================
-- LINKEDIN_ACCOUNTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can view own linkedin accounts" ON public.linkedin_accounts
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can insert own linkedin accounts" ON public.linkedin_accounts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can update own linkedin accounts" ON public.linkedin_accounts
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own linkedin accounts" ON public.linkedin_accounts;
CREATE POLICY "Users can delete own linkedin accounts" ON public.linkedin_accounts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- LINKEDIN_POSTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own linkedin posts" ON public.linkedin_posts;
CREATE POLICY "Users can view own linkedin posts" ON public.linkedin_posts
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own linkedin posts" ON public.linkedin_posts;
CREATE POLICY "Users can insert own linkedin posts" ON public.linkedin_posts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own linkedin posts" ON public.linkedin_posts;
CREATE POLICY "Users can update own linkedin posts" ON public.linkedin_posts
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- LINKEDIN_ORGANIZATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own linkedin organizations" ON public.linkedin_organizations;
CREATE POLICY "Users can view own linkedin organizations" ON public.linkedin_organizations
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own linkedin organizations" ON public.linkedin_organizations;
CREATE POLICY "Users can insert own linkedin organizations" ON public.linkedin_organizations
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own linkedin organizations" ON public.linkedin_organizations;
CREATE POLICY "Users can update own linkedin organizations" ON public.linkedin_organizations
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own linkedin organizations" ON public.linkedin_organizations;
CREATE POLICY "Users can delete own linkedin organizations" ON public.linkedin_organizations
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- LINKEDIN_POST_METRICS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own linkedin post metrics" ON public.linkedin_post_metrics;
CREATE POLICY "Users can view own linkedin post metrics" ON public.linkedin_post_metrics
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own linkedin post metrics" ON public.linkedin_post_metrics;
CREATE POLICY "Users can insert own linkedin post metrics" ON public.linkedin_post_metrics
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own linkedin post metrics" ON public.linkedin_post_metrics;
CREATE POLICY "Users can update own linkedin post metrics" ON public.linkedin_post_metrics
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- LINKEDIN_TOKENS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own linkedin tokens" ON public.linkedin_tokens;
CREATE POLICY "Users can view own linkedin tokens" ON public.linkedin_tokens
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own linkedin tokens" ON public.linkedin_tokens;
CREATE POLICY "Users can insert own linkedin tokens" ON public.linkedin_tokens
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own linkedin tokens" ON public.linkedin_tokens;
CREATE POLICY "Users can update own linkedin tokens" ON public.linkedin_tokens
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own linkedin tokens" ON public.linkedin_tokens;
CREATE POLICY "Users can delete own linkedin tokens" ON public.linkedin_tokens
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CRON_JOB_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated users to view cron job logs" ON public.cron_job_logs;
CREATE POLICY "Allow authenticated users to view cron job logs" ON public.cron_job_logs
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- ============================================================================
-- PORTFOLIOS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own portfolio" ON public.portfolios;
CREATE POLICY "Users can view own portfolio" ON public.portfolios
  FOR SELECT USING (
    (select auth.uid()) = owner_id OR
    EXISTS (
      SELECT 1 FROM public.portfolio_collaborators
      WHERE portfolio_id = portfolios.id
      AND user_id = (select auth.uid())
      AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can insert own portfolio" ON public.portfolios;
CREATE POLICY "Users can insert own portfolio" ON public.portfolios
  FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can update own portfolio" ON public.portfolios;
CREATE POLICY "Users can update own portfolio" ON public.portfolios
  FOR UPDATE USING ((select auth.uid()) = owner_id);

-- ============================================================================
-- PORTFOLIO_COLLABORATORS TABLE
-- ============================================================================
-- Consolidate portfolio_collaborators policies
DROP POLICY IF EXISTS "Portfolio members can view collaborators" ON public.portfolio_collaborators;
DROP POLICY IF EXISTS "Portfolio owners can manage collaborators" ON public.portfolio_collaborators;

-- Single policy that handles both viewing and management
CREATE POLICY "Portfolio members and owners can manage collaborators" ON public.portfolio_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_collaborators.portfolio_id
      AND (
        owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM public.portfolio_collaborators pc
          WHERE pc.portfolio_id = portfolio_collaborators.portfolio_id
          AND pc.user_id = (select auth.uid())
          AND pc.status = 'accepted'
        )
      )
    )
  );

-- ============================================================================
-- PORTFOLIO_INVITATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Portfolio owners can view invitations" ON public.portfolio_invitations;
CREATE POLICY "Portfolio owners can view invitations" ON public.portfolio_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_invitations.portfolio_id
      AND owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Portfolio owners can create invitations" ON public.portfolio_invitations;
CREATE POLICY "Portfolio owners can create invitations" ON public.portfolio_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_invitations.portfolio_id
      AND owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Portfolio owners can update invitations" ON public.portfolio_invitations;
CREATE POLICY "Portfolio owners can update invitations" ON public.portfolio_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE id = portfolio_invitations.portfolio_id
      AND owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- FEEDBACK_SUBMISSIONS TABLE
-- ============================================================================
-- Consolidate feedback_submissions policies
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback_submissions;

-- Separate policies for different operations but consolidated conditions
CREATE POLICY "Users can insert own feedback" ON public.feedback_submissions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users and admins can view feedback" ON public.feedback_submissions
  FOR SELECT USING (
    (select auth.uid()) = user_id OR
    public.is_admin()
  );

CREATE POLICY "Users can update own feedback" ON public.feedback_submissions
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- ANALYTICS_INSIGHTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own analytics insights" ON public.analytics_insights;
CREATE POLICY "Users can view own analytics insights" ON public.analytics_insights
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics insights" ON public.analytics_insights;
CREATE POLICY "Users can insert own analytics insights" ON public.analytics_insights
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own analytics insights" ON public.analytics_insights;
CREATE POLICY "Users can update own analytics insights" ON public.analytics_insights
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own analytics insights" ON public.analytics_insights;
CREATE POLICY "Users can delete own analytics insights" ON public.analytics_insights
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CONTENT_IDEAS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own content ideas" ON public.content_ideas;
CREATE POLICY "Users can view own content ideas" ON public.content_ideas
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own content ideas" ON public.content_ideas;
CREATE POLICY "Users can insert own content ideas" ON public.content_ideas
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own content ideas" ON public.content_ideas;
CREATE POLICY "Users can update own content ideas" ON public.content_ideas
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own content ideas" ON public.content_ideas;
CREATE POLICY "Users can delete own content ideas" ON public.content_ideas
  FOR DELETE USING ((select auth.uid()) = user_id);

