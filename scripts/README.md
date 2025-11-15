# Scripts

This directory contains utility scripts for the project.

## `bundle-shared-for-edge-functions.js`

Bundles shared code from `src/shared/` for use in Supabase Edge Functions.

### Usage

```bash
npm run bundle:shared
```

### What it does

1. Finds all TypeScript files in `src/shared/`
2. Uses Deno's bundler to bundle each file (resolving imports)
3. Copies bundled files to `supabase/functions/_shared/`
4. Ensures Edge Functions can import shared code without runtime issues

### When to run

- Before deploying any Edge Function
- After making changes to `src/shared/` code
- In CI/CD pipelines before function deployment

### Requirements

- Deno must be installed and in PATH
- Install Deno: https://deno.land/



