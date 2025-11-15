# Shared Code

This directory contains code that is shared between the Next.js application and Supabase Edge Functions.

## Structure

```
src/shared/
├── email/          # Email utilities (templates, sending, types)
│   ├── index.ts    # Main export file
│   ├── types.ts    # TypeScript types and interfaces
│   ├── templates.ts # Email template generation
│   └── resend.ts   # Resend API integration
└── README.md       # This file
```

## Usage

### In Next.js (Node.js)

```typescript
import { sendPostPublishedNotificationEmail } from "@/shared/email";
// or
import { generatePostPublishedNotificationHTML } from "@/shared/email";
```

### In Edge Functions (Deno)

**Important**: Before deploying Edge Functions, you must bundle the shared code:

```bash
npm run bundle:shared
```

Then import from the bundled location:

```typescript
import { sendPostPublishedNotificationEmail } from "../_shared/email/index.ts";
// or
import { generatePostPublishedNotificationHTML } from "../_shared/email/templates.ts";
```

The bundled code is located in `supabase/functions/_shared/` and is generated automatically.

## Guidelines

1. **Platform-agnostic code only**: Shared code must work in both Node.js and Deno environments
2. **No platform-specific APIs**: Avoid using Node.js-specific APIs (like `fs`, `path`) or Deno-specific APIs
3. **Use standard Web APIs**: Prefer `fetch`, standard JavaScript/TypeScript features
4. **Explicit file extensions**: In Deno imports, always include `.ts` extension
5. **TypeScript only**: All shared code should be TypeScript

## Adding New Shared Code

1. Create a new directory in `src/shared/` for your feature
2. Export everything from an `index.ts` file
3. Run `npm run bundle:shared` to bundle the new code
4. Update this README with the new module
5. Use relative imports in Edge Functions (`../_shared/...`), path aliases in Next.js (`@/shared/...`)

## Deployment Workflow

**Before deploying any Edge Function:**

1. Make changes to shared code in `src/shared/`
2. Run `npm run bundle:shared` to bundle the code
3. Deploy the Edge Function:
   ```bash
   # For specific functions:
   npm run functions:deploy:publish-posts
   npm run functions:deploy:metrics
   npm run functions:deploy:webhook
   
   # Or manually:
   npm run bundle:shared
   supabase functions deploy <function-name>
   ```

## Current Modules

### Email (`src/shared/email/`)

Shared email template generation and sending utilities:
- `generatePostPublishedNotificationHTML()` - Generate HTML email template
- `generatePostPublishedNotificationText()` - Generate plain text email
- `sendPostPublishedNotificationEmail()` - Send email via Resend API
- `getRecipientName()` - Extract recipient name from email
- `EmailRecipient` - TypeScript interface for email recipients

