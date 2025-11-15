import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getInvitationByToken, acceptInvitation } from "@/lib/portfolio-invitations";
import { getUserPortfolio } from "@/lib/portfolio";

interface PageProps {
  params: {
    token: string;
  };
}

export default async function AcceptInvitationPage({ params }: PageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get invitation
  const invitation = await getInvitationByToken(params.token);

  if (!invitation) {
    redirect("/auth/signin?error=invalid_invitation");
  }

  // If user is not logged in, redirect to signup with token
  if (!user) {
    redirect(`/auth/signup?invite_token=${params.token}&email=${encodeURIComponent(invitation.email)}`);
  }

  // If user is logged in, try to accept
  try {
    const success = await acceptInvitation(params.token, user.id);

    if (success) {
      redirect("/posts?invited=true");
    } else {
      redirect("/auth/signin?error=accept_failed");
    }
  } catch (error) {
    console.error("Error accepting invitation:", error);
    redirect("/auth/signin?error=accept_failed");
  }
}

