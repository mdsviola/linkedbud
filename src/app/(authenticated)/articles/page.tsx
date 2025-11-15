import { requireAuth } from "@/lib/auth";
import { ArticlesClient } from "./articles-client";

export default async function ArticlesPage() {
  const user = await requireAuth();

  return <ArticlesClient user={user} />;
}

