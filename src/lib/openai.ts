import OpenAI from "openai";

// Post variant types - manually defined since Database type may be incomplete
export interface PostVariant {
  hook: string;
  body: string;
}

export interface DraftVariant {
  hook: string;
  body: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SummarizationInput {
  industryKeywords: string[];
  userTone: string;
  articleSnippets: string[];
  sourceInfo?: {
    url: string;
    title: string;
  };
  postType?: string;
  customPrompt?: string;
  targetAudience?: string;
  keyPoints?: string;
  callToAction?: string;
  includeHashtags?: boolean;
  includeSourceArticle?: boolean;
  includeEmojis?: boolean;
  maxLength?: number;
  language?: string;
  voiceProfile?: {
    voice_data: any;
    voice_description: string;
  };
}

export interface VoiceProfile {
  voice_data: {
    tone: string;
    sentence_length: string; // "short", "medium", "long", "mixed"
    vocabulary_complexity: string; // "simple", "moderate", "complex"
    formality: string; // "casual", "semi-formal", "formal"
    uses_emojis: boolean;
    uses_questions: boolean;
    uses_statistics: boolean;
    storytelling_style?: string;
    engagement_tactics?: string[];
    common_phrases?: string[];
    writing_patterns?: string[];
  };
  voice_description: string;
}

export interface SummarizationOutput {
  twoParaSummary: string;
  draftVariants: DraftVariant[]; // Keep for backward compatibility
  postVariants: PostVariant[]; // New interface
}

// TODO: Make user preferences dynamic - currently hardcoded, needs to include tone and other user settings
export async function selectRelevantArticles(
  articles: Array<{
    title: string;
    link: string;
    source: string;
    pubDate?: string;
    contentSnippet?: string;
  }>,
  userTopics: string[]
): Promise<Array<{ index: number; reason: string }>> {
  if (articles.length === 0) {
    return [];
  }

  const prompt = buildArticleSelectionPrompt(articles, userTopics);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert content curator who specializes in selecting the most relevant articles based on user interests. You understand user preferences and can identify which articles would be most valuable to them.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    return parseArticleSelectionResponse(content, articles.length);
  } catch (error) {
    console.error("Error selecting relevant articles:", error);
    // Re-throw the error so the API can handle it properly
    throw error;
  }
}

function buildArticleSelectionPrompt(
  articles: Array<{
    title: string;
    link: string;
    source: string;
    pubDate?: string;
    contentSnippet?: string;
  }>,
  userTopics: string[]
): string {
  const articlesList = articles
    .map((article, index) => `${index + 1}. ${article.title}`)
    .join("\n");

  return `
User is interested in these topics: ${userTopics.join(", ")}

Here are ${articles.length} articles to choose from:

${articlesList}

Please analyze these articles and select the 10 most relevant ones based on the user's interests. Consider:
- How well the article title matches the user's topics
- The recency of the article (if publication date is available)
- The diversity of sources
- The potential value to someone interested in these topics

Return your response as a JSON array of objects, ordered by relevance (most relevant first). Each object should contain:
- "index": the article number (1-based indexing)
- "reason": a brief explanation (1-2 sentences) of why this article is relevant to the user's interests

For example: [
  {"index": 3, "reason": "Directly discusses renewable energy trends, matching the user's interest in sustainability"},
  {"index": 7, "reason": "Covers cleantech innovations that align with the user's focus on green technology"},
  {"index": 1, "reason": "Addresses climate change policies relevant to environmental topics"}
]

If there are fewer than 10 articles, return all relevant ones.
`;
}

function parseArticleSelectionResponse(
  content: string,
  totalArticles: number
): Array<{ index: number; reason: string }> {
  try {
    // Try to extract JSON array from the response
    let jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      // Try to find JSON between code blocks
      jsonMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]];
      }
    }

    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const selections = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(selections)) {
      throw new Error("Response is not an array");
    }

    // Validate and convert 1-based indices to 0-based
    const validSelections = selections
      .filter(
        (item: any) =>
          item &&
          typeof item === "object" &&
          typeof item.index === "number" &&
          typeof item.reason === "string"
      )
      .map((item: any) => ({
        index: item.index - 1, // Convert to 0-based
        reason: item.reason,
      }))
      .filter(
        (item: any) =>
          Number.isInteger(item.index) &&
          item.index >= 0 &&
          item.index < totalArticles
      )
      .slice(0, 10); // Limit to 10 articles

    return validSelections;
  } catch (error) {
    console.error("Error parsing article selection response:", error);
    // Re-throw the error so the API can handle it properly
    throw error;
  }
}

