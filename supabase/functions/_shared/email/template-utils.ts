/**
 * Shared email template utilities
 * Works in Node.js (Next.js) environments
 * 
 * Uses Handlebars for template rendering with support for:
 * - Variable interpolation: {{variable}} (HTML-escaped)
 * - Raw HTML: {{{variable}}} (no escaping - use only in templates, never from code)
 * - Conditionals: {{#if variable}}...{{/if}}
 * - Helpers: {{#each items}}...{{/each}}
 * 
 * IMPORTANT: All HTML structure should be in templates, not generated in code.
 * Only pass raw data values to templates.
 * 
 * Note: Deno support would require bundling handlebars with the shared code.
 */

// Lazy-loaded Handlebars instance
let Handlebars: typeof import("handlebars") | null = null;

/**
 * Get Handlebars instance (lazy-loaded for platform compatibility)
 * Note: Currently only supports Node.js. Deno support would require bundling.
 */
async function getHandlebars(): Promise<typeof import("handlebars")> {
  if (Handlebars) {
    return Handlebars;
  }

  // Node.js environment only
  // Deno support would require bundling handlebars with the shared code
  Handlebars = await import("handlebars");

  // Register custom helpers
  registerHandlebarsHelpers(Handlebars);

  return Handlebars;
}

/**
 * Synchronous version for Node.js (not available in Deno)
 * Use this only in Node.js environments
 */
function getHandlebarsSync(): typeof import("handlebars") {
  // @ts-ignore - Deno is not available in Node.js
  if (typeof Deno !== "undefined") {
    throw new Error(
      "getHandlebarsSync is not available in Deno. Use renderTemplateAsync instead."
    );
  }

  if (Handlebars) {
    return Handlebars;
  }

  // Node.js environment - use require for synchronous loading
  Handlebars = require("handlebars");
  
  if (!Handlebars) {
    throw new Error("Failed to load Handlebars");
  }
  
  registerHandlebarsHelpers(Handlebars);

  return Handlebars;
}

/**
 * Register custom Handlebars helpers
 */
function registerHandlebarsHelpers(hb: typeof import("handlebars")) {
  // Helper for equality checks
  hb.registerHelper("eq", function (a: any, b: any) {
    return a === b;
  });

  // Helper for safe HTML output (triple-stash {{{variable}}} already exists in Handlebars)
  // Handlebars escapes by default with {{variable}}, use {{{variable}}} for raw HTML
  // No additional helpers needed for basic use cases
}

/**
 * Render a Handlebars template string with the provided context
 * @param template - The Handlebars template string
 * @param context - Object with variable names and their values (can include nested objects, arrays, etc.)
 * @returns Rendered template with all placeholders replaced
 */
export async function renderTemplateAsync(
  template: string,
  context: Record<string, any>
): Promise<string> {
  const hb = await getHandlebars();
  const compiled = hb.compile(template);
  return compiled(context);
}

/**
 * Render a Handlebars template string synchronously (Node.js only)
 * @param template - The Handlebars template string
 * @param context - Object with variable names and their values (can include nested objects, arrays, etc.)
 * @returns Rendered template with all placeholders replaced
 */
export function renderTemplate(
  template: string,
  context: Record<string, any>
): string {
  const hb = getHandlebarsSync();
  const compiled = hb.compile(template);
  return compiled(context);
}

/**
 * Template context interface for type safety
 * Can include nested objects, arrays, and any valid JavaScript values
 */
export interface TemplateContext {
  [key: string]: any;
}


