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

const EPOCH_AI_CSV_URL = "https://epoch.ai/data/notable_ai_models.csv";

const ALLOWED_COMPANIES = [
  "openai", "anthropic", "meta", "google", "google deepmind", "deepmind",
  "mistral", "mistral ai", "anysphere", "xai", "x.ai", "cohere",
  "ai21", "ai21 labs", "zhipu", "zhipu ai", "alibaba", "baidu", "tencent",
];

const RELEVANT_DOMAINS = ["language", "multimodal", "code"];

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else { current += char; }
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
    headers.forEach((header, index) => { record[header] = values[index] || ""; });
    records.push(record);
  }
  return records;
}

function isFromAllowedCompany(org: string): boolean {
  const orgLower = org.toLowerCase();
  return ALLOWED_COMPANIES.some((c) => orgLower.includes(c));
}

function isRelevantDomain(domain: string): boolean {
  const domainLower = domain.toLowerCase();
  return RELEVANT_DOMAINS.some((d) => domainLower.includes(d));
}

function isCodingRelated(task: string, name: string, abstract: string): boolean {
  const text = `${task} ${name} ${abstract}`.toLowerCase();
  const keywords = ["code", "coding", "programming", "software", "codex", "copilot", "coder", "swe-"];
  return keywords.some((kw) => text.includes(kw));
}

function normalizeCompanyName(org: string): string {
  const orgLower = org.toLowerCase();
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
  return org;
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

async function main() {
  console.log("Scraping Epoch AI into Turso...\n");

  const response = await fetch(EPOCH_AI_CSV_URL);
  const csvText = await response.text();
  const records = parseCSV(csvText);

  console.log(`Parsed ${records.length} models from Epoch AI`);

  const relevantModels = records.filter((r) => {
    const org = r["Organization"] || "";
    const domain = r["Domain"] || "";
    return isFromAllowedCompany(org) && isRelevantDomain(domain);
  });

  console.log(`Found ${relevantModels.length} relevant models\n`);

  let added = 0, updated = 0;

  for (const record of relevantModels) {
    const name = record["Model"] || "";
    const organization = record["Organization"] || "";
    const publicationDate = record["Publication date"] || "";
    const domain = record["Domain"] || "";
    const task = record["Task"] || "";
    const parameters = record["Parameters"] || "";
    const link = record["Link"] || "";
    const abstract = record["Abstract"] || "";

    if (!name || !publicationDate) continue;

    const releaseDate = new Date(publicationDate);
    if (isNaN(releaseDate.getTime())) continue;

    const company = normalizeCompanyName(organization);
    const isCoding = isCodingRelated(task, name, abstract);
    const formattedParams = formatParameters(parameters);

    const existing = await prisma.release.findFirst({
      where: { OR: [{ name }, { AND: [{ company }, { releaseDate }] }] },
    });

    if (existing) {
      await prisma.release.update({
        where: { id: existing.id },
        data: { isCodingRelated: isCoding, domain, parameters: formattedParams },
      });
      updated++;
    } else {
      await prisma.release.create({
        data: {
          name,
          company,
          category: "model",
          releaseDate,
          summary: abstract.slice(0, 200) || `${name} by ${company}`,
          features: JSON.stringify([]),
          docsUrl: link || `https://google.com/search?q=${encodeURIComponent(name + " " + company)}`,
          sourceUrl: link || "https://epoch.ai/data/notable-ai-models",
          isCodingRelated: isCoding,
          domain,
          parameters: formattedParams,
        },
      });
      added++;
    }
  }

  console.log(`\nResults: ${added} added, ${updated} updated`);

  const total = await prisma.release.count();
  const coding = await prisma.release.count({ where: { isCodingRelated: true } });
  console.log(`Total releases: ${total}`);
  console.log(`Coding models: ${coding}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
