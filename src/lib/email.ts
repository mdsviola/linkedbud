import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";
import {
  generatePostPublishedNotificationHTML,
  generatePostPublishedNotificationText,
  generateUserFeedbackSubmissionHTML,
  generateWaitlistSupportNotificationHTML,
  getRecipientName,
  renderTemplate,
} from "@/shared/email";

const resend = new Resend(process.env.RESEND_API_KEY);

// Get sender email from env or use Resend's test email for development
const getSenderEmail = () => {
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }
  // Use Resend's test email for development (doesn't require domain verification)
  return "onboarding@resend.dev";
};

/**
 * Send confirmation email to user who registered interest in the waitlist
 */
export async function sendWaitlistConfirmationEmail(email: string) {
  try {
    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const privacyUrl = `${appUrl}/privacy`;
    const currentYear = new Date().getFullYear().toString();

    // Read the email template from shared folder
    const templatePath = join(
      process.cwd(),
      "src/shared/email/templates/waitlist-confirmation.html"
    );

    console.log(`Reading email template from: ${templatePath}`);
    let emailHTML = readFileSync(templatePath, "utf-8");

    // Replace placeholders using the renderTemplate utility
    emailHTML = renderTemplate(emailHTML, {
      app_url: appUrl,
      privacy_url: privacyUrl,
      current_year: currentYear,
    });

    // Generate plain text version
    const textContent = generateWaitlistConfirmationText(appUrl);

    const senderEmail = getSenderEmail();
    console.log(
      `Sending waitlist confirmation email to: ${email} from: ${senderEmail}`
    );
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [email],
      subject: "Thanks for your interest in linkedbud!",
      html: emailHTML,
      text: textContent,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error, null, 2));
      return false;
    }

    if (data) {
      console.log(`Email sent successfully. Resend ID: ${data.id}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending waitlist confirmation email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

function generateWaitlistConfirmationText(appUrl: string): string {
  return `
Thanks for your interest in linkedbud!

Hi there,

Thank you for joining our waitlist! We're putting the finishing touches on linkedbud and can't wait to share it with you.

As a thank you for your early interest, you'll receive 20% OFF your first month's subscription when we launch!

We'll send you an email as soon as linkedbud is ready. You'll be among the first to know!

In the meantime, you can learn more about what we're building at ${appUrl}.

Best regards,
The linkedbud Team

---
You're receiving this because you registered interest in linkedbud.
  `;
}

/**
 * Send post published notification email to user
 *
 * Note: This function uses shared email utilities from src/shared/email/ for consistency
 * across platforms (Next.js and Edge Functions). The template generation logic is shared
 * between both environments.
 */
export async function sendPostPublishedNotificationEmail(
  userEmail: string,
  userName: string | null,
  postUrl: string
) {
  try {
    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const privacyUrl = `${appUrl}/privacy`;

    // Use user's name or fallback to "there"
    const recipientName = getRecipientName(userEmail, userName);

    // Generate email HTML and text using shared utilities
    // Templates are now loaded from src/shared/email/templates/
    const emailHTML = generatePostPublishedNotificationHTML(
      recipientName,
      postUrl,
      privacyUrl
    );
    const textContent = generatePostPublishedNotificationText(
      recipientName,
      postUrl,
      appUrl
    );

    const senderEmail = getSenderEmail();
    console.log(
      `Sending post published notification email to: ${userEmail} from: ${senderEmail}`
    );
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [userEmail],
      subject: "Your scheduled post is live on LinkedIn!",
      html: emailHTML,
      text: textContent,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error, null, 2));
      return false;
    }

    if (data) {
      console.log(`Email sent successfully. Resend ID: ${data.id}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending post published notification email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

/**
 * Send feedback submission notification email to support
 * Includes screenshot attachment if provided
 */
export async function sendFeedbackSubmissionEmail(
  feedbackType: "issue" | "idea" | "other",
  feedbackMessage: string,
  userEmail: string,
  feedbackId: string | null,
  screenshotBuffer: Buffer | null,
  screenshotFilename: string | null
) {
  try {
    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const privacyUrl = `${appUrl}/privacy`;

    // Map feedback type to display name
    const feedbackTypeDisplay =
      feedbackType === "issue"
        ? "Issue"
        : feedbackType === "idea"
        ? "Idea"
        : "Other";

    // Generate admin URL if feedback ID is provided
    const adminUrl = feedbackId
      ? `${appUrl}/admin/feedback/${feedbackId}`
      : null;

    // Generate email HTML using the template
    const emailHTML = generateUserFeedbackSubmissionHTML(
      feedbackTypeDisplay,
      feedbackMessage,
      userEmail,
      feedbackId,
      adminUrl,
      privacyUrl
    );

    // Generate plain text version
    const textContent = generateFeedbackSubmissionText(
      feedbackTypeDisplay,
      feedbackMessage,
      userEmail,
      feedbackId,
      adminUrl
    );

    const senderEmail = getSenderEmail();
    const supportEmail = "support@linkedbud.com";

    // Prepare email options
    const emailOptions: any = {
      from: senderEmail,
      to: [supportEmail],
      subject: `New Feedback Submission - ${feedbackTypeDisplay}`,
      html: emailHTML,
      text: textContent,
    };

    // Add screenshot attachment if provided
    if (screenshotBuffer && screenshotFilename) {
      emailOptions.attachments = [
        {
          content: screenshotBuffer.toString("base64"),
          filename: screenshotFilename,
        },
      ];
    }

    console.log(
      `Sending feedback submission email to: ${supportEmail} from: ${senderEmail}`
    );
    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error("Resend API error:", JSON.stringify(error, null, 2));
      return false;
    }

    if (data) {
      console.log(`Email sent successfully. Resend ID: ${data.id}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending feedback submission email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

function generateFeedbackSubmissionText(
  feedbackTypeDisplay: string,
  feedbackMessage: string,
  userEmail: string,
  feedbackId: string | null,
  adminUrl: string | null
): string {
  let text = `New Feedback Submission

Hi linkedbud Support,

A user has submitted new feedback through the linkedbud application. Here are the details:

Feedback Type: ${feedbackTypeDisplay}
User Email: ${userEmail}

Message:
${feedbackMessage}
`;

  if (feedbackId) {
    text += `\nFeedback ID: ${feedbackId}\n`;
  }

  text += `\nPlease review this feedback and take appropriate action. If you need to follow up with the user, you can reply directly to ${userEmail}.`;

  if (adminUrl) {
    text += `\n\nView in Admin Dashboard: ${adminUrl}`;
  }

  text += `\n\n---\nThis is an automated notification from the linkedbud feedback system.`;

  return text;
}

/**
 * Send waitlist support notification email to support@linkedbud.com
 * Notifies support when a user joins the waitlist
 */
export async function sendWaitlistSupportNotificationEmail(
  userEmail: string,
  signupDate: string | null = null,
  waitlistPosition: number | null = null,
  totalWaitlistCount: number | null = null,
  adminUrl: string | null = null
) {
  try {
    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const privacyUrl = `${appUrl}/privacy`;

    // Generate email HTML using the template
    const emailHTML = generateWaitlistSupportNotificationHTML(
      userEmail,
      signupDate,
      waitlistPosition,
      totalWaitlistCount,
      adminUrl,
      privacyUrl
    );

    // Generate plain text version
    const textContent = generateWaitlistSupportNotificationText(
      userEmail,
      signupDate,
      waitlistPosition,
      totalWaitlistCount,
      adminUrl
    );

    const senderEmail = getSenderEmail();
    const supportEmail = "support@linkedbud.com";

    console.log(
      `Sending waitlist support notification email to: ${supportEmail} from: ${senderEmail}`
    );
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [supportEmail],
      subject: "New Waitlist Signup",
      html: emailHTML,
      text: textContent,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error, null, 2));
      return false;
    }

    if (data) {
      console.log(`Email sent successfully. Resend ID: ${data.id}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending waitlist support notification email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

function generateWaitlistSupportNotificationText(
  userEmail: string,
  signupDate: string | null,
  waitlistPosition: number | null,
  totalWaitlistCount: number | null,
  adminUrl: string | null
): string {
  let text = `New Waitlist Signup

Hi linkedbud Support,

A new user has joined the linkedbud waitlist. Here are the details:

User Email: ${userEmail}
`;

  if (signupDate) {
    text += `Signup Date: ${signupDate}\n`;
  }

  if (waitlistPosition) {
    text += `Waitlist Position: #${waitlistPosition}`;
    if (totalWaitlistCount) {
      text += ` of ${totalWaitlistCount} total`;
    }
    text += `\n`;
  }

  text += `\nThe user has been sent a confirmation email. You can reach out to them directly at ${userEmail} if needed.`;

  if (adminUrl) {
    text += `\n\nView Waitlist: ${adminUrl}`;
  }

  text += `\n\n---\nThis is an automated notification from the linkedbud waitlist system.`;

  return text;
}

/**
 * Send portfolio invitation email
 */
export async function sendPortfolioInvitationEmail(
  email: string,
  token: string,
  ownerName: string
) {
  try {
    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables");
      return false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${appUrl}/invite/accept/${token}`;
    const privacyUrl = `${appUrl}/privacy`;
    const unsubscribeUrl = `${appUrl}/settings`; // Users can manage preferences in settings
    const currentYear = new Date().getFullYear().toString();
    const brandName = "linkedbud";
    const ownerNameDisplay = ownerName || "A team member";

    // Read the email template
    const templatePath = join(
      process.cwd(),
      "src/shared/email/templates/portfolio-invitation.html"
    );

    console.log(`Reading email template from: ${templatePath}`);
    let emailHTML = readFileSync(templatePath, "utf-8");

    // Replace placeholders using the new template structure
    emailHTML = renderTemplate(emailHTML, {
      brand_name: brandName,
      email_title: "You've been invited to collaborate",
      greeting: `Hi there,`,
      main_message_html: `
        <p style="margin: 0 0 16px 0;">
          <strong>${ownerNameDisplay}</strong> has invited you to collaborate on their linkedbud portfolio.
        </p>
        <p style="margin: 0 0 16px 0;">
          As a collaborator, you'll be able to see and manage posts for LinkedIn organizations that you have access to. Personal posts remain private to their creators.
        </p>
        <p style="margin: 0;">
          This invitation will expire in 7 days. If you don't have an linkedbud account yet, you'll be prompted to create one when you accept the invitation.
        </p>
      `,
      cta_label: "Accept Invitation",
      cta_url: acceptUrl,
      footer_note: "You're receiving this email because you were invited to collaborate on an linkedbud portfolio.",
      unsubscribe_url: unsubscribeUrl,
      privacy_url: privacyUrl,
      current_year: currentYear,
      preheader_text: `${ownerNameDisplay} has invited you to collaborate on their linkedbud portfolio.`,
      // Legacy variables for fallback link
      accept_url: acceptUrl,
      owner_name: ownerNameDisplay,
      app_url: appUrl,
    });

    // Generate plain text version
    const textContent = generatePortfolioInvitationText(
      ownerName || "A team member",
      acceptUrl
    );

    const senderEmail = getSenderEmail();
    console.log(
      `Sending portfolio invitation email to: ${email} from: ${senderEmail}`
    );
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [email],
      subject: "You've been invited to collaborate on linkedbud",
      html: emailHTML,
      text: textContent,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error, null, 2));
      return false;
    }

    if (data) {
      console.log(`Email sent successfully. Resend ID: ${data.id}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending portfolio invitation email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}

function generatePortfolioInvitationText(
  ownerName: string,
  acceptUrl: string
): string {
  return `
You've been invited to collaborate on linkedbud!

Hi there,

${ownerName} has invited you to collaborate on their linkedbud portfolio.

As a collaborator, you'll be able to see and manage posts for LinkedIn organizations that you have access to. Personal posts remain private to their creators.

Accept your invitation here:
${acceptUrl}

This invitation will expire in 7 days. If you don't have an linkedbud account yet, you'll be prompted to create one when you accept the invitation.

---
© ${new Date().getFullYear()} linkedbud. All rights reserved.
`;
}
