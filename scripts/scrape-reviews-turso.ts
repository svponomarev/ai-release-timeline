import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

// Force use of Turso
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

// Override the global prisma instance for the scrapers
// @ts-ignore
globalThis.__prisma_turso = prisma;

console.log("=== Running Review Scrapers on Turso ===\n");

// Sentiment analysis
const POSITIVE_KEYWORDS = [
  "amazing", "great", "excellent", "love", "impressive", "fast", "good",
  "better", "best", "fantastic", "awesome", "incredible", "wonderful",
  "useful", "helpful", "game changer", "game-changer",
];

const NEGATIVE_KEYWORDS = [
  "bad", "terrible", "awful", "slow", "broken", "disappointing", "worse",
  "worst", "useless", "poor", "frustrating", "annoying", "bug", "buggy",
  "crash", "fail", "doesn't work", "sucks",
];

function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  const positiveScore = POSITIVE_KEYWORDS.filter((kw) => lowerText.includes(kw)).length;
  const negativeScore = NEGATIVE_KEYWORDS.filter((kw) => lowerText.includes(kw)).length;
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIReleaseTimeline/1.0)" },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// OFFICIAL BLOGS SCRAPER
// ============================================
async function scrapeOfficialBlogs(): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;

  const sources = await prisma.scraperSource.findMany({
    where: {
      enabled: true,
      type: { in: ["rss", "blog"] },
      company: { in: ["Anthropic", "OpenAI", "Google", "Meta", "Mistral AI"] },
    },
  });

  const releases = await prisma.release.findMany({
    select: { id: true, name: true, company: true },
  });

  for (const source of sources) {
    try {
      const response = await fetchWithTimeout(source.url);
      if (!response.ok) continue;

      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const item of items.slice(0, 20)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                      item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                           item.match(/<description>(.*?)<\/description>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";

        if (!title || !link) continue;

        const text = `${title} ${description}`.toLowerCase();
        const content = description.replace(/<[^>]*>/g, "").slice(0, 400);

        for (const release of releases) {
          if (source.company?.toLowerCase() !== release.company.toLowerCase()) continue;

          const nameLower = release.name.toLowerCase();
          const variations = [nameLower, nameLower.replace(/-/g, ""), nameLower.replace(/-/g, " ")];

          if (variations.some((v) => text.includes(v))) {
            const existing = await prisma.review.findFirst({
              where: { releaseId: release.id, sourceUrl: link },
            });

            if (!existing) {
              await prisma.review.create({
                data: {
                  releaseId: release.id,
                  source: "blog",
                  author: `${source.company} (Official)`,
                  content: `[Official Announcement] ${title}\n\n${content}`,
                  sentiment: "positive",
                  sourceUrl: link,
                },
              });
              added++;
              console.log(`  + Official: ${release.name} from ${source.company}`);
            }
          }
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      errors.push(`Error scraping ${source.name}: ${error}`);
    }
  }

  return { added, errors };
}

// ============================================
// INDEPENDENT BLOGS SCRAPER
// ============================================
async function scrapeBlogReviews(): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;

  const sources = await prisma.scraperSource.findMany({
    where: { enabled: true, type: { in: ["rss", "blog"] }, company: "Independent" },
  });

  const releases = await prisma.release.findMany({
    select: { id: true, name: true, company: true },
  });

  for (const source of sources) {
    try {
      const response = await fetchWithTimeout(source.url);
      if (!response.ok) continue;

      const xml = await response.text();

      // Try RSS format
      let items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

      // Try Atom format
      if (items.length === 0) {
        items = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      }

      for (const item of items.slice(0, 20)) {
        // RSS format
        let title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                    item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        let description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                         item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
                         item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] || "";
        let link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        let author = item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] ||
                    item.match(/<author>(.*?)<\/author>/)?.[1] || "";

        // Atom format fallback
        if (!title) title = item.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || "";
        if (!description) {
          description = item.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ||
                       item.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || "";
        }
        if (!link) link = item.match(/<link[^>]*href="([^"]+)"[^>]*>/)?.[1] || "";
        if (!author) author = item.match(/<author>[\s\S]*?<name>(.*?)<\/name>/)?.[1] || "";

        if (!title || !link) continue;

        const text = `${title} ${description}`.toLowerCase();
        const content = description.replace(/<[^>]*>/g, "").slice(0, 500);

        for (const release of releases) {
          const nameLower = release.name.toLowerCase();
          const variations = [nameLower, nameLower.replace(/-/g, ""), nameLower.replace(/-/g, " ")];

          if (variations.some((v) => text.includes(v))) {
            const existing = await prisma.review.findFirst({
              where: { releaseId: release.id, sourceUrl: link },
            });

            if (!existing) {
              await prisma.review.create({
                data: {
                  releaseId: release.id,
                  source: "blog",
                  author: author || source.name,
                  content: content,
                  sentiment: analyzeSentiment(content),
                  sourceUrl: link,
                },
              });
              added++;
              console.log(`  + Blog: ${release.name} from ${source.name}`);
            }
          }
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      errors.push(`Error scraping ${source.name}: ${error}`);
    }
  }

  return { added, errors };
}

