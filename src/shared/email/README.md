# Shared Email Utilities

This directory contains shared email utilities that work in both Node.js (Next.js) and Deno (Edge Functions) environments. Templates are stored as HTML files and rendered using the `renderTemplate` utility, avoiding template strings.

## Structure

```
src/shared/email/
├── index.ts              # Main export file
├── types.ts              # TypeScript types and interfaces
├── templates.ts          # Email template generation functions
├── template-utils.ts     # Template rendering utilities
├── template-loader.ts    # Platform-agnostic template loading
├── resend.ts             # Resend API integration
├── templates/            # HTML email templates
│   ├── template.html     # Base reusable template
│   ├── post-published-notification.html
│   ├── waitlist-confirmation.html
│   └── ...              # Other email templates
└── README.md            # This file
```

## Quick Start

```typescript
import {
  generatePostPublishedNotificationHTML,
  renderTemplate,
  loadTemplateSync,
} from "@/shared/email";

// Use pre-built template functions
const html = generatePostPublishedNotificationHTML(
  "John Doe",
  "https://linkedin.com/posts/...",
  "https://linkedbud.com/privacy"
);

// Or load and render a template directly
const template = loadTemplateSync("src/shared/email/templates/template.html");
const rendered = renderTemplate(template, {
  brand_name: "Linkedbud",
  email_title: "Welcome!",
  greeting: "Hi John,",
  // ... other variables
});
```

## Template System

Templates use **Handlebars** syntax for rendering. Variables are replaced using the `renderTemplate()` utility:

```typescript
import { renderTemplate } from "@/shared/email";

const html = renderTemplate(templateString, {
  variable_name: "value",
  another_var: "another value",
  show_cta: true, // Use {{#if show_cta}}...{{/if}} in template
  // All HTML structure is in the template, not here!
});
```

### Handlebars Syntax Reference

- **Variables**: `{{variable}}` - HTML-escaped output (use for all data from code)
- **Raw HTML**: `{{{variable}}}` - Unescaped HTML output (only in templates, never from code)
- **Conditionals**: `{{#if variable}}...{{/if}}` - Conditional blocks
- **Loops**: `{{#each items}}...{{/each}}` - Iterate over arrays
- **Helpers**: Custom helpers can be registered (see `template-utils.ts`)

**Important**: Code should NEVER generate HTML strings. All HTML structure belongs in templates. Code only passes raw data values (strings, numbers, booleans, etc.).

## Generating New Email Types

Use the following prompt with an LLM to generate new email templates based on `template.html`:

---

## LLM Prompt for Generating New Email Templates

