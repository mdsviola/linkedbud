/**
 * Shared Resend email sending utilities
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 * Uses fetch API which is available in both environments
 */

import type { EmailRecipient } from "./types";
import {
  generatePostPublishedNotificationHTML,
  generatePostPublishedNotificationText,
} from "./templates";
import { getRecipientName } from "./types";

/**
 * Send email via Resend API (platform-agnostic, works in both Node.js and Deno)
 */
export async function sendEmailViaResend(
  apiKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string,
  text: string
): Promise<{ id: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Resend API error: ${response.status} ${JSON.stringify(errorData)}`
    );
  }

  return await response.json();
}

/**
 * Send post published notification email
 * Platform-agnostic function that works in both Node.js and Deno
 */
export async function sendPostPublishedNotificationEmail(
  apiKey: string,
  recipient: EmailRecipient,
  postUrl: string,
  appUrl: string,
  senderEmail?: string
): Promise<{ id: string }> {
  const recipientName = getRecipientName(recipient.email, recipient.name);
  const privacyUrl = `${appUrl}/privacy`;
  const fromEmail = senderEmail || "onboarding@resend.dev";

  const html = generatePostPublishedNotificationHTML(
    recipientName,
    postUrl,
    privacyUrl
  );
  const text = generatePostPublishedNotificationText(
    recipientName,
    postUrl,
    appUrl
  );

  return await sendEmailViaResend(
    apiKey,
    fromEmail,
    [recipient.email],
    "Your scheduled post is live on LinkedIn!",
    html,
    text
  );
}