export async function summarizeAndGenerateDrafts(
  input: SummarizationInput
): Promise<SummarizationOutput> {
  const userPrompt = buildSummarizationPrompt(input);

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a professional LinkedIn content creator who specializes in transforming industry news into engaging posts. You understand different writing tones and can adapt content accordingly.",
    },
    {
      role: "user" as const,
      content: userPrompt,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    return parseAIResponse(content);
  } catch (error) {
    console.error("Error generating drafts:", error);
    throw new Error("Failed to generate drafts");
  }
}

function buildSummarizationPrompt(input: SummarizationInput): string {
  const {
    industryKeywords,
    userTone,
    articleSnippets,
    sourceInfo,
    postType = "Industry News",
    customPrompt = "",
    targetAudience = "Industry Professionals",
    keyPoints = "",
    callToAction = "",
    includeHashtags = false,
    includeSourceArticle = true,
    includeEmojis = false,
    maxLength = 1200,
    language = "English",
    voiceProfile,
  } = input;

  const hashtagInstruction = includeHashtags
    ? "Include 3-5 relevant hashtags at the end of each post"
    : "Do not include hashtags";

  const emojiInstruction = includeEmojis
    ? "Include 1-3 relevant emojis strategically placed throughout each post to enhance engagement"
    : "Do not include emojis";

  const sourceArticleInstruction =
    includeSourceArticle && sourceInfo
      ? `Include source attribution at the end of each variant body: "Source: ${sourceInfo.url}"`
      : includeSourceArticle
      ? "Include source attribution at the end of each variant body"
      : "Do not include any references to source articles";

  const ctaInstruction = callToAction
    ? `At least one variant should include this specific call to action: "${callToAction}"`
    : "At least one variant should include a question or call to action";

  const keyPointsSection = keyPoints
    ? `\n\nKey points to highlight: ${keyPoints}`
    : "";

  const customInstructions = customPrompt
    ? `\n\nAdditional instructions: ${customPrompt}`
    : "";

  const languageInstruction =
    language && language !== "English"
      ? `\n- Output Language: All content must be written in ${language}. Ensure proper grammar, spelling, and cultural appropriateness for ${language} speakers.`
      : "";

  // Build voice profile instructions if provided
  let voiceProfileSection = "";
  if (voiceProfile) {
    const voiceData = voiceProfile.voice_data;
    const voiceDesc = voiceProfile.voice_description;

    voiceProfileSection = `\n\nCUSTOM VOICE PROFILE:
The following voice profile must be matched EXACTLY in the generated content:

VOICE DESCRIPTION:
${voiceDesc}

VOICE CHARACTERISTICS:
- Tone: ${voiceData.tone || "Not specified"}
- Sentence Length: ${voiceData.sentence_length || "Not specified"}
- Vocabulary Complexity: ${voiceData.vocabulary_complexity || "Not specified"}
- Formality Level: ${voiceData.formality || "Not specified"}
- Uses Emojis: ${voiceData.uses_emojis ? "Yes" : "No"}
- Uses Questions: ${voiceData.uses_questions ? "Yes" : "No"}
- Uses Statistics: ${voiceData.uses_statistics ? "Yes" : "No"}${voiceData.storytelling_style ? `\n- Storytelling Style: ${voiceData.storytelling_style}` : ""}${voiceData.engagement_tactics && voiceData.engagement_tactics.length > 0 ? `\n- Engagement Tactics: ${voiceData.engagement_tactics.join(", ")}` : ""}${voiceData.common_phrases && voiceData.common_phrases.length > 0 ? `\n- Common Phrases: ${voiceData.common_phrases.join(", ")}` : ""}${voiceData.writing_patterns && voiceData.writing_patterns.length > 0 ? `\n- Writing Patterns: ${voiceData.writing_patterns.join(", ")}` : ""}

IMPORTANT: The generated content MUST match this voice profile exactly. Follow the same tone, sentence structure, vocabulary level, formality, and engagement patterns described above.`;
  }

  return `
You are a professional LinkedIn content creator specializing in the ${industryKeywords.join(
    ", "
  )} industry.

CONTENT REQUIREMENTS:
- Post Type: ${postType}
- Target Audience: ${targetAudience}
- Writing Tone: ${userTone}${voiceProfile ? " (matching the custom voice profile below)" : ""}
- Maximum character length per post: ${maxLength}${languageInstruction}
- ${hashtagInstruction}
- ${sourceArticleInstruction}
- ${emojiInstruction}${voiceProfileSection}

CONTENT SOURCE:
${articleSnippets.map((snippet, i) => `${i + 1}. ${snippet}`).join("\n")}${
    sourceInfo
      ? `\n\nSource Article: "${sourceInfo.title}"\nURL: ${sourceInfo.url}`
      : ""
  }${keyPointsSection}${customInstructions}

TASK:
Create engaging LinkedIn content that resonates with ${targetAudience} using a ${userTone} tone${voiceProfile ? " while matching the custom voice profile above" : ""}. The content should be formatted as ${postType} and stay within ${maxLength} characters.${
    language && language !== "English"
      ? ` All content must be written entirely in ${language} with proper grammar, spelling, and cultural context.`
      : ""
  }${voiceProfile ? "\n\nCRITICAL: The writing style, tone, sentence structure, vocabulary, and engagement patterns MUST match the custom voice profile described above. This is the user's authentic writing voice and must be replicated exactly." : ""}

Please provide:

1. A two-paragraph summary (max 120 words total) that:
   - Captures the key points neutrally and factually
   - Avoids promotional language
   - Focuses on the most important developments
   - Incorporates the specified key points: ${keyPoints || "None specified"}

2. Three LinkedIn post variants, each with:
   - Hook (max 120 characters, designed to avoid "See more" truncation)
   - Body (max ${maxLength} characters)
   - ${hashtagInstruction}
   - ${sourceArticleInstruction}
   - ${emojiInstruction}
   - ${ctaInstruction}
   - Tone should match: ${userTone}
   - Content should be appropriate for: ${targetAudience}
   - Post type: ${postType}
   - ${
     customPrompt ? `Follow these specific instructions: ${customPrompt}` : ""
   }

IMPORTANT: Each variant should offer a different angle or approach while maintaining the specified tone and targeting the specified audience.

${
  includeSourceArticle && sourceInfo
    ? `
SOURCE ATTRIBUTION: Each variant must end with "Source: ${sourceInfo.url}" or "Read more: ${sourceInfo.url}"
`
    : ""
}

IMPORTANT: You MUST respond with valid JSON only. Do not include any text before or after the JSON.

Format your response as JSON:
{
  "summary": "Your two-paragraph summary here",
  "variants": [
    {
      "hook": "Hook text here",
      "body": "Body text here${
        includeSourceArticle && sourceInfo
          ? `\n\nSource: ${sourceInfo.url}`
          : ""
      }"
    },
    {
      "hook": "Hook text here",
      "body": "Body text here${
        includeSourceArticle && sourceInfo
          ? `\n\nRead more: ${sourceInfo.url}`
          : ""
      }"
    },
    {
      "hook": "Hook text here",
      "body": "Body text here${
        includeSourceArticle && sourceInfo
          ? `\n\nSource: ${sourceInfo.url}`
          : ""
      }"
    }
  ]
}
`;
}

