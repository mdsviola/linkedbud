-- Fix infinite recursion in get_user_portfolio_id function
-- The function needs to explicitly disable RLS to prevent recursion when called from RLS policies

CREATE OR REPLACE FUNCTION public.get_user_portfolio_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
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

