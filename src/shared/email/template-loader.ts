/**
 * Shared email template loader
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 *
 * Note: This file provides platform-agnostic template loading.
 * In Node.js, templates are read from the file system.
 * In Deno, templates are read using Deno.readTextFile.
 */

/**
 * Load a template file as a string
 * This function works in both Node.js and Deno environments
 *
 * @param templatePath - Path to the template file (relative to project root in Node.js, or relative/absolute in Deno)
 * @returns Promise that resolves to the template content as a string
 */
export async function loadTemplate(templatePath: string): Promise<string> {
  // Detect if we're in Deno environment
  // @ts-ignore - Deno is not available in Node.js
  if (typeof Deno !== "undefined") {
    // Deno environment
    // @ts-ignore
    return await Deno.readTextFile(templatePath);
  } else {
    // Node.js environment
    // Use dynamic import to avoid issues in Deno
    const fs = await import("fs");
    const path = await import("path");

    // In Next.js, we need to resolve from the project root
    const resolvedPath = path.isAbsolute(templatePath)
      ? templatePath
      : path.join(process.cwd(), templatePath);

    return fs.promises.readFile(resolvedPath, "utf-8");
  }
}

/**
 * Synchronous version for Node.js (not available in Deno)
 * Use this only in Node.js environments
 */
export function loadTemplateSync(templatePath: string): string {
  // @ts-ignore - Deno is not available in Node.js
  if (typeof Deno !== "undefined") {
    throw new Error(
      "loadTemplateSync is not available in Deno. Use loadTemplate instead."
    );
  }

  // Node.js environment
  const fs = require("fs");
  const path = require("path");

  const resolvedPath = path.isAbsolute(templatePath)
    ? templatePath
    : path.join(process.cwd(), templatePath);

  return fs.readFileSync(resolvedPath, "utf-8");
}