function parseAIResponse(content: string): SummarizationOutput {
  try {
    // Clean the content first - remove any markdown formatting
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/```json\s*/, "")
        .replace(/```\s*$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/```\s*/, "")
        .replace(/```\s*$/, "");
    }

    // Try to extract JSON from the response - look for the JSON block more carefully
    let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);

    // If no match, try to find JSON between code blocks
    if (!jsonMatch) {
      jsonMatch = cleanedContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]]; // Extract just the JSON part
      }
    }

    // If still no match, try to find any JSON-like structure
    if (!jsonMatch) {
      jsonMatch = cleanedContent.match(/\{[\s\S]*?"summary"[\s\S]*?\}/);
    }

    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      !parsed.summary ||
      !parsed.variants ||
      !Array.isArray(parsed.variants)
    ) {
      throw new Error("Invalid response format");
    }

    const variants = parsed.variants.map((variant: any) => ({
      hook: variant.hook || "",
      body: variant.body || "",
    }));

    return {
      twoParaSummary: parsed.summary,
      draftVariants: variants, // Keep for backward compatibility
      postVariants: variants, // New interface
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Re-throw the error so the caller can handle it appropriately
    throw new Error(
      error instanceof Error
        ? `Failed to parse AI response: ${error.message}`
        : "Failed to parse AI response"
    );
  }
}

/**
 * Generate 5 keywords from post content using OpenAI
 * @param postContent - The combined hook + body text from the first variant
 * @returns Array of 5 keywords, or empty array if generation fails
 */
