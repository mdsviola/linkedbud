import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { scrapeArticleContent } from "@/lib/scrapingbee";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Valid URL is required" },
        { status: 400 }
      );
    }

    try {
      const { content, title } = await scrapeArticleContent(url);

      return NextResponse.json({
        success: true,
        content,
        title,
      });
    } catch (error) {
      console.error("Error scraping article:", error);

      return NextResponse.json(
        { error: "Failed to scrape article content" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in scrape-article API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
