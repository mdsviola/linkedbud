# Email Templates

This directory contains reusable HTML email templates for Linkedbud. The templates use **Handlebars** for rendering and are designed to be LLM-friendly, with clear placeholders and modular sections.

## Template Structure

- `template.html` - The main reusable email template (base template)
- `post-published-notification.html` - Template for post published notifications
- `waitlist-confirmation.html` - Template for waitlist confirmation emails (sent to users)
- `waitlist-support-notification.html` - Template for waitlist support notifications (sent to support@linkedbud.com)
- `user-feedback-submission.html` - Template for user feedback notifications
- Other specific email templates

## Handlebars Syntax

The templates use Handlebars templating engine with the following syntax:

- `{{variable}}` - Regular variable (HTML-escaped automatically)
- `{{{variable}}}` - Raw HTML variable (triple-stash, no escaping - use for HTML content)
- `{{#if variable}}...{{/if}}` - Conditional blocks
- `{{#each items}}...{{/each}}` - Loops (if needed)

### Common Placeholders

- `{{subject}}` - Email subject line (for reference in HTML comments)
- `{{preheader_text}}` - Preheader text visible in email preview (90-130 characters recommended)
- `{{brand_name}}` - Brand name (default: "Linkedbud")
- `{{email_title}}` - Main heading/title (H1)
- `{{greeting}}` - Personalized greeting (e.g., "Hi John," or "Hello,")
- `{{{main_message_html}}}` - Main content area (use triple-stash for HTML formatting)
- `{{cta_label}}` - Call-to-action button text (optional - use with `{{#if cta_label}}`)
- `{{cta_url}}` - Call-to-action button URL (optional - use with `{{#if cta_label}}`)
- `{{footer_note}}` - Footer message text
- `{{unsubscribe_url}}` - Unsubscribe link URL
- `{{privacy_url}}` - Privacy policy link URL
- `{{current_year}}` - Current year (for copyright)

### Conditional Rendering

The base template uses Handlebars conditionals for optional sections:

```handlebars
{{#if cta_label}}
  <!-- CTA button section will only render if cta_label is provided -->
{{/if}}
```

To show the CTA, include `cta_label` in the context object. To hide it, omit it or set it to an empty string/null.

## Usage

Templates are loaded and rendered using the shared email utilities with Handlebars:

```typescript
import { renderTemplate, loadTemplateSync } from "@/shared/email";

// Load template
const template = loadTemplateSync("src/shared/email/templates/template.html");

// Render with context object (Handlebars context)
// IMPORTANT: Only pass raw data values - never generate HTML in code!
const html = renderTemplate(template, {
  brand_name: "Linkedbud",
  email_title: "Welcome!",
  greeting: "Hi John,",
  cta_label: "Get Started", // Optional - use with {{#if cta_label}}
  cta_url: "https://example.com",
  // All HTML structure is in the template file itself
});
```

**Important**:

- Use `{{variable}}` for regular text (HTML-escaped)
- Use `{{{variable}}}` for HTML content (only in templates, never from code)
- Omit `cta_label` from context to hide the CTA section
- **Code should NEVER generate HTML strings** - all HTML belongs in templates

## Template Features

- **Email Client Compatibility**: Works across Gmail, Outlook (desktop & web), Apple Mail, Yahoo Mail, and mobile clients
- **Responsive Design**: Mobile-first approach with media queries for screens under 600px
- **Accessibility**: Proper semantic HTML and ARIA attributes
- **Brand Consistency**: Matches Linkedbud's design system (blue-600 primary color, clean typography, professional spacing)
- **LLM-Friendly**: Clear placeholder structure and comments for easy content injection

## Best Practices

1. **Use Correct Handlebars Syntax**:
   - Use `{{variable}}` for text (HTML-escaped)
   - Use `{{{variable}}}` for HTML content (no escaping)
   - Use `{{#if variable}}...{{/if}}` for conditionals
2. **HTML in Main Message**: When generating content, use simple, email-safe HTML and use triple-stash `{{{main_message_html}}}`
3. **Conditional CTAs**: Use `{{#if cta_label}}...{{/if}}` to conditionally show CTAs
4. **Testing**: Always test emails in multiple clients before sending to users
5. **Template Loading**: Templates are loaded from files and rendered using `renderTemplate()` utility with Handlebars

## File Locations

- Templates: `src/shared/email/templates/`
- Template utilities: `src/shared/email/template-utils.ts`
- Template loader: `src/shared/email/template-loader.ts`
- Email sending logic: `src/lib/email.ts`
