# Deploying the LemonSqueezy Webhook Edge Function

## Prerequisites

1. Supabase CLI installed and configured
2. Your Supabase project set up
3. Environment variables configured

## Deployment Steps

1. **Deploy the edge function with JWT verification disabled:**

   ```bash
   supabase functions deploy lemonsqueezy-webhook --no-verify-jwt
   ```

2. **Set environment variables:**

   ```bash
   supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
   supabase secrets set LEMONSQUEEZY_API_KEY=your_api_key_here
   ```

   Note: The `LEMONSQUEEZY_API_KEY` is required for the webhook to fetch subscription details and populate the `external_customer_id` and `price_id` fields when they're not included in the webhook payload.

3. **Verify deployment:**
   ```bash
   supabase functions list
   ```

## Webhook URL

After deployment, your webhook URL will be:

```
https://your-project-ref.supabase.co/functions/v1/lemonsqueezy-webhook
```

## Testing

1. **Test function accessibility:**

   ```bash
   curl https://atbbiwrdgvhzjumxihls.supabase.co/functions/v1/lemonsqueezy-webhook
   ```

   You should get a response with `"auth_disabled": true`

2. **Test with LemonSqueezy webhook simulation:**
   - Go to your LemonSqueezy dashboard
   - Navigate to Settings > Webhooks
   - Find your webhook and click "Simulate Event"
   - Select an event type to test (e.g., `subscription_created`)
   - Check the function logs: `supabase functions logs lemonsqueezy-webhook --follow`

## Monitoring

Monitor the function logs for any issues:

```bash
supabase functions logs lemonsqueezy-webhook --follow
```
