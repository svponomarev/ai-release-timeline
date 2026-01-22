import { prisma } from "@/lib/db";

interface RedditComment {
  author: string;
  content: string;
  sourceUrl: string;
  createdAt: Date;
}

// Keywords for sentiment analysis (simple keyword-based approach)
const POSITIVE_KEYWORDS = [
  "amazing",
  "great",
  "excellent",
  "love",
  "impressive",
  "fast",
  "good",
  "better",
  "best",
  "fantastic",
  "awesome",
  "incredible",
  "wonderful",
  "useful",
  "helpful",
  "game changer",
  "game-changer",
];

const NEGATIVE_KEYWORDS = [
  "bad",
  "terrible",
  "awful",
  "slow",
  "broken",
  "disappointing",
  "worse",
  "worst",
  "useless",
  "poor",
  "frustrating",
  "annoying",
  "bug",
  "buggy",
  "crash",
  "fail",
  "doesn't work",
  "sucks",
];

export function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();

  const positiveScore = POSITIVE_KEYWORDS.filter((kw) =>
    lowerText.includes(kw)
  ).length;
  const negativeScore = NEGATIVE_KEYWORDS.filter((kw) =>
    lowerText.includes(kw)
  ).length;

  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

async function fetchWithTimeout(
  url: string,
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AIReleaseTimeline/1.0; +https://ai-release-timeline.vercel.app)",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Search a specific subreddit for discussions about a release
async function searchSubredditForRelease(
  subredditUrl: string,
  releaseName: string,
  company: string
): Promise<RedditComment[]> {
  const comments: RedditComment[] = [];

  // Search query combining release name and company
  const query = encodeURIComponent(`"${releaseName}" ${company}`);

  try {
    // Use Reddit's search JSON endpoint
    const searchUrl = `${subredditUrl}/search.json?q=${query}&restrict_sr=on&sort=relevance&limit=10`;

    const response = await fetchWithTimeout(searchUrl);
    if (!response.ok) return [];

    const data = await response.json();

    if (data?.data?.children) {
      for (const post of data.data.children) {
        const postData = post.data;

        // Add post title/selftext as a review
        const content = postData.selftext || postData.title;
        if (content && content.length > 50) {
          comments.push({
            author: `u/${postData.author}`,
            content: content.slice(0, 500),
            sourceUrl: `https://reddit.com${postData.permalink}`,
            createdAt: new Date(postData.created_utc * 1000),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error searching subreddit for ${releaseName}:`, error);
  }

  return comments;
}

interface ReleaseInput {
  id: string;
  name: string;
  company: string;
}

// Scrape Reddit reviews for a specific set of releases (for batched processing)
export async function scrapeRedditForReleases(
  releases: ReleaseInput[]
): Promise<{
  added: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let added = 0;

  // Get enabled Reddit sources from database
  const subreddits = await prisma.scraperSource.findMany({
    where: {
      enabled: true,
      type: "reddit",
    },
  });

  if (subreddits.length === 0) {
    return { added: 0, errors: ["No Reddit sources configured"] };
  }

  for (const release of releases) {
    for (const subreddit of subreddits) {
      try {
        const comments = await searchSubredditForRelease(
          subreddit.url,
          release.name,
          release.company
        );

        for (const comment of comments) {
          // Check if review already exists
          const existing = await prisma.review.findFirst({
            where: {
              releaseId: release.id,
              sourceUrl: comment.sourceUrl,
            },
          });

          if (!existing) {
            await prisma.review.create({
              data: {
                releaseId: release.id,
                source: "reddit",
                author: comment.author,
                content: comment.content,
                sentiment: analyzeSentiment(comment.content),
                sourceUrl: comment.sourceUrl,
              },
            });
            added++;
          }
        }

        // Rate limiting: wait between subreddits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        const message = `Error scraping ${subreddit.name} for ${release.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(message);
        console.error(message);
      }
    }

    // Rate limiting: wait between releases
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { added, errors };
}

// Main function to scrape Reddit reviews for all releases
export async function scrapeRedditReviews(): Promise<{
  added: number;
  errors: string[];
}> {
  // Get all releases that we want to find reviews for
  const releases = await prisma.release.findMany({
    select: { id: true, name: true, company: true },
  });

  return scrapeRedditForReleases(releases);
}
