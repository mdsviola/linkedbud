"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PostStatusBadge } from "@/components/post-status-badge";
import { truncateContent, formatDateOnly } from "@/lib/utils";

interface PostCardLinkedInPost {
  linkedin_post_id: string;
  status: string;
  published_at: string;
  organization_id: string | null;
}

interface PostCardPost {
  id: number;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduled_publish_date: string | null;
  published_at: string | null;
  created_at: string;
  linkedin_posts?: PostCardLinkedInPost[];
}

interface PostCardProps {
  post: PostCardPost;
  status?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

export function PostCard({ post, status }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Post #{post.id}
                </h3>
                <PostStatusBadge
                  status={post.status}
                  scheduledPublishDate={post.scheduled_publish_date}
                  publishedAt={post.published_at}
                  linkedinPosts={post.linkedin_posts}
                />
              </div>
              <p className="text-gray-600 text-sm mb-2 break-words line-clamp-2">
                {truncateContent(post.content)}
              </p>
              <p className="text-xs text-gray-500">
                Created {formatDateOnly(post.created_at, "numeric")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
