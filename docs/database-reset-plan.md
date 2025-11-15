# Simple Remote Database Reset Plan

## Quick Steps

### 1. Link to your remote project (if not already linked)

```bash
npx supabase link --project-ref your-project-ref
```

Find your project ref in: Supabase Dashboard → Settings → General

### 2. Reset the database (Choose ONE method)

#### Method A: SQL Editor (Fastest - 2 minutes)

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste this:

```sql
-- Drop all tables
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END $$;

-- Delete all users from auth system
-- ⚠️ WARNING: This will delete ALL users including admins
DELETE FROM auth.users;
```

3. Click "Run"

4. Reload PostgREST schema cache to sync with the schema changes:

```sql
NOTIFY pgrst, 'reload schema';
```

5. Click "Run" again in SQL Editor.

6. In terminal, re-apply your schema:

```bash
npx supabase db push --linked
```

#### Method B: CLI Only (requires SQL Editor for user deletion)

**Note:** Method B doesn't delete users automatically. You'll need to run the user deletion SQL in the SQL Editor, then continue with these commands:

```bash
# Link (if not already done)
npx supabase link --project-ref your-project-ref

# Push schema (this will apply your local schema.sql to remote)
npx supabase db push --linked

# Update types
npx supabase gen types typescript --linked > src/types/database.ts
```

**Before running the above commands, delete users and reload schema cache via SQL Editor:**

```sql
DELETE FROM auth.users;
NOTIFY pgrst, 'reload schema';
```

## After Reset

### 3. Re-create admin user (if needed)

After deleting all users, you'll need to sign up again with your admin email and then promote that user to admin:

```bash
npx tsx src/scripts/create-admin.ts your-admin-email@example.com
```

**Important:** The user must exist in the `profiles` table before running this script. Make sure to:

1. Sign up at your app with the admin email
2. Complete the onboarding process
3. Then run the admin creation script

### 4. Update TypeScript types

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

Done! Your database is completely reset with a fresh schema and no users.
