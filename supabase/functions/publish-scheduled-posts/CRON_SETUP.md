# Setting Up the Cron Job

## Prerequisites

1. Edge Function deployed with `--no-verify-jwt` flag
2. Database migration applied: `20241201000000_add_scheduled_publish_variant_index.sql`
3. pg_cron extension enabled (in "extensions" schema)
4. pg_net extension enabled (in "extensions" schema)

## Create the Cron Job via SQL

Run this in the Supabase SQL Editor:

```sql
-- Create the cron job to publish scheduled posts every 30 minutes
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://atbbiwrdgvhzjumxihls.supabase.co/functions/v1/publish-scheduled-posts',
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
WHERE jobname = 'publish-scheduled-posts';
```

## Remove the Cron Job (If Needed)

```sql
SELECT cron.unschedule('publish-scheduled-posts');
```

## Why Not in Migrations?

Cron jobs are **runtime configuration**, not schema objects. Including them in migrations would cause issues when running the same migration multiple times (duplicate jobs, conflicts, etc.).

## Monitoring

View execution logs:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-posts'
)
ORDER BY start_time DESC
LIMIT 20;
```

Or check the Dashboard → Database → Cron → Logs