```
You are an expert email copywriter and HTML email developer working for Linkedbud, a LinkedIn co-pilot that helps users ideate, write, schedule, and analyze LinkedIn content.

Your task is to generate a complete HTML email template file using the base template located at `src/shared/email/templates/template.html`.

### EMAIL CONTEXT
- Email Type: [INSERT EMAIL TYPE - e.g., welcome, confirmation, password reset, product update, newsletter, feature announcement, etc.]
- Recipient Name: [INSERT RECIPIENT NAME or "there" for generic]
- Recipient Email: [INSERT RECIPIENT EMAIL if relevant]

### EMAIL CONTENT REQUIREMENTS
- Subject Line: [INSERT SUBJECT LINE REQUIREMENTS or let LLM suggest]
- Preheader Text: [INSERT PREHEADER TEXT or let LLM suggest - keep it 90-130 characters]
- Title: [INSERT TITLE REQUIREMENTS]
- Main Message: [INSERT MAIN MESSAGE REQUIREMENTS - what should the email communicate?]
- Tone: [INSERT TONE - e.g., friendly, professional, urgent, celebratory, informative, etc.]
- CTA (if applicable):
  - CTA Label: [INSERT CTA BUTTON TEXT]
  - CTA URL: [INSERT CTA URL]
- Footer Note: [INSERT FOOTER MESSAGE or let LLM suggest appropriate message]

### BRAND GUIDELINES
- Brand Name: Linkedbud
- Tone: Professional, modern, helpful, and concise
- Target Audience: LinkedIn content creators, professionals, and entrepreneurs
- Brand Values: Productivity, AI-powered assistance, content quality
- Primary Color: #2563eb (blue-600)
- Text Color: #1e293b (slate-800)
- Secondary Text: #64748b (slate-500)

### TEMPLATE USAGE INSTRUCTIONS

1. **Read the base template**: First, read the template file at `src/shared/email/templates/template.html`

2. **Understand Handlebars syntax**: The templates use Handlebars for rendering:
   - `{{variable}}` - Regular variable (HTML-escaped automatically)
   - `{{{variable}}}` - Raw HTML variable (triple-stash, no escaping)
   - `{{#if variable}}...{{/if}}` - Conditional blocks
   - `{{#each items}}...{{/each}}` - Loops (if needed)

3. **Replace ALL placeholders** with actual content:
   - `{{subject}}` - Email subject line (in HTML comment)
   - `{{preheader_text}}` - Preheader text (90-130 characters)
   - `{{brand_name}}` - Brand name (default: "Linkedbud")
   - `{{email_title}}` - Main heading/title (H1)
   - `{{greeting}}` - Personalized greeting (e.g., "Hi John," or "Hi there,")
   - `{{{main_message_html}}}` - Main content area (use triple-stash for HTML content)
   - `{{cta_label}}` - CTA button text (optional - use with conditional)
   - `{{cta_url}}` - CTA button URL (optional - use with conditional)
   - `{{footer_note}}` - Footer message text
   - `{{unsubscribe_url}}` - Unsubscribe link URL
   - `{{privacy_url}}` - Privacy policy link URL
   - `{{current_year}}` - Current year for copyright

4. **For {{{main_message_html}}}** (base template only):
   - This is only used in the base `template.html` for LLM-generated content
   - When creating specific email templates, hardcode all HTML structure in the template
   - Use `<p>` tags for paragraphs
   - Use `<strong>` or `<b>` for emphasis
   - Use `<a href="...">` for links
   - Use `<ul>` and `<li>` for lists
   - Keep HTML simple and email-client compatible
   - **Important**: Code should never generate HTML - all HTML belongs in templates

5. **Personalization**: Ensure the greeting is personalized if recipient name is provided

6. **CTA Handling with Handlebars conditionals**:
   - The base template uses `{{#if cta_label}}...{{/if}}` to conditionally show the CTA
   - If CTA is needed: Include both `cta_label` and `cta_url` in the context object
   - If no CTA is needed: Simply omit `cta_label` from the context (or set it to empty string/null)
   - The conditional block will automatically hide the CTA section when `cta_label` is falsy

7. **Set dynamic values**:
   - `{{current_year}}` should be set to the current year (2025)
   - All URLs should be properly formatted
   - Regular text variables are automatically HTML-escaped by Handlebars
   - **Code should only pass raw data** - never generate HTML strings
   - All HTML structure should be hardcoded in the template itself

8. **Keep structure intact**:
   - Do NOT modify any style attributes
   - Do NOT modify the template structure
   - Only modify placeholder values and the main message HTML content
   - Preserve all CSS and responsive design features
   - Keep Handlebars conditional blocks intact (e.g., `{{#if cta_label}}...{{/if}}`)

### OUTPUT REQUIREMENTS

- Provide the complete HTML email with all placeholders filled in
- Ensure all URLs are properly formatted
- Verify that the HTML is valid and email-client compatible
- The output should be ready to save as a new template file
- File should be saved as: `src/shared/email/templates/[email-type-name].html`

### EXAMPLE OUTPUT STRUCTURE

The generated template should:
1. Be a complete, standalone HTML file
2. Use the exact structure from `template.html`
3. Have all `{{placeholder}}` values replaced with actual content
4. Be ready to use with the `renderTemplate()` utility
5. Follow Linkedbud's brand guidelines and design system

### ADDITIONAL NOTES

- **Handlebars Syntax**: The templates use Handlebars templating engine
  - `{{variable}}` - Regular variables (HTML-escaped)
  - `{{{variable}}}` - Raw HTML variables (no escaping)
  - `{{#if variable}}...{{/if}}` - Conditional rendering
  - `{{#each items}}...{{/each}}` - Loops (if needed)
- Variables will be replaced programmatically using `renderTemplate(template, context)`
- The context object can include nested objects, arrays, and any JavaScript values
- Keep the HTML structure identical to the base template
- Only modify content within the designated editable sections
- Test the email in multiple clients before deploying

Please generate the complete email HTML template now, following all the instructions above.
```

---

## Example: Generating a Welcome Email

Here's how you would use the prompt above:

**EMAIL CONTEXT:**

- Email Type: Welcome email for new user signup
- Recipient Name: Sarah Johnson
- Recipient Email: sarah@example.com

**EMAIL CONTENT REQUIREMENTS:**

- Subject Line: Welcome to Linkedbud - Your LinkedIn Co-Pilot
- Preheader Text: Start creating powerful LinkedIn content with AI assistance
- Title: Welcome to Linkedbud!
- Main Message: Thank Sarah for signing up, explain key features (AI ideation, drafting, scheduling, analytics), highlight first steps
- Tone: Warm, welcoming, and helpful
- CTA:
  - CTA Label: Get Started
  - CTA URL: https://linkedbud.com/dashboard
- Footer Note: Questions? Reply to this email or visit our help center.

The LLM would then generate a complete HTML template file ready to be saved.

## Implementation Steps

After generating a new template:

1. **Save the template**: Save the generated HTML to `src/shared/email/templates/[email-type].html`

2. **Create a template function** in `templates.ts`:

```typescript
export function generate[EmailType]HTML(
  recipientName: string,
  // ... other parameters
): string {
  const templatePath = 'src/shared/email/templates/[email-type].html';
  const template = loadTemplateSync(templatePath);

  return renderTemplate(template, {
    recipient_name: recipientName,
    // ... other variables
  });
}
```

3. **Export the function** from `index.ts`:

```typescript
export * from "./templates";
```

4. **Use in your code**:

```typescript
import { generate[EmailType]HTML } from "@/shared/email";

const html = generate[EmailType]HTML(recipientName, ...);
```

## Template Variables Reference

### Standard Variables

- `{{brand_name}}` - Brand name (default: "Linkedbud")
- `{{email_title}}` - Main heading/title (H1)
- `{{greeting}}` - Personalized greeting
- `{{{main_message_html}}}` - Main content area (base template only - for LLM-generated content)
- `{{current_year}}` - Current year (e.g., "2025")
- `{{privacy_url}}` - Privacy policy URL
- `{{unsubscribe_url}}` - Unsubscribe URL

**Note**: `{{{main_message_html}}}` is only used in the base template. Specific email templates should have all HTML structure hardcoded in the template file itself.

### Optional Variables

- `{{cta_label}}` - CTA button text (use with `{{#if cta_label}}` conditional)
- `{{cta_url}}` - CTA button URL (use with `{{#if cta_label}}` conditional)
- `{{footer_note}}` - Footer message text
- `{{preheader_text}}` - Preheader text (90-130 characters)
- `{{subject}}` - Email subject (for reference in comments)

### Conditional Rendering

The base template uses Handlebars conditionals for optional sections:

```handlebars
{{#if cta_label}}
  <!-- CTA button section -->
{{/if}}
```

To show the CTA, include `cta_label` in the context. To hide it, omit it or set it to an empty string.

### Custom Variables

You can add any custom variables using Handlebars syntax. Just make sure to include them in the `renderTemplate()` context object. Use `{{variable}}` for text and `{{{variable}}}` for HTML content.

## Best Practices

1. **Keep templates separate**: Each email type should have its own template file
2. **Use consistent naming**: Name templates descriptively (e.g., `welcome-email.html`)
3. **Test before deploying**: Always test emails in multiple clients (Gmail, Outlook, Apple Mail)
4. **Keep HTML simple**: Use email-safe HTML only (avoid complex CSS, JavaScript)
5. **Mobile-first**: Templates are already responsive, but test on mobile devices
6. **Accessibility**: Templates include proper semantic HTML and ARIA attributes

## Platform Compatibility

These utilities work in both environments:

- **Node.js (Next.js)**: Use `loadTemplateSync()` for synchronous loading
- **Deno (Edge Functions)**: Use `loadTemplate()` for async loading (templates should be bundled with shared code)

## File Locations

- **Templates**: `src/shared/email/templates/`
- **Template utilities**: `src/shared/email/template-utils.ts`
- **Template loader**: `src/shared/email/template-loader.ts`
- **Template functions**: `src/shared/email/templates.ts`
- **Email sending**: `src/lib/email.ts`

## See Also

- [Templates README](./templates/README.md) - Detailed template documentation
- [Shared Code README](../README.md) - General shared code guidelines
