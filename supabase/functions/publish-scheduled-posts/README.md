# Publish Scheduled Posts Edge Function

This Supabase Edge Function publishes scheduled LinkedIn posts. It's triggered by a pg_cron job that runs every 30 minutes.

## Overview

1. Queries all posts with `status='SCHEDULED'` and `scheduled_publish_date <= now()`
2. For each post, publishes the selected variant to the correct LinkedIn profile (personal or organization)
3. Updates post status to `PUBLISHED` on success or `FAILED` on error
4. Logs all publishing attempts in the `linkedin_posts` table
5. Tracks execution in `cron_job_logs` table

## Requirements

- Posts must have:
  - `status = 'SCHEDULED'`
  - `scheduled_publish_date` set to a past or current time
  - `scheduled_publish_variant_index` set to the variant to publish
  - `publish_target` set to "personal" or organization ID
  - `draft_variants` array with valid variants

## Deployment

```bash
supabase functions deploy publish-scheduled-posts --no-verify-jwt
```

## Configuration

The cron schedule is configured via pg_cron (see `CRON_SETUP.md`):

- Schedule: `*/30 * * * *` (every 30 minutes)

## Monitoring

Check execution logs in the `cron_job_logs` table:

```sql
SELECT * FROM cron_job_logs
WHERE job_name = 'publish-scheduled-posts'
ORDER BY started_at DESC
LIMIT 10;
```
