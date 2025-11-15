# Setting Up the Cron Job for fetch-linkedin-metrics

## Prerequisites

1. Edge Function deployed with `--no-verify-jwt` flag
2. pg_cron extension enabled (in "extensions" schema)
3. pg_net extension enabled (in "extensions" schema)

## Create the Cron Job via SQL

Run this in the Supabase SQL Editor:

```sql
-- Create the cron job to fetch LinkedIn metrics once per day at 11:30 PM
SELECT cron.schedule(
  'fetch-linkedin-metrics',
  '30 23 * * *', -- daily at 11:30 PM UTC
  $$
  SELECT net.http_post(
    url := 'https://atbbiwrdgvhzjumxihls.supabase.co/functions/v1/fetch-linkedin-metrics',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

## Verify It Was Created

```sql
SELECT jobid, jobname, schedule, active, command
FROM cron.job
WHERE jobname = 'fetch-linkedin-metrics';
```

## Remove the Cron Job (If Needed)

```sql
SELECT cron.unschedule('fetch-linkedin-metrics');
```

## Why Not in Migrations?

Cron jobs are **runtime configuration**, not schema objects. Including them in migrations would cause issues when running the same migration multiple times (duplicate jobs, conflicts, etc.).

## Monitoring

View execution logs:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'fetch-linkedin-metrics'
)
ORDER BY start_time DESC
LIMIT 20;
```

Or check the Dashboard → Database → Cron → Logs

## Deployment

```bash
supabase functions deploy fetch-linkedin-metrics --no-verify-jwt
```

## Schedule Details

- **Frequency**: Once per day at 11:30 PM (23:30) UTC
- **Age-based optimization**:
  - Posts < 60 days old: fetch metrics every day
  - Posts ≥ 60 days old: fetch metrics once per day
