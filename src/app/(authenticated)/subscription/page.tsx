import { createServerClient } from "@/lib/supabase-server";
import { getGenerationLimits } from "@/lib/auth";
import { SubscriptionClient } from "./subscription-client";

export default async function SubscriptionPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Redirect will happen client-side
  }

  const limits = getGenerationLimits();

  return <SubscriptionClient user={user} limits={limits} />;
}
