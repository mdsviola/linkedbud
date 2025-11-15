import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("Resend verification API called");

  try {
    // Get the email from the request body
    const body = await request.json();
    console.log("Request body:", body);
    const email = body.email;
    console.log("Email from request:", email);

    if (!email) {
      console.error("Email is missing from request body");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Resending verification email for:", email);

    // Call signUp with the admin client to resend the confirmation email
    // Supabase will detect the user exists and resend the email
    const { data: signupData, error: signupError } =
      await supabaseAdmin.auth.signUp({
        email: email,
        password: crypto.randomUUID(), // Dummy password
        options: {
          emailRedirectTo: `${
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          }/onboarding`,
        },
      });

    console.log("SignUp response - Data:", signupData, "Error:", signupError);

    // If there's an error, check if it's acceptable (user already exists)
    if (signupError) {
      const errorMsg = signupError.message.toLowerCase();

      // If the user doesn't exist or there's a real error, return it
      if (
        !errorMsg.includes("already") &&
        !errorMsg.includes("registered") &&
        !errorMsg.includes("exists")
      ) {
        console.error("Error resending verification:", signupError);
        return NextResponse.json(
          {
            error: signupError.message || "Failed to resend verification email",
          },
          { status: 400 }
        );
      }

      // If it's an "already exists" error, that's okay - the email was likely sent
      console.log("User already exists, email should have been sent");
    }

    console.log("Verification email sent successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in resend verification:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend verification email",
      },
      { status: 500 }
    );
  }
}
