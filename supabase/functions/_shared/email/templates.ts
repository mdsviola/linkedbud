/**
 * Shared email template generation utilities
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 *
 * Templates are loaded from HTML files and rendered using Handlebars.
 * All HTML structure is defined in templates - code only passes raw data values.
 *
 * Handlebars syntax supported:
 * - Variable interpolation: {{variable}} (HTML-escaped)
 * - Conditionals: {{#if variable}}...{{/if}}
 * - Raw HTML: {{{variable}}} (only used in templates, never generated in code)
 * - Helpers: {{#each items}}...{{/each}}
 */

import { renderTemplate } from "./template-utils";
import { loadTemplateSync } from "./template-loader";

/**
 * Generate post published notification email HTML
 * Loads the template from file and replaces variables
 *
 * Note: In Node.js, the path is relative to process.cwd() (project root)
 * In Deno, the path should be relative to the current file or absolute
 */
export function generatePostPublishedNotificationHTML(
  recipientName: string,
  postUrl: string,
  privacyUrl: string
): string {
  // @ts-ignore - Deno is not available in Node.js
  if (typeof Deno !== "undefined") {
    // Deno environment - use relative path from the shared directory
    const templatePath = new URL(
      "./templates/post-published-notification.html",
      import.meta.url
    ).pathname;
    // Use async loader in Deno (would need to make this function async)
    // For now, we'll use a workaround - templates should be bundled with the shared code
    throw new Error(
      "Deno template loading not yet implemented. Templates should be bundled with shared code."
    );
  } else {
    // Node.js environment - path relative to project root
    const templatePath =
      "src/shared/email/templates/post-published-notification.html";
    const template = loadTemplateSync(templatePath);

    return renderTemplate(template, {
      recipient_name: recipientName,
      post_url: postUrl,
      privacy_url: privacyUrl,
    });
  }
}

/**
 * Generate post published notification email plain text version
 * Note: Plain text version doesn't use a template file, but could be moved to one if needed
 */
export function generatePostPublishedNotificationText(
  recipientName: string,
  postUrl: string,
  appUrl: string
): string {
  // For now, keep plain text as a simple template string since it's much shorter
  // This could be moved to a .txt template file if desired
  return `Your Post is Live!

Hi ${recipientName},

Great news! Your scheduled LinkedIn post has been successfully published and is now live on your profile.

Your content is now reaching your network. You can view the post directly on LinkedIn, and we'll start tracking its performance metrics shortly.

Want to see how it's performing? Check your analytics dashboard to monitor engagement, views, and interactions as they come in.

View Post: ${postUrl}

Keep creating great content! If you have any questions or need help, we're here to support you.

Privacy Policy: ${appUrl}/privacy

© 2025 linkedbud. All rights reserved.`;
}

/**
 * Generate user feedback submission notification email HTML
 * Loads the template from file and replaces variables
 */
export function generateUserFeedbackSubmissionHTML(
  feedbackTypeDisplay: string,
  feedbackMessage: string,
  userEmail: string,
  feedbackId: string | null,
  adminUrl: string | null,
  privacyUrl: string
): string {
  // @ts-ignore - Deno is not available in Node.js
  if (typeof Deno !== "undefined") {
    throw new Error(
      "Deno template loading not yet implemented. Templates should be bundled with shared code."
    );
  } else {
    // Node.js environment - path relative to project root
    const templatePath =
      "src/shared/email/templates/user-feedback-submission.html";
    const template = loadTemplateSync(templatePath);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const currentYear = new Date().getFullYear().toString();

    return renderTemplate(template, {
      subject: `New Feedback Submission - ${feedbackTypeDisplay}`,
      preheader_text: `New feedback submission: ${feedbackTypeDisplay} from ${userEmail}`,
      brand_name: "linkedbud",
      email_title: "New Feedback Submission",
      greeting: "Hi,",
      feedback_type_display: feedbackTypeDisplay,
      feedback_message: feedbackMessage.trim(),
      user_email: userEmail,
      feedback_id: feedbackId,
      cta_label: adminUrl ? "View in Admin Dashboard" : "",
      cta_url: adminUrl || "",
      footer_note:
        "This is an automated notification from the linkedbud feedback system. All feedback submissions are logged in the admin dashboard for tracking and follow-up.",
      privacy_url: privacyUrl,
      current_year: currentYear,
    });
  }
}

/**
 * Generate waitlist support notification email HTML
 * Loads the template from file and replaces variables
 * Notifies support@linkedbud.com when a user joins the waitlist
 */
export function generateWaitlistSupportNotificationHTML(
  userEmail: string,
  signupDate: string | null,
  waitlistPosition: number | null,
  totalWaitlistCount: number | null,
  adminUrl: string | null,
  privacyUrl: string
): string {
  // @ts-ignore - Deno is not available in Node.js
  if (typeof Deno !== "undefined") {
    throw new Error(
      "Deno template loading not yet implemented. Templates should be bundled with shared code."
    );
  } else {
    // Node.js environment - path relative to project root
    const templatePath =
      "src/shared/email/templates/waitlist-support-notification.html";
    const template = loadTemplateSync(templatePath);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const currentYear = new Date().getFullYear().toString();

    return renderTemplate(template, {
      subject: "New Waitlist Signup",
      preheader_text: `New waitlist signup from ${userEmail}`,
      brand_name: "linkedbud",
      email_title: "New Waitlist Signup",
      greeting: "Hi,",
      user_email: userEmail,
      signup_date: signupDate,
      waitlist_position: waitlistPosition,
      total_waitlist_count: totalWaitlistCount,
      cta_label: adminUrl ? "View Waitlist" : "",
      cta_url: adminUrl || "",
      footer_note:
        "This is an automated notification from the linkedbud waitlist system. All waitlist signups are logged for tracking and follow-up.",
      privacy_url: privacyUrl,
      current_year: currentYear,
    });
  }
}
