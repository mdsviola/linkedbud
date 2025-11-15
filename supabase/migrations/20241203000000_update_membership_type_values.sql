-- Update membership_type to use clearer values: 'membership' (main subscriptions), 'addon' (extra seats), 'growth_member' (collaborators)
-- This makes it clear whether a subscription is an actual membership or an addon

-- Step 1: Drop the old check constraint FIRST so we can update to new values
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_membership_type_check;

-- Step 2: Migrate existing data
-- First, identify and update extra seat subscriptions (price_id = '1090151' is the Growth seat price ID)
-- These should be 'addon', not 'membership'
UPDATE public.subscriptions
  SET membership_type = 'addon'
  WHERE price_id = '1090151'
    AND (membership_type IS NULL OR membership_type = 'owner' OR membership_type = 'membership');

-- 'owner' -> 'membership' (main subscriptions, but not extra seats which we just handled)
UPDATE public.subscriptions
  SET membership_type = 'membership'
  WHERE membership_type = 'owner'
    AND (price_id IS NULL OR price_id != '1090151'); -- Exclude extra seats

-- Handle NULL values: set to 'membership' for subscriptions with external_subscription_id (paid subscriptions)
-- But exclude extra seats (price_id = '1090151')
UPDATE public.subscriptions
  SET membership_type = 'membership'
  WHERE membership_type IS NULL
    AND external_subscription_id IS NOT NULL
    AND provider = 'lemonsqueezy'
    AND (price_id IS NULL OR price_id != '1090151'); -- Exclude extra seats

-- Handle any remaining NULL values: set to 'membership' as default
-- (growth_member subscriptions should already have the value set, but just in case)
UPDATE public.subscriptions
  SET membership_type = 'membership'
  WHERE membership_type IS NULL
    AND (price_id IS NULL OR price_id != '1090151'); -- Exclude extra seats

-- Step 3: Add new check constraint with clearer values
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_membership_type_check
  CHECK (membership_type IN ('membership', 'addon', 'growth_member'));

-- Note: Extra seat subscriptions (price_id matching GROWTH_SEAT_PRICE_ID)
-- will be automatically set to 'addon' by the webhook handler when they're processed.
-- For existing extra seats, you may need to run a one-time update script that uses
-- the LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT environment variable.

-- Update comment
COMMENT ON COLUMN public.subscriptions.membership_type IS 'Type of subscription: membership (main paid subscription), addon (extra seats/addons), or growth_member (collaborator with Growth tier access)';

