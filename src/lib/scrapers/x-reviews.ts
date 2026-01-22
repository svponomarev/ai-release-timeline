import { prisma } from "@/lib/db";
import { analyzeSentiment } from "./reddit";

interface Tweet {
  author: string;
  content: string;
  sourceUrl: string;
  createdAt: Date;
}

// Nitter instances to try (fallback if one is down)
const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
];

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

// Search X/Twitter via Nitter for release mentions
async function searchXForRelease(
  releaseName: string,
  company: string
): Promise<Tweet[]> {
  const tweets: Tweet[] = [];
  const query = encodeURIComponent(`${releaseName} ${company}`);

  for (const instance of NITTER_INSTANCES) {
    try {
      const searchUrl = `${instance}/search/rss?f=tweets&q=${query}`;
      const response = await fetchWithTimeout(searchUrl);

      if (!response.ok) continue;

      const xml = await response.text();

      // Parse RSS feed from Nitter
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const item of items.slice(0, 10)) {
        const title =
          item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
          item.match(/<title>(.*?)<\/title>/)?.[1] ||
          "";

        const description =
          item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
          item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
          "";

        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

        // Extract author from title (format: "Author: tweet content")
        const authorMatch = title.match(/^([^:]+):/);
        const author = authorMatch ? `@${authorMatch[1].trim()}` : "Unknown";

        const content = description.replace(/<[^>]*>/g, "").trim();

        if (content && content.length > 30 && link) {
          // Convert Nitter URL back to X.com URL
          const xUrl = link.replace(/https:\/\/[^/]+/, "https://x.com");

          tweets.push({
            author,
            content: content.slice(0, 500),
            sourceUrl: xUrl,
            createdAt: pubDate ? new Date(pubDate) : new Date(),
          });
        }
      }

      // If we found tweets, don't try other instances
      if (tweets.length > 0) break;
    } catch (error) {
      console.error(`Error searching ${instance}:`, error);
      continue;
    }
  }

  return tweets;
}

interface ReleaseInput {
  id: string;
  name: string;
  company: string;
}

// Scrape X reviews for a specific set of releases
export async function scrapeXForReleases(
  releases: ReleaseInput[]
): Promise<{
  added: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let added = 0;

  for (const release of releases) {
    try {
      const tweets = await searchXForRelease(release.name, release.company);

      for (const tweet of tweets) {
        // Check if review already exists
        const existing = await prisma.review.findFirst({
          where: {
            releaseId: release.id,
            sourceUrl: tweet.sourceUrl,
          },
        });

        if (!existing) {
          await prisma.review.create({
            data: {
              releaseId: release.id,
              source: "x",
              author: tweet.author,
              content: tweet.content,
              sentiment: analyzeSentiment(tweet.content),
              sourceUrl: tweet.sourceUrl,
            },
          });
          added++;
        }
      }

      // Rate limiting between releases
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      const message = `Error scraping X for ${release.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(message);
      console.error(message);
    }
  }

  return { added, errors };
}

// Main function to scrape X reviews for all releases
export async function scrapeXReviews(): Promise<{
  added: number;
  errors: string[];
}> {
  // Get all releases
  const releases = await prisma.release.findMany({
    select: { id: true, name: true, company: true },
  });

  return scrapeXForReleases(releases);
}