export async function generateKeywords(postContent: string): Promise<string[]> {
  if (!postContent || postContent.trim().length === 0) {
    return [];
  }

  const prompt = `Analyze the following LinkedIn post content and extract exactly 5 relevant keywords that best represent the main topics, themes, and subject matter discussed in the post.

Post content:
${postContent}

Requirements:
- Extract exactly 5 keywords
- Keywords should be relevant to the post's main topics and themes
- Keywords should be single words or short phrases (2-3 words max)
- Keywords should be specific and meaningful (avoid generic words like "the", "and", "is")
- Format as a JSON array of strings: ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]

Return only the JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a keyword extraction expert. Extract exactly 5 relevant keywords from content and return them as a JSON array.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("No content generated for keywords");
      return [];
    }

    // Parse the JSON response
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/```json\s*/, "")
        .replace(/```\s*$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/```\s*/, "")
        .replace(/```\s*$/, "");
    }

    // Extract JSON array
    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in keyword response");
      return [];
    }

    const keywords = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(keywords)) {
      console.error("Keywords response is not an array");
      return [];
    }

    // Validate and clean keywords - ensure we have exactly 5, trim whitespace
    const validKeywords = keywords
      .filter((kw: any) => kw && typeof kw === "string" && kw.trim().length > 0)
      .map((kw: string) => kw.trim())
      .slice(0, 5); // Limit to 5 keywords

    if (validKeywords.length === 0) {
      console.error("No valid keywords extracted");
      return [];
    }

    // If we have less than 5, pad with empty strings or return what we have
    // The plan says 5 keywords, but we'll return what we get if less than 5
    return validKeywords;
  } catch (error) {
    console.error("Error generating keywords:", error);
    return [];
  }
}

// Analytics insights types
export interface TopPostWithKeywords {
  postId: number;
  linkedinPostId: string;
  excerpt: string;
  publishedAt: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  keywords: string[];
  organizationId: string | null;
  organizationName: string | null;
}

export interface AnalyticsInsight {
  title: string;
  content: string; // Markdown
  category: 'topics' | 'engagement' | 'themes' | 'metrics';
  sortCriteria: string;
  priority: number;
}

/**
 * Generate analytics insights from top posts using AI
 * @param posts - Array of top posts with metrics and keywords
 * @param sortCriteria - The sorting criteria used (e.g., "impressions", "likes", etc.)
 * @returns Array of structured insights
 */
export async function generateAnalyticsInsights(
  posts: TopPostWithKeywords[],
  sortCriteria: string
): Promise<AnalyticsInsight[]> {
  if (!posts || posts.length === 0) {
    return [];
  }

  // Build data summary for the prompt
  const postsSummary = posts.map((post, index) => {
    const keywordsStr = post.keywords && post.keywords.length > 0
      ? post.keywords.join(", ")
      : "No keywords";

    return `Post ${index + 1}:
- Excerpt: ${post.excerpt.substring(0, 200)}${post.excerpt.length > 200 ? "..." : ""}
- Metrics: ${post.impressions} impressions, ${post.likes} likes, ${post.comments} comments, ${post.shares} shares
- Engagement Rate: ${(post.engagementRate * 100).toFixed(2)}%
- Keywords: ${keywordsStr}
- Published: ${new Date(post.publishedAt).toLocaleDateString()}`;
  }).join("\n\n");

  const sortCriteriaName = sortCriteria.charAt(0).toUpperCase() + sortCriteria.slice(1);

  const prompt = `You are an expert LinkedIn analytics consultant. Analyze the following top-performing posts (sorted by ${sortCriteria}) and generate actionable insights about what is performing well with the user's audience.

POSTS DATA (sorted by ${sortCriteria}, descending):
${postsSummary}

ANALYSIS REQUIREMENTS:
1. Identify common keywords/topics that appear in top-performing posts
2. Analyze metric patterns (what drives ${sortCriteria} vs other metrics)
3. Identify content themes that resonate with the audience
4. Analyze engagement patterns (likes vs comments vs shares)
5. Look for correlations between keywords and performance metrics

OUTPUT FORMAT:
Generate 2-4 insights as a JSON array. Each insight should have:
- "title": A concise, actionable title (max 60 characters)
- "content": Detailed markdown-formatted content explaining the insight (2-4 sentences)
- "category": One of: "topics", "engagement", "themes", "metrics"
- "sortCriteria": "${sortCriteria}"
- "priority": A number from 1-10 indicating importance (10 = most important)

INSIGHT CATEGORIES:
- "topics": Insights about keywords, topics, or subject matter that perform well
- "engagement": Insights about engagement patterns (likes, comments, shares)
- "themes": Insights about content themes, styles, or approaches that resonate
- "metrics": Insights about metric relationships and performance drivers

Focus on actionable, specific insights that help the user understand what content resonates with their audience. Avoid generic statements.

Return ONLY a valid JSON array, no other text. Example format:
[
  {
    "title": "AI and Technology Topics Drive High Engagement",
    "content": "Posts about **artificial intelligence** and **technology trends** consistently receive 2-3x more comments than average. Your audience is particularly engaged with forward-looking tech content.",
    "category": "topics",
    "sortCriteria": "${sortCriteria}",
    "priority": 9
  },
  {
    "title": "Questions in Hooks Increase Comments by 40%",
    "content": "Posts that start with questions generate significantly more comments. Posts with question-based hooks average **12 comments** vs **7 comments** for statement-based hooks.",
    "category": "engagement",
    "sortCriteria": "${sortCriteria}",
    "priority": 8
  }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert LinkedIn analytics consultant. Analyze post performance data and generate actionable, specific insights. Always return valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("No content generated for analytics insights");
      return [];
    }

    // Parse the JSON response
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/```json\s*/, "")
        .replace(/```\s*$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/```\s*/, "")
        .replace(/```\s*$/, "");
    }

    // Extract JSON array
    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in analytics insights response");
      return [];
    }

    const insights = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(insights)) {
      console.error("Analytics insights response is not an array");
      return [];
    }

    // Validate and clean insights
    const validInsights: AnalyticsInsight[] = insights
      .filter((insight: any) => {
        return (
          insight &&
          typeof insight === "object" &&
          typeof insight.title === "string" &&
          typeof insight.content === "string" &&
          ["topics", "engagement", "themes", "metrics"].includes(insight.category) &&
          typeof insight.sortCriteria === "string" &&
          typeof insight.priority === "number"
        );
      })
      .map((insight: any) => ({
        title: insight.title.trim(),
        content: insight.content.trim(),
        category: insight.category as 'topics' | 'engagement' | 'themes' | 'metrics',
        sortCriteria: insight.sortCriteria,
        priority: Math.max(1, Math.min(10, insight.priority)), // Clamp between 1-10
      }));

    return validInsights;
  } catch (error) {
    console.error("Error generating analytics insights:", error);
    return [];
  }
}

