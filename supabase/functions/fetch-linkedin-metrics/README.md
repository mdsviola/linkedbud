# LinkedIn Metrics Cron Job

This Supabase Edge Function fetches LinkedIn metrics for all published posts. It's triggered by a pg_cron job that runs once per day at 11:30 PM.

## Quick Start

### Local Development

```bash
supabase functions serve fetch-linkedin-metrics --no-verify-jwt
curl -X POST http://localhost:54321/functions/v1/fetch-linkedin-metrics -H "Content-Type: application/json"
```

### Production Deployment

```bash
supabase link --project-ref atbbiwrdgvhzjumxihls
supabase secrets set LINKEDIN_COMMUNITY_CLIENT_ID=xxx
supabase secrets set LINKEDIN_COMMUNITY_CLIENT_SECRET=xxx
supabase functions deploy fetch-linkedin-metrics
```

### Production Testing

```bash
curl -X POST https://atbbiwrdgvhzjumxihls.supabase.co/functions/v1/fetch-linkedin-metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Features

- **Hourly execution**: Runs every hour at minute 0 (UTC) via cron schedule
- **Age-based optimization**:
  - Posts < 60 days old: fetch metrics every hour
  - Posts ≥ 60 days old: fetch metrics only once per day
- **Graceful error handling**: Skips users with expired tokens, continues processing
- **Comprehensive logging**: Tracks execution history in `cron_job_logs` table
- **Token management**: Automatically refreshes expired LinkedIn tokens
- **Automatic execution**: Primarily designed to run via cron, manual invocation requires proper authentication

## Architecture

- **Edge Function**: `index.ts` - Main function logic
- **LinkedIn Client**: `../_shared/linkedin-client.ts` - LinkedIn API wrapper
- **Token Utils**: `../_shared/token-utils.ts` - Token management and refresh
- **Cron Schedule**: `deno.json` - Defines hourly execution

## Cron Configuration

The function is configured to run via pg_cron. See `CRON_SETUP.md` for setup instructions.

- Schedule: `30 23 * * *` (daily at 11:30 PM UTC)

## Environment Variables

Set these in your Supabase project (Dashboard → Settings → Edge Functions):

```
LINKEDIN_COMMUNITY_CLIENT_ID=your_community_client_id
LINKEDIN_COMMUNITY_CLIENT_SECRET=your_community_client_secret
```

**Note**: The function uses the `SUPABASE_SERVICE_ROLE_KEY` internally for database access. For local development, use the `--no-verify-jwt` flag to bypass authentication requirements.

## Deployment

```bash
supabase functions deploy fetch-linkedin-metrics --no-verify-jwt
```

**Important**: The function uses the `SUPABASE_SERVICE_ROLE_KEY` environment variable which is automatically available in production.

After deployment, create the cron job using `CRON_SETUP.md`.

## Testing

### Local Development

```bash
# Start local development server (disable JWT verification for testing)
supabase functions serve fetch-linkedin-metrics --no-verify-jwt

# Test the function (no authentication required with --no-verify-jwt flag)
curl -X POST http://localhost:54321/functions/v1/fetch-linkedin-metrics \
  -H "Content-Type: application/json"

# Or using PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:54321/functions/v1/fetch-linkedin-metrics" -Method POST -Headers @{"Content-Type"="application/json"}
```

**Note**: The `--no-verify-jwt` flag disables JWT verification for local development, making testing much easier.

### Production Testing

```bash
# Deploy the function first
supabase functions deploy fetch-linkedin-metrics

# Invoke manually (requires service role key)
curl -X POST https://atbbiwrdgvhzjumxihls.supabase.co/functions/v1/fetch-linkedin-metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Check logs
supabase functions logs fetch-linkedin-metrics

# Or use the Supabase CLI to invoke (if available)
supabase functions invoke fetch-linkedin-metrics
```

**Note**: The URL uses your project reference ID (`atbbiwrdgvhzjumxihls` for this project). You can find your project reference ID with `supabase projects list` or in your Supabase dashboard.

### Getting Your Production URL and Keys

To test the function in production, you'll need:

1. **Production URL**:

   - Format: `https://[project-ref].supabase.co/functions/v1/fetch-linkedin-metrics`
   - Current project: `https://atbbiwrdgvhzjumxihls.supabase.co/functions/v1/fetch-linkedin-metrics`
   - Find your project ref: `supabase projects list`

