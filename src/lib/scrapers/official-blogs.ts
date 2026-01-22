import { prisma } from "@/lib/db";

interface ParsedRelease {
  name: string;
  company: string;
  category: "model" | "tool";
  releaseDate: Date;
  summary: string;
  features: string[];
  pricing?: string;
  docsUrl: string;
  sourceUrl: string;
}

// Keywords that indicate a release announcement
const RELEASE_KEYWORDS = [
  "introducing",
  "announcing",
  "launch",
  "release",
  "new model",
  "available now",
  "general availability",
];

// Allowed companies for major AI releases
const ALLOWED_COMPANIES = [
  "openai",
  "anthropic",
  "meta",
  "google",
  "mistral",
  "anysphere",
];

// Coding tools we want to track (only from major AI companies)
const CODING_TOOL_KEYWORDS = [
  "claude code",
  "codex",
  "copilot",
  "code interpreter",
  "coding assistant",
];

// Keywords to determine category
const MODEL_KEYWORDS = [
  "model",
  "llm",
  "gpt",
  "claude",
  "gemini",
  "llama",
  "language model",
];

const TOOL_KEYWORDS = ["api", "sdk", "tool", "playground", "assistant", "code"];

function categorizeRelease(title: string, content: string): "model" | "tool" {
  const text = `${title} ${content}`.toLowerCase();

  const modelScore = MODEL_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const toolScore = TOOL_KEYWORDS.filter((kw) => text.includes(kw)).length;

  return modelScore >= toolScore ? "model" : "tool";
}

function isCodingTool(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return CODING_TOOL_KEYWORDS.some((kw) => text.includes(kw));
}

function isFromAllowedCompany(company: string): boolean {
  return ALLOWED_COMPANIES.some((allowed) =>
    company.toLowerCase().includes(allowed)
  );
}

function isReleaseAnnouncement(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return RELEASE_KEYWORDS.some((kw) => text.includes(kw));
}

function isMajorRelease(
  title: string,
  content: string,
  company: string
): boolean {
  // Must have release keywords
  if (!isReleaseAnnouncement(title, content)) {
    return false;
  }

  // Must be from an allowed major company
  if (!isFromAllowedCompany(company)) {
    return false;
  }

  return true;
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

// Parse RSS feed and extract potential releases
async function parseRSSFeed(
  rssUrl: string,
  company: string
): Promise<ParsedRelease[]> {
  try {
    const response = await fetchWithTimeout(rssUrl);
    if (!response.ok) return [];

    const xml = await response.text();
    const releases: ParsedRelease[] = [];

    // Simple RSS parsing (for production, use a proper RSS parser library)
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 10)) {
      // Process last 10 items
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

      if (title && isMajorRelease(title, description, company)) {
        const category = isCodingTool(title, description)
          ? "tool"
          : categorizeRelease(title, description);

        releases.push({
          name: title,
          company: company,
          category,
          releaseDate: pubDate ? new Date(pubDate) : new Date(),
          summary: description.slice(0, 200).replace(/<[^>]*>/g, "") + "...",
          features: [], // Would need additional parsing
          docsUrl: link,
          sourceUrl: link,
        });
      }
    }

    return releases;
  } catch (error) {
    console.error(`Error parsing RSS from ${rssUrl}:`, error);
    return [];
  }
}

// Main function to scrape all official blogs
export async function scrapeOfficialBlogs(): Promise<{
  added: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let added = 0;

  // Get enabled RSS/blog sources from database
  const sources = await prisma.scraperSource.findMany({
    where: {
      enabled: true,
      type: { in: ["rss", "blog"] },
    },
  });

  if (sources.length === 0) {
    return { added: 0, errors: ["No RSS/blog sources configured"] };
  }

  for (const source of sources) {
    try {
      const releases = await parseRSSFeed(source.url, source.company || source.name);

      for (const release of releases) {
        // Check if already exists
        const existing = await prisma.release.findFirst({
          where: {
            OR: [
              { sourceUrl: release.sourceUrl },
              {
                AND: [{ name: release.name }, { company: release.company }],
              },
            ],
          },
        });

        if (!existing) {
          await prisma.release.create({
            data: {
              name: release.name,
              company: release.company,
              category: release.category,
              releaseDate: release.releaseDate,
              summary: release.summary,
              features: JSON.stringify(release.features),
              pricing: release.pricing,
              docsUrl: release.docsUrl,
              sourceUrl: release.sourceUrl,
            },
          });
          added++;
        }
      }
    } catch (error) {
      const message = `Error scraping ${source.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(message);
      console.error(message);
    }
  }

  return { added, errors };
}
