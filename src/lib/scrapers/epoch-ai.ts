import { prisma } from "@/lib/db";

const EPOCH_AI_CSV_URL = "https://epoch.ai/data/notable_ai_models.csv";

// Companies we want to track (major AI labs)
const ALLOWED_COMPANIES = [
  "openai",
  "anthropic",
  "meta",
  "google",
  "google deepmind",
  "deepmind",
  "mistral",
  "mistral ai",
  "anysphere",
  "xai",
  "x.ai",
  "cohere",
  "ai21",
  "ai21 labs",
  "zhipu",
  "zhipu ai",
  "alibaba",
  "baidu",
  "tencent",
];

// Domains we care about (primarily language models)
const RELEVANT_DOMAINS = ["language", "multimodal", "code"];

interface EpochModel {
  name: string;
  organization: string;
  publicationDate: string;
  domain: string;
  task: string;
  parameters: string;
  link: string;
  abstract: string;
  notabilityCriteria: string;
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });

    records.push(record);
  }

  return records;
}

function isFromAllowedCompany(organization: string): boolean {
  const orgLower = organization.toLowerCase();
  return ALLOWED_COMPANIES.some((company) => orgLower.includes(company));
}

function isRelevantDomain(domain: string): boolean {
  const domainLower = domain.toLowerCase();
  return RELEVANT_DOMAINS.some((d) => domainLower.includes(d));
}

function isCodingRelated(task: string, name: string, abstract: string): boolean {
  const text = `${task} ${name} ${abstract}`.toLowerCase();
  const codingKeywords = [
    "code",
    "coding",
    "programming",
    "software",
    "developer",
    "codex",
    "copilot",
    "coder",
    "swe-",
    "agentic coding",
  ];
  return codingKeywords.some((kw) => text.includes(kw));
}

function normalizeCompanyName(organization: string): string {
  const orgLower = organization.toLowerCase();

  if (orgLower.includes("openai")) return "OpenAI";
  if (orgLower.includes("anthropic")) return "Anthropic";
  if (orgLower.includes("google") || orgLower.includes("deepmind")) return "Google";
  if (orgLower.includes("meta")) return "Meta";
  if (orgLower.includes("mistral")) return "Mistral AI";
  if (orgLower.includes("xai") || orgLower.includes("x.ai")) return "xAI";
  if (orgLower.includes("cohere")) return "Cohere";
  if (orgLower.includes("ai21")) return "AI21 Labs";
  if (orgLower.includes("anysphere")) return "Anysphere";
  if (orgLower.includes("zhipu")) return "Zhipu AI";
  if (orgLower.includes("alibaba")) return "Alibaba";
  if (orgLower.includes("baidu")) return "Baidu";
  if (orgLower.includes("tencent")) return "Tencent";

  return organization;
}

function categorizeRelease(domain: string, task: string, name: string): "model" | "tool" {
  const text = `${domain} ${task} ${name}`.toLowerCase();
  const toolKeywords = ["tool", "assistant", "agent", "ide", "editor", "code"];

  // If it's primarily a tool/product (not a base model)
  if (toolKeywords.some((kw) => text.includes(kw)) && !text.includes("model")) {
    return "tool";
  }

  return "model";
}

function formatParameters(params: string): string | null {
  if (!params || params === "nan" || params === "") return null;

  const num = parseFloat(params);
  if (isNaN(num)) return params;

  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;

  return params;
}

export async function scrapeEpochAI(): Promise<{
  added: number;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let added = 0;
  let updated = 0;

  try {
    console.log("Fetching Epoch AI notable models CSV...");
    const response = await fetch(EPOCH_AI_CSV_URL, {
      headers: {
        "User-Agent": "AIReleaseTimeline/1.0 (https://ai-release-timeline.vercel.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const records = parseCSV(csvText);

    console.log(`Parsed ${records.length} models from Epoch AI`);

    // Filter and process models
    const relevantModels = records.filter((record) => {
      const organization = record["Organization"] || "";
      const domain = record["Domain"] || "";

      return isFromAllowedCompany(organization) && isRelevantDomain(domain);
    });

    console.log(`Found ${relevantModels.length} relevant models from major AI companies`);

    for (const record of relevantModels) {
      try {
        const name = record["Model"] || "";
        const organization = record["Organization"] || "";
        const publicationDate = record["Publication date"] || "";
        const domain = record["Domain"] || "";
        const task = record["Task"] || "";
        const parameters = record["Parameters"] || "";
        const link = record["Link"] || "";
        const abstract = record["Abstract"] || "";

        if (!name || !publicationDate) {
          continue;
        }

        const releaseDate = new Date(publicationDate);
        if (isNaN(releaseDate.getTime())) {
          continue;
        }

        const company = normalizeCompanyName(organization);
        const isCoding = isCodingRelated(task, name, abstract);
        const category = categorizeRelease(domain, task, name);
        const formattedParams = formatParameters(parameters);

        // Check if release already exists
        const existing = await prisma.release.findFirst({
          where: {
            OR: [
              { name: name },
              {
                AND: [
                  { company: company },
                  { releaseDate: releaseDate },
                ],
              },
            ],
          },
        });

        if (existing) {
          // Update existing release with new fields
          await prisma.release.update({
            where: { id: existing.id },
            data: {
              isCodingRelated: isCoding,
              domain: domain,
              parameters: formattedParams,
            },
          });
          updated++;
        } else {
          // Create new release
          await prisma.release.create({
            data: {
              name: name,
              company: company,
              category: category,
              releaseDate: releaseDate,
              summary: abstract.slice(0, 200) || `${name} by ${company}`,
              features: JSON.stringify([]),
              docsUrl: link || `https://google.com/search?q=${encodeURIComponent(name + " " + company)}`,
              sourceUrl: link || "https://epoch.ai/data/notable-ai-models",
              isCodingRelated: isCoding,
              domain: domain,
              parameters: formattedParams,
            },
          });
          added++;
        }
      } catch (recordError) {
        const message = `Error processing model ${record["Model"]}: ${recordError instanceof Error ? recordError.message : "Unknown error"}`;
        errors.push(message);
        console.error(message);
      }
    }

    console.log(`Epoch AI scrape complete: ${added} added, ${updated} updated`);
  } catch (error) {
    const message = `Error scraping Epoch AI: ${error instanceof Error ? error.message : "Unknown error"}`;
    errors.push(message);
    console.error(message);
  }

  return { added, updated, errors };
}

// Get coding-related releases only
export async function getCodingReleases() {
  return prisma.release.findMany({
    where: {
      isCodingRelated: true,
    },
    orderBy: {
      releaseDate: "desc",
    },
    include: {
      reviews: true,
    },
  });
}
