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

const adapter = new PrismaLibSql({
  url,
  authToken,
});

const prisma = new PrismaClient({ adapter });

console.log("Seeding Turso database...");
console.log(`URL: ${url.replace(/\/\/.*@/, "//***@")}\n`);

async function main() {
  // ===========================================
  // SCRAPER SOURCES
  // ===========================================

  await prisma.scraperSource.createMany({
    data: [
      // Epoch AI - Primary source for curated AI model releases
      {
        type: "csv",
        name: "Epoch AI Notable Models",
        url: "https://epoch.ai/data/notable_ai_models.csv",
        company: "Epoch AI",
        enabled: true,
      },
      // Reddit sources
      {
        type: "reddit",
        name: "r/LocalLLaMA",
        url: "https://old.reddit.com/r/LocalLLaMA",
        enabled: true,
      },
      {
        type: "reddit",
        name: "r/ChatGPT",
        url: "https://old.reddit.com/r/ChatGPT",
        enabled: true,
      },
      {
        type: "reddit",
        name: "r/MachineLearning",
        url: "https://old.reddit.com/r/MachineLearning",
        enabled: true,
      },
      {
        type: "reddit",
        name: "r/ClaudeAI",
        url: "https://old.reddit.com/r/ClaudeAI",
        enabled: true,
      },
      {
        type: "reddit",
        name: "r/OpenAI",
        url: "https://old.reddit.com/r/OpenAI",
        enabled: true,
      },
      // RSS/Blog sources (for reviews)
      {
        type: "rss",
        name: "Anthropic Blog",
        url: "https://www.anthropic.com/rss.xml",
        company: "Anthropic",
        enabled: true,
      },
      {
        type: "rss",
        name: "OpenAI Blog",
        url: "https://openai.com/blog/rss.xml",
        company: "OpenAI",
        enabled: true,
      },
      {
        type: "rss",
        name: "Google AI Blog",
        url: "https://blog.google/technology/ai/rss/",
        company: "Google",
        enabled: true,
      },
      {
        type: "rss",
        name: "Meta AI Blog",
        url: "https://ai.meta.com/blog/rss/",
        company: "Meta",
        enabled: true,
      },
      // Independent expert blogs (for reviews)
      {
        type: "rss",
        name: "Simon Willison's Weblog",
        url: "https://simonwillison.net/atom/everything/",
        company: "Independent",
        enabled: true,
      },
      {
        type: "rss",
        name: "Lilian Weng (OpenAI)",
        url: "https://lilianweng.github.io/index.xml",
        company: "Independent",
        enabled: true,
      },
      {
        type: "rss",
        name: "Chip Huyen",
        url: "https://huyenchip.com/feed.xml",
        company: "Independent",
        enabled: true,
      },
      {
        type: "rss",
        name: "Sebastian Raschka",
        url: "https://magazine.sebastianraschka.com/feed",
        company: "Independent",
        enabled: true,
      },
    ],
  });

  console.log("Created scraper sources");

  // ===========================================
  // KEY RELEASES (curated seed data)
  // ===========================================

  // 2023 Releases
  await prisma.release.create({
    data: {
      name: "GPT-4",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2023-03-14"),
      summary: "OpenAI's most capable model with improved reasoning and broader knowledge",
      features: JSON.stringify([
        "Multimodal capabilities (text and image input)",
        "Improved reasoning and accuracy",
        "Longer context window (8K and 32K versions)",
      ]),
      pricing: "Input: $30/1M tokens, Output: $60/1M tokens (8K)",
      docsUrl: "https://platform.openai.com/docs/models/gpt-4",
      sourceUrl: "https://openai.com/research/gpt-4",
      isCodingRelated: true,
      domain: "Language",
      parameters: "1.76T",
    },
  });

  await prisma.release.create({
    data: {
      name: "Claude 2",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2023-07-11"),
      summary: "Major upgrade with 100K context window and improved coding abilities",
      features: JSON.stringify([
        "100K token context window",
        "Improved coding and math abilities",
        "Constitutional AI safety training",
      ]),
      pricing: "Input: $8/1M tokens, Output: $24/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs",
      sourceUrl: "https://www.anthropic.com/news/claude-2",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  await prisma.release.create({
    data: {
      name: "Code Llama",
      company: "Meta",
      category: "model",
      releaseDate: new Date("2023-08-24"),
      summary: "Llama 2 fine-tuned for code generation with 100K context for code",
      features: JSON.stringify([
        "Specialized for code generation",
        "7B, 13B, 34B parameter versions",
        "100K context window for code",
      ]),
      pricing: "Free and open source",
      docsUrl: "https://llama.meta.com/docs/",
      sourceUrl: "https://ai.meta.com/blog/code-llama-large-language-model-coding/",
      isCodingRelated: true,
      domain: "Language",
      parameters: "34B",
    },
  });

  // 2024 Releases
  await prisma.release.create({
    data: {
      name: "Claude 3 (Opus, Sonnet, Haiku)",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2024-03-04"),
      summary: "Model family with Opus outperforming GPT-4 on most benchmarks",
      features: JSON.stringify([
        "Three tiers: Opus, Sonnet, Haiku",
        "200K context window",
        "Vision capabilities",
      ]),
      pricing: "Opus: $15/$75, Sonnet: $3/$15, Haiku: $0.25/$1.25 per 1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-3-family",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  await prisma.release.create({
    data: {
      name: "Cursor",
      company: "Anysphere",
      category: "tool",
      releaseDate: new Date("2024-03-01"),
      summary: "AI-first code editor built on VSCode with deep AI integration",
      features: JSON.stringify([
        "AI-powered code completion",
        "Chat with your codebase",
        "Cmd-K for inline editing",
      ]),
      pricing: "$20/month Pro, Free tier available",
      docsUrl: "https://cursor.sh/docs",
      sourceUrl: "https://cursor.sh/",
      isCodingRelated: true,
      domain: "Tool",
    },
  });

  await prisma.release.create({
    data: {
      name: "GPT-4o",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2024-05-13"),
      summary: "Omni model with native multimodal capabilities",
      features: JSON.stringify([
        "Native multimodal: text, image, and audio",
        "2x faster than GPT-4 Turbo",
        "50% cheaper API pricing",
      ]),
      pricing: "Input: $5/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-4o",
      sourceUrl: "https://openai.com/index/hello-gpt-4o/",
      isCodingRelated: true,
      domain: "Multimodal",
    },
  });

  await prisma.release.create({
    data: {
      name: "Claude 3.5 Sonnet",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2024-06-20"),
      summary: "Most intelligent Claude model, outperforming GPT-4o on many benchmarks",
      features: JSON.stringify([
        "Outperforms GPT-4o on graduate-level reasoning",
        "Strong coding abilities (64.2% on HumanEval)",
        "2x faster than Claude 3 Opus",
      ]),
      pricing: "Input: $3/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-3-5-sonnet",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  await prisma.release.create({
    data: {
      name: "o1 (Strawberry)",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2024-09-12"),
      summary: "Reasoning model that thinks before answering, excels at math and coding",
      features: JSON.stringify([
        "Chain-of-thought reasoning built-in",
        "Excels at math, science, and coding",
        "Thinks for seconds to minutes before responding",
      ]),
      pricing: "o1-preview: $15/$60, o1-mini: $3/$12 per 1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/o1",
      sourceUrl: "https://openai.com/index/introducing-openai-o1-preview/",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  // 2025 Releases
  await prisma.release.create({
    data: {
      name: "Claude Code",
      company: "Anthropic",
      category: "tool",
      releaseDate: new Date("2025-02-24"),
      summary: "Agentic coding tool that lives in your terminal",
      features: JSON.stringify([
        "Terminal-native AI coding assistant",
        "Understands entire codebases",
        "Can edit files, run commands, and create PRs",
      ]),
      pricing: "Usage-based via Claude API",
      docsUrl: "https://docs.anthropic.com/claude-code",
      sourceUrl: "https://www.anthropic.com/news/claude-code",
      isCodingRelated: true,
      domain: "Tool",
    },
  });

  await prisma.release.create({
    data: {
      name: "Claude Sonnet 4",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-05-22"),
      summary: "Next generation Sonnet with improved reasoning and coding",
      features: JSON.stringify([
        "Significant improvements over Claude 3.5 Sonnet",
        "Enhanced reasoning capabilities",
        "Better code generation",
      ]),
      pricing: "Input: $3/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-4",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  await prisma.release.create({
    data: {
      name: "Claude Opus 4",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-05-22"),
      summary: "Most capable Claude model, new frontier in AI reasoning",
      features: JSON.stringify([
        "State-of-the-art performance",
        "Extended thinking capabilities",
        "Superior coding and analysis",
      ]),
      pricing: "Input: $15/1M tokens, Output: $75/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-4",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  await prisma.release.create({
    data: {
      name: "Claude Opus 4.5",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-11-24"),
      summary: "Most capable Claude model with breakthrough reasoning",
      features: JSON.stringify([
        "State-of-the-art across all benchmarks",
        "Extended thinking for complex problems",
        "Best-in-class coding abilities",
      ]),
      pricing: "Input: $15/1M tokens, Output: $75/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-opus-4-5",
      isCodingRelated: true,
      domain: "Language",
    },
  });

  console.log("Created seed releases");

  // Show final state
  const releaseCount = await prisma.release.count();
  const sourceCount = await prisma.scraperSource.count();

  console.log(`\nTurso database seeded!`);
  console.log(`  Releases: ${releaseCount}`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`\nRun the Epoch AI scraper to fetch more releases from epoch.ai`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