2. **Service Role Key**:

   - **From Supabase Dashboard**: Settings → API → "service_role" key
   - **From CLI**: `supabase status` (look for "Secret key")
   - **From Environment**: Use `SUPABASE_SERVICE_ROLE_KEY` from your `.env` file

3. **Security Note**: The service role key has full database access. Never expose it in client-side code or commit it to version control.

### Request Details

**Method**: `POST`

**Headers**:

- `Content-Type: application/json` (required)
- `Authorization: Bearer YOUR_SERVICE_ROLE_KEY` (required for production)

**Body**:

- No body required - the function processes all published posts automatically

**Response**:

```json
{
  "processed": 15,
  "succeeded": 12,
  "failed": 3,
  "errors": [
    "Post 12345: No community token available for user abc-123",
    "Post 67890: LinkedIn API error: Rate limit exceeded"
  ],
  "message": "Successfully processed 15 posts"
}
```

## Monitoring

### Production Monitoring

Check execution history in the `cron_job_logs` table:

```sql
SELECT
  job_name,
  started_at,
  completed_at,
  status,
  posts_processed,
  successes,
  failures,
  error_details
FROM cron_job_logs
ORDER BY started_at DESC
LIMIT 10;
```

### Function Logs

Monitor function execution in real-time:

```bash
# Follow logs in real-time
supabase functions logs fetch-linkedin-metrics --follow

# Get recent logs
supabase functions logs fetch-linkedin-metrics --limit 50
```

### Cron Execution

The function runs automatically every hour. You can verify this by:

1. **Checking the logs** for hourly execution entries
2. **Monitoring the `cron_job_logs` table** for new entries
3. **Verifying metrics updates** in the `linkedin_post_metrics` table

## Database Schema

The function respects the existing unique constraint from migration 026:

- One metrics record per day per post per user
- Uses midnight UTC for consistent daily records
- Updates existing records or creates new ones as needed

## Error Handling

- **Expired tokens**: Marked as inactive, user needs to reconnect
- **API failures**: Logged but don't stop processing other posts
- **Database errors**: Logged with full error details

## Logging

The function uses clean, minimal logging with the following format:

### Success Logs

```
[FETCH_METRICS] Successfully fetched metrics for post: <POST_ID>
```

### Error Logs

```
[FETCH_METRICS] Failed to fetch metrics for post: <POST_ID> - <ERROR_TYPE>
```

### Job Summary Logs

```
Job completed: 15 succeeded, 5 failed
Processing complete: 15 succeeded, 5 failed
```

### Error Types

- **No token**: User needs to reconnect LinkedIn account
- **Token expired**: LinkedIn token needs refresh
- **Bad request**: Post may not exist or be accessible
- **Unauthorized**: Token invalid
- **Forbidden**: Insufficient permissions
- **Post not found**: Post may have been deleted
- **Rate limited**: Too many requests to LinkedIn API
- **API error**: Generic LinkedIn API error

### Log Levels

- **info**: Successful operations and job completion
- **warn**: Job completed with some failures
- **error**: Individual post processing failures
- **Network issues**: Retries handled by LinkedIn API client

## Troubleshooting

### Common Issues

**"Missing authorization header" error**:

- This occurs when the function is called without proper authentication
- **For local development**: Use `--no-verify-jwt` flag when starting the function server
- **For production**: Include `Authorization: Bearer YOUR_SERVICE_ROLE_KEY` header
- **Alternative for local**: Get your service role key with `supabase status` (look for "Secret key")

**"No community token available" errors**:

- Users need to connect their LinkedIn account with community token
- Check that `LINKEDIN_COMMUNITY_CLIENT_ID` and `LINKEDIN_COMMUNITY_CLIENT_SECRET` are set
- Verify tokens are active in the `linkedin_tokens` table

**Function timeout**:

- The function processes all posts in parallel, which can be resource-intensive
- Consider implementing pagination for large datasets
- Monitor the `cron_job_logs` table for execution details

### Debug Mode

Enable detailed logging by checking the function logs:

```bash
# Local development
supabase functions serve fetch-linkedin-metrics --debug

# Production logs
supabase functions logs fetch-linkedin-metrics --follow
```