/**
 * Generate a short summary of analytics insights for dashboard display
 * @param insights - Array of analytics insights
 * @returns A concise summary string (2-3 sentences)
 */
export async function summarizeAnalyticsInsights(
  insights: AnalyticsInsight[]
): Promise<string> {
  if (!insights || insights.length === 0) {
    return "No insights available for this period.";
  }

  // Build summary of insights for the prompt
  const insightsSummary = insights
    .slice(0, 8) // Limit to top 8 insights to keep summary focused
    .map((insight, index) => {
      return `${index + 1}. [${insight.category}] ${insight.title}: ${insight.content.substring(0, 150)}${insight.content.length > 150 ? "..." : ""}`;
    })
    .join("\n\n");

  const prompt = `You are summarizing analytics insights for a dashboard widget. Create a positive, encouraging 2-3 sentence summary that highlights key takeaways and what's working well.

INSIGHTS:
${insightsSummary}

REQUIREMENTS:
- Keep it to 2-3 sentences maximum
- Use a positive, professional, and encouraging tone (not overly enthusiastic)
- Highlight what's working well and key patterns
- Frame insights as opportunities and actionable takeaways
- Use clear, straightforward language
- Focus on the most important and useful insights
- Make it informative and easy to scan

Return ONLY the summary text, no additional formatting or explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at summarizing analytics insights into concise, positive, and informative summaries. Highlight what's working well and frame insights in an encouraging but professional way. Always return plain text summaries without markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) {
      // Fallback summary if AI generation fails
      const topInsight = insights[0];
      return topInsight
        ? `${topInsight.title}. ${topInsight.content.substring(0, 100)}${topInsight.content.length > 100 ? "..." : ""}`
        : "Your content is making an impact! Keep creating to see more insights.";
    }

    return summary;
  } catch (error) {
    console.error("Error summarizing analytics insights:", error);
    // Fallback to a simple summary
    const topInsight = insights[0];
    return topInsight
      ? `${topInsight.title}. ${topInsight.content.substring(0, 100)}${topInsight.content.length > 100 ? "..." : ""}`
      : "Review your analytics to discover what content resonates with your audience.";
  }
}

/**
 * Extract voice profile from an array of posts using AI
 * @param posts - Array of post content strings to analyze
 * @returns Voice profile with structured data and description
 */
export async function extractVoiceProfile(
  posts: string[]
): Promise<VoiceProfile> {
  if (!posts || posts.length === 0) {
    throw new Error("At least one post is required to extract voice profile");
  }

  // Require minimum of 2 posts for reliable voice extraction
  if (posts.length < 2) {
    throw new Error("At least 2 posts are required for voice profile extraction");
  }

  const postsText = posts
    .map((post, index) => `Post ${index + 1}:\n${post}`)
    .join("\n\n---\n\n");

  const prompt = `You are an expert writing style analyst. Analyze the following LinkedIn posts and extract the author's unique writing voice and style characteristics.

POSTS TO ANALYZE:
${postsText}

TASK:
Analyze these posts and extract comprehensive voice characteristics. Provide both:
1. Structured voice data (JSON format)
2. A natural language description of the writing voice

STRUCTURED VOICE DATA should include:
- tone: The overall tone (e.g., "Professional", "Conversational", "Authoritative", "Friendly", "Analytical", "Inspirational", "Casual", "Expert")
- sentence_length: "short", "medium", "long", or "mixed"
- vocabulary_complexity: "simple", "moderate", or "complex"
- formality: "casual", "semi-formal", or "formal"
- uses_emojis: boolean (true if emojis are commonly used)
- uses_questions: boolean (true if questions are commonly used)
- uses_statistics: boolean (true if statistics/data are commonly used)
- storytelling_style: Optional - Describe how stories/narratives are used (e.g., "personal anecdotes", "case studies", "data-driven narratives", "none")
- engagement_tactics: Optional array - Common engagement tactics (e.g., "direct questions", "calls to action", "personal stories", "data insights", "thought-provoking statements")
- common_phrases: Optional array - Recurring phrases or patterns in the writing
- writing_patterns: Optional array - Observable patterns (e.g., "starts with hook", "uses numbered lists", "includes personal reflection")

VOICE DESCRIPTION should be a comprehensive 2-3 paragraph natural language description that captures:
- The author's unique writing voice and personality
- How they communicate ideas and engage with readers
- Their distinctive style elements that should be replicated in AI-generated content
- Specific examples from the posts that illustrate their voice

Return ONLY valid JSON in this format:
{
  "voice_data": {
    "tone": "...",
    "sentence_length": "...",
    "vocabulary_complexity": "...",
    "formality": "...",
    "uses_emojis": true/false,
    "uses_questions": true/false,
    "uses_statistics": true/false,
    "storytelling_style": "...",
    "engagement_tactics": ["..."],
    "common_phrases": ["..."],
    "writing_patterns": ["..."]
  },
  "voice_description": "Comprehensive 2-3 paragraph description of the writing voice..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert writing style analyst. Analyze posts and extract comprehensive voice characteristics in both structured and natural language formats. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated for voice profile");
    }

    // Parse the JSON response
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/```json\s*/, "")
        .replace(/```\s*$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/```\s*/, "")
        .replace(/```\s*$/, "");
    }

    // Extract JSON object
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in voice profile response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!parsed.voice_data || !parsed.voice_description) {
      throw new Error("Invalid voice profile structure");
    }

    // Ensure required fields are present
    const voiceData = {
      tone: parsed.voice_data.tone || "Professional",
      sentence_length: parsed.voice_data.sentence_length || "medium",
      vocabulary_complexity: parsed.voice_data.vocabulary_complexity || "moderate",
      formality: parsed.voice_data.formality || "semi-formal",
      uses_emojis: parsed.voice_data.uses_emojis ?? false,
      uses_questions: parsed.voice_data.uses_questions ?? false,
      uses_statistics: parsed.voice_data.uses_statistics ?? false,
      storytelling_style: parsed.voice_data.storytelling_style || undefined,
      engagement_tactics: parsed.voice_data.engagement_tactics || [],
      common_phrases: parsed.voice_data.common_phrases || [],
      writing_patterns: parsed.voice_data.writing_patterns || [],
    };

    return {
      voice_data: voiceData,
      voice_description: parsed.voice_description.trim(),
    };
  } catch (error) {
    console.error("Error extracting voice profile:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to extract voice profile: ${error.message}`
        : "Failed to extract voice profile"
    );
  }
}
