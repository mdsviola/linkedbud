import { redirect } from "next/navigation";

export default function PostsPage() {
  // Redirect to published posts by default
  redirect("/posts/published");
}
