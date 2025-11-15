# LemonSqueezy Webhook Handler

This Supabase Edge Function handles webhook events from LemonSqueezy to update user subscription status in the database.

## Supported Events

- `subscription_created` - New subscription created
- `subscription_updated` - Subscription details updated
- `subscription_cancelled` - Subscription cancelled by user or admin
- `subscription_expired` - Subscription expired after cancellation or payment failure
- `subscription_resumed` - Previously cancelled subscription resumed
- `subscription_paused` - Subscription payment collection paused
- `subscription_unpaused` - Subscription payment collection resumed
- `subscription_payment_success` - Successful subscription payment
- `subscription_payment_failed` - Failed subscription payment
- `subscription_payment_recovered` - Payment recovered after failure

## Environment Variables

- `LEMONSQUEEZY_WEBHOOK_SECRET` - Secret key for webhook signature verification
- `LEMONSQUEEZY_API_KEY` - LemonSqueezy API key for fetching subscription details (required for populating customer_id and variant_id)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Setting Environment Variables in Supabase

Set these as Supabase secrets:

```bash
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set LEMONSQUEEZY_API_KEY=your_api_key
```

## Webhook Configuration

1. In your LemonSqueezy dashboard, go to Settings > Webhooks
2. Add a new webhook with the URL: `https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook`
3. Set the signing secret and select the events you want to receive
4. Save the webhook configuration

## Security

The function implements robust security measures:

- **Signature Verification**: Uses HMAC-SHA256 to verify webhook signatures from LemonSqueezy
- **Public Function**: Configured as a public function (no JWT required) for webhook access
- **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks
- **Input Validation**: Validates all incoming webhook data before processing

### Signature Verification

The function uses a dedicated `verifySignature.ts` utility that:

- Creates HMAC-SHA256 hash using the webhook secret
- Compares signatures using timing-safe comparison
- Handles errors gracefully and logs security events

## Database Updates

The function updates the `subscriptions` table with:

- Subscription status changes
- Renewal dates
- External customer and subscription IDs
- Price/variant information

### Subscription Data Population

The webhook handler attempts to populate all subscription fields in the following order:

1. **Direct from webhook**: Extracts customer_id and variant_id from webhook payload attributes or relationships
2. **API fallback**: If customer_id or variant_id are missing, fetches the full subscription details from LemonSqueezy API

This ensures that `external_customer_id` and `price_id` fields are always populated when the `LEMONSQUEEZY_API_KEY` is configured.