// ============================================
// REDDIT SCRAPER
// ============================================
async function scrapeReddit(): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;

  const subreddits = await prisma.scraperSource.findMany({
    where: { enabled: true, type: "reddit" },
  });

  // Only scrape for recent/important releases to avoid rate limits
  const releases = await prisma.release.findMany({
    where: {
      releaseDate: { gte: new Date("2024-01-01") },
    },
    select: { id: true, name: true, company: true },
    take: 20,
    orderBy: { releaseDate: "desc" },
  });

  console.log(`  Searching ${subreddits.length} subreddits for ${releases.length} recent releases...`);

  for (const release of releases.slice(0, 5)) { // Limit to avoid rate limits
    for (const subreddit of subreddits.slice(0, 2)) { // Limit subreddits too
      try {
        const query = encodeURIComponent(`"${release.name}" ${release.company}`);
        const searchUrl = `${subreddit.url}/search.json?q=${query}&restrict_sr=on&sort=relevance&limit=5`;

        const response = await fetchWithTimeout(searchUrl);
        if (!response.ok) continue;

        const data = await response.json();

        if (data?.data?.children) {
          for (const post of data.data.children) {
            const postData = post.data;
            const content = postData.selftext || postData.title;

            if (content && content.length > 50) {
              const sourceUrl = `https://reddit.com${postData.permalink}`;

              const existing = await prisma.review.findFirst({
                where: { releaseId: release.id, sourceUrl },
              });

              if (!existing) {
                await prisma.review.create({
                  data: {
                    releaseId: release.id,
                    source: "reddit",
                    author: `u/${postData.author}`,
                    content: content.slice(0, 500),
                    sentiment: analyzeSentiment(content),
                    sourceUrl,
                  },
                });
                added++;
                console.log(`  + Reddit: ${release.name} from ${subreddit.name}`);
              }
            }
          }
        }

        await new Promise((r) => setTimeout(r, 2000)); // Reddit rate limit
      } catch (error) {
        errors.push(`Error scraping ${subreddit.name} for ${release.name}: ${error}`);
      }
    }
  }

  return { added, errors };
}

// ============================================
// MAIN
// ============================================
async function main() {
  const reviewsBefore = await prisma.review.count();
  console.log(`Reviews before: ${reviewsBefore}\n`);

  console.log("1. Scraping Official Blogs...");
  const officialResult = await scrapeOfficialBlogs();
  console.log(`   Added: ${officialResult.added}\n`);

  console.log("2. Scraping Independent Blogs...");
  const blogResult = await scrapeBlogReviews();
  console.log(`   Added: ${blogResult.added}\n`);

  console.log("3. Scraping Reddit (limited to avoid rate limits)...");
  const redditResult = await scrapeReddit();
  console.log(`   Added: ${redditResult.added}\n`);

  const reviewsAfter = await prisma.review.count();
  console.log("=== Results ===");
  console.log(`Reviews before: ${reviewsBefore}`);
  console.log(`Reviews after: ${reviewsAfter}`);
  console.log(`Total added: ${reviewsAfter - reviewsBefore}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
