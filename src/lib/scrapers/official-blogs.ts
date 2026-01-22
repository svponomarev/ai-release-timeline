import { prisma } from "@/lib/db";
import { analyzeSentiment } from "./reddit";

/**
 * Official Blogs Scraper - Reviews Only
 *
 * This scraper fetches posts from official company blogs (Anthropic, OpenAI, Google, Meta)
 * and links them as "official" reviews to existing releases in the database.
 *
 * It does NOT create new releases - that's handled by the Epoch AI scraper.
 */

interface BlogPost {
  title: string;
  content: string;
  link: string;
  pubDate: Date;
  company: string;
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

// Parse RSS feed and extract blog posts
async function parseRSSFeed(
  rssUrl: string,
  company: string
): Promise<BlogPost[]> {
  try {
    const response = await fetchWithTimeout(rssUrl);
    if (!response.ok) return [];

    const xml = await response.text();
    const posts: BlogPost[] = [];

    // Simple RSS parsing
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 20)) {
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] ||
        "";

      const description =
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>(.*?)<\/description>/)?.[1] ||
        "";

      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      if (title && link) {
        posts.push({
          title,
          content: description.replace(/<[^>]*>/g, "").slice(0, 1000),
          link,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
          company,
        });
      }
    }

    return posts;
  } catch (error) {
    console.error(`Error parsing RSS from ${rssUrl}:`, error);
    return [];
  }
}

// Check if a blog post mentions a release
function postMentionsRelease(
  post: BlogPost,
  releaseName: string,
  releaseCompany: string
): boolean {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const releaseNameLower = releaseName.toLowerCase();

  // Must be from the same company
  if (post.company.toLowerCase() !== releaseCompany.toLowerCase()) {
    return false;
  }

  // Check for release name mention
  if (text.includes(releaseNameLower)) {
    return true;
  }

  // Check for variations (e.g., "GPT-4" vs "GPT4" vs "GPT 4")
  const nameVariations = [
    releaseNameLower,
    releaseNameLower.replace(/-/g, ""),
    releaseNameLower.replace(/-/g, " "),
    releaseNameLower.replace(/\s+/g, "-"),
  ];

  for (const variation of nameVariations) {
    if (text.includes(variation)) {
      return true;
    }
  }

  return false;
}

// Main function to scrape official blogs for reviews
export async function scrapeOfficialBlogs(): Promise<{
  added: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let added = 0;

  // Get enabled RSS/blog sources from major AI companies (not independent blogs)
  const sources = await prisma.scraperSource.findMany({
    where: {
      enabled: true,
      type: { in: ["rss", "blog"] },
      company: {
        in: ["Anthropic", "OpenAI", "Google", "Meta", "Mistral AI"],
      },
    },
  });

  if (sources.length === 0) {
    return { added: 0, errors: ["No official blog sources configured"] };
  }

  // Get all releases to match against
  const releases = await prisma.release.findMany({
    select: { id: true, name: true, company: true },
  });

  if (releases.length === 0) {
    return { added: 0, errors: ["No releases in database to match"] };
  }

  for (const source of sources) {
    try {
      const posts = await parseRSSFeed(source.url, source.company || source.name);
      console.log(`Fetched ${posts.length} posts from ${source.name}`);

      for (const post of posts) {
        // Check each release to see if this post mentions it
        for (const release of releases) {
          if (postMentionsRelease(post, release.name, release.company)) {
            // Check if review already exists
            const existing = await prisma.review.findFirst({
              where: {
                releaseId: release.id,
                sourceUrl: post.link,
              },
            });

            if (!existing) {
              const reviewContent = `[Official Announcement] ${post.title}\n\n${post.content.slice(0, 400)}`;

              await prisma.review.create({
                data: {
                  releaseId: release.id,
                  source: "blog",
                  author: `${post.company} (Official)`,
                  content: reviewContent,
                  sentiment: "positive", // Official announcements are always positive
                  sourceUrl: post.link,
                },
              });
              added++;
              console.log(`Added official review for ${release.name} from ${post.company}`);
            }
          }
        }
      }

      // Rate limiting between sources
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      const message = `Error scraping ${source.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(message);
      console.error(message);
    }
  }

  return { added, errors };
}
