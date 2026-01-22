interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
}

interface ParsedFeed {
  title: string;
  items: RSSItem[];
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

// Simple RSS parser (for production, use a proper RSS parser like rss-parser)
export async function parseRSSFeed(url: string): Promise<ParsedFeed | null> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const xml = await response.text();

    // Extract feed title
    const feedTitle =
      xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      xml.match(/<title>(.*?)<\/title>/)?.[1] ||
      "Unknown Feed";

    // Extract items
    const items: RSSItem[] = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of itemMatches) {
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

      if (title) {
        items.push({
          title: decodeHTMLEntities(title),
          description: decodeHTMLEntities(
            description.replace(/<[^>]*>/g, "").slice(0, 500)
          ),
          link,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
        });
      }
    }

    return { title: feedTitle, items };
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return null;
  }
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

// List of useful RSS feeds for AI news
export const AI_RSS_FEEDS = [
  {
    url: "https://www.anthropic.com/rss.xml",
    name: "Anthropic",
    company: "Anthropic",
  },
  {
    url: "https://arxiv.org/rss/cs.AI",
    name: "arXiv AI",
    company: "Various",
  },
];
