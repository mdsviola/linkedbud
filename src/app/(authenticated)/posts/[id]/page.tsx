import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { PostDetailClient } from "./post-detail-client";

interface PostPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PostPage({
  params,
  searchParams,
}: PostPageProps) {
  // Hint to Next to avoid caching this route
  const supabase = createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/signin");
  }

  const { id } = params;

  try {
    // We no longer fetch the post here; client will fetch fresh data by id
    return <PostDetailClient postId={Number(id)} />;
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;
