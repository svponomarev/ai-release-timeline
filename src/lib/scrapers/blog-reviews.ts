import { prisma } from "@/lib/db";
import { analyzeSentiment } from "./reddit";

interface BlogPost {
  title: string;
  content: string;
  link: string;
  pubDate: Date;
  author: string;
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

// Parse RSS/Atom feed and extract blog posts
async function parseFeed(feedUrl: string): Promise<BlogPost[]> {
  try {
    const response = await fetchWithTimeout(feedUrl);
    if (!response.ok) return [];

    const xml = await response.text();
    const posts: BlogPost[] = [];

    // Try RSS format first
    const rssItems = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const item of rssItems.slice(0, 20)) {
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] ||
        "";

      const description =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
        item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] ||
        "";

      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const author =
        item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] ||
        item.match(/<author>(.*?)<\/author>/)?.[1] ||
        "";

      if (title && link) {
        posts.push({
          title,
          content: description.replace(/<[^>]*>/g, "").slice(0, 2000),
          link,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
          author,
        });
      }
    }

    // Try Atom format if no RSS items found
    if (posts.length === 0) {
      const atomEntries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      for (const entry of atomEntries.slice(0, 20)) {
        const title =
          entry.match(/<title[^>]*>(.*?)<\/title>/)?.[1] ||
          "";

        const content =
          entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ||
          entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ||
          "";

        const link =
          entry.match(/<link[^>]*href="([^"]+)"[^>]*>/)?.[1] ||
          "";

        const pubDate =
          entry.match(/<published>(.*?)<\/published>/)?.[1] ||
          entry.match(/<updated>(.*?)<\/updated>/)?.[1] ||
          "";

        const author =
          entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>/)?.[1] ||
          "";

        if (title && link) {
          posts.push({
            title,
            content: content.replace(/<[^>]*>/g, "").slice(0, 2000),
            link,
            pubDate: pubDate ? new Date(pubDate) : new Date(),
            author,
          });
        }
      }
    }

    return posts;
  } catch (error) {
    console.error(`Error parsing feed ${feedUrl}:`, error);
    return [];
  }
}

// Check if a blog post mentions a release
function postMentionsRelease(
  post: BlogPost,
  releaseName: string,
  company: string
): boolean {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const releaseNameLower = releaseName.toLowerCase();
  const companyLower = company.toLowerCase();

  // Check for release name mention
  if (text.includes(releaseNameLower)) {
    return true;
  }

  // Check for variations (e.g., "GPT-4" vs "GPT4" vs "GPT 4")
  const nameVariations = [
    releaseNameLower,
    releaseNameLower.replace(/-/g, ""),
    releaseNameLower.replace(/-/g, " "),
  ];

  for (const variation of nameVariations) {
    if (text.includes(variation)) {
      return true;
    }
  }

  return false;
}

// Scrape blog reviews for existing releases
export async function scrapeBlogReviews(): Promise<{
  added: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let added = 0;

  // Get independent blog sources (not from major companies)
  const blogSources = await prisma.scraperSource.findMany({
    where: {
      enabled: true,
      type: { in: ["rss", "blog"] },
      company: "Independent",
    },
  });

  if (blogSources.length === 0) {
    return { added: 0, errors: ["No independent blog sources configured"] };
  }

  // Get all releases to search for
  const releases = await prisma.release.findMany({
    select: { id: true, name: true, company: true },
  });

  for (const source of blogSources) {
    try {
      const posts = await parseFeed(source.url);

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
              const reviewContent = post.content.slice(0, 500);
              await prisma.review.create({
                data: {
                  releaseId: release.id,
                  source: "blog",
                  author: post.author || source.name,
                  content: reviewContent,
                  sentiment: analyzeSentiment(reviewContent),
                  sourceUrl: post.link,
                },
              });
              added++;
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
