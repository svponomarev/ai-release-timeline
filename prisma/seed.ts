import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

// Support both local SQLite and remote Turso
const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const adapter = new PrismaLibSql({
  url,
  authToken,
});

const prisma = new PrismaClient({ adapter });

console.log(`Connecting to: ${url.includes("turso") ? "Turso (remote)" : "SQLite (local)"}`);

async function main() {
  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.release.deleteMany();
  await prisma.scraperSource.deleteMany();

  // ===========================================
  // SCRAPER SOURCES
  // ===========================================

  await prisma.scraperSource.createMany({
    data: [
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
      // RSS/Blog sources
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
      // Expert blogs - used for collecting REVIEWS (not releases)
      {
        type: "blog",
        name: "Andrej Karpathy Blog",
        url: "https://karpathy.bearblog.dev/feed/",
        company: "Independent",
        enabled: true,
      },
      {
        type: "blog",
        name: "Sankalp's Blog",
        url: "https://sankalp.bearblog.dev/feed/",
        company: "Independent",
        enabled: true,
      },
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
        company: "OpenAI",
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

  // ===========================================
  // 2023 RELEASES
  // ===========================================

  const gpt4 = await prisma.release.create({
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
        "Better at following complex instructions",
        "Reduced hallucinations compared to GPT-3.5"
      ]),
      pricing: "Input: $30/1M tokens, Output: $60/1M tokens (8K)",
      docsUrl: "https://platform.openai.com/docs/models/gpt-4",
      sourceUrl: "https://openai.com/research/gpt-4",
    },
  });

  const claude2 = await prisma.release.create({
    data: {
      name: "Claude 2",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2023-07-11"),
      summary: "Major upgrade with 100K context window and improved coding abilities",
      features: JSON.stringify([
        "100K token context window",
        "Improved coding and math abilities",
        "Better at longer document analysis",
        "Constitutional AI safety training",
        "Available via API and claude.ai"
      ]),
      pricing: "Input: $8/1M tokens, Output: $24/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs",
      sourceUrl: "https://www.anthropic.com/news/claude-2",
    },
  });

  const llama2 = await prisma.release.create({
    data: {
      name: "Llama 2",
      company: "Meta",
      category: "model",
      releaseDate: new Date("2023-07-18"),
      summary: "Open source LLM with commercial license, available in 7B, 13B, and 70B sizes",
      features: JSON.stringify([
        "Open weights with commercial license",
        "7B, 13B, and 70B parameter versions",
        "4K context length",
        "Fine-tuned chat versions available",
        "Trained on 2 trillion tokens"
      ]),
      pricing: "Free and open source",
      docsUrl: "https://llama.meta.com/docs/",
      sourceUrl: "https://ai.meta.com/llama/",
    },
  });

  const codeLlama = await prisma.release.create({
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
        "Infilling capabilities",
        "Python-specialized variant available"
      ]),
      pricing: "Free and open source",
      docsUrl: "https://llama.meta.com/docs/",
      sourceUrl: "https://ai.meta.com/blog/code-llama-large-language-model-coding/",
    },
  });

  const mistral7b = await prisma.release.create({
    data: {
      name: "Mistral 7B",
      company: "Mistral AI",
      category: "model",
      releaseDate: new Date("2023-09-27"),
      summary: "Efficient 7B model outperforming Llama 2 13B on most benchmarks",
      features: JSON.stringify([
        "7B parameters, outperforms Llama 2 13B",
        "Sliding window attention (8K context)",
        "Grouped-query attention for faster inference",
        "Apache 2.0 license",
        "Efficient and fast"
      ]),
      pricing: "Free and open source",
      docsUrl: "https://docs.mistral.ai/",
      sourceUrl: "https://mistral.ai/news/announcing-mistral-7b/",
    },
  });

  const gpt4Turbo = await prisma.release.create({
    data: {
      name: "GPT-4 Turbo",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2023-11-06"),
      summary: "Faster, cheaper GPT-4 with 128K context and knowledge up to April 2023",
      features: JSON.stringify([
        "128K context window",
        "Knowledge cutoff April 2023",
        "3x cheaper than GPT-4",
        "JSON mode for structured outputs",
        "Improved instruction following"
      ]),
      pricing: "Input: $10/1M tokens, Output: $30/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-4-turbo",
      sourceUrl: "https://openai.com/blog/new-models-and-developer-products-announced-at-devday",
    },
  });

  const mixtral = await prisma.release.create({
    data: {
      name: "Mixtral 8x7B",
      company: "Mistral AI",
      category: "model",
      releaseDate: new Date("2023-12-11"),
      summary: "Sparse mixture-of-experts model matching GPT-3.5 performance",
      features: JSON.stringify([
        "8x7B Mixture of Experts architecture",
        "Only uses 2 experts per token (12.9B active)",
        "32K context window",
        "Matches GPT-3.5 Turbo performance",
        "Apache 2.0 license"
      ]),
      pricing: "Free and open source",
      docsUrl: "https://docs.mistral.ai/",
      sourceUrl: "https://mistral.ai/news/mixtral-of-experts/",
    },
  });

  // ===========================================
  // 2024 RELEASES
  // ===========================================

  const gemini15Pro = await prisma.release.create({
    data: {
      name: "Gemini 1.5 Pro",
      company: "Google",
      category: "model",
      releaseDate: new Date("2024-02-15"),
      summary: "Breakthrough 1M token context window with efficient architecture",
      features: JSON.stringify([
        "1 million token context window",
        "Mixture-of-Experts architecture",
        "Near-perfect recall up to 1M tokens",
        "Multimodal understanding (text, image, video, audio)",
        "Strong in-context learning"
      ]),
      pricing: "Free tier available, Pro pricing varies",
      docsUrl: "https://ai.google.dev/gemini-api/docs",
      sourceUrl: "https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/",
    },
  });

  const claude3 = await prisma.release.create({
    data: {
      name: "Claude 3 (Opus, Sonnet, Haiku)",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2024-03-04"),
      summary: "Model family with Opus outperforming GPT-4 on most benchmarks",
      features: JSON.stringify([
        "Three tiers: Opus (most capable), Sonnet (balanced), Haiku (fast)",
        "200K context window",
        "Vision capabilities across all models",
        "Opus achieves near-human performance on expert tasks",
        "Improved multilingual capabilities"
      ]),
      pricing: "Opus: $15/$75, Sonnet: $3/$15, Haiku: $0.25/$1.25 per 1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-3-family",
    },
  });

  const cursor = await prisma.release.create({
    data: {
      name: "Cursor",
      company: "Anysphere",
      category: "tool",
      releaseDate: new Date("2024-03-01"),
      summary: "AI-first code editor built on VSCode with deep AI integration",
      features: JSON.stringify([
        "AI-powered code completion with Copilot++",
        "Chat with your codebase",
        "Cmd-K for inline editing",
        "Multi-file editing capabilities",
        "Built on VSCode for familiar experience"
      ]),
      pricing: "$20/month Pro, Free tier available",
      docsUrl: "https://cursor.sh/docs",
      sourceUrl: "https://cursor.sh/",
    },
  });

  const llama3 = await prisma.release.create({
    data: {
      name: "Llama 3",
      company: "Meta",
      category: "model",
      releaseDate: new Date("2024-04-18"),
      summary: "Open-source models approaching GPT-4 performance",
      features: JSON.stringify([
        "8B and 70B parameter versions",
        "8K context length",
        "Improved reasoning and coding",
        "Open weights for commercial use",
        "Strong performance on benchmarks"
      ]),
      pricing: "Free and open source",
      docsUrl: "https://llama.meta.com/docs/",
      sourceUrl: "https://ai.meta.com/blog/meta-llama-3/",
    },
  });

  const gpt4o = await prisma.release.create({
    data: {
      name: "GPT-4o",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2024-05-13"),
      summary: "Omni model with native multimodal capabilities across text, vision, and audio",
      features: JSON.stringify([
        "Native multimodal: text, image, and audio in one model",
        "2x faster than GPT-4 Turbo",
        "50% cheaper API pricing",
        "Real-time voice conversations",
        "Improved non-English language support"
      ]),
      pricing: "Input: $5/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-4o",
      sourceUrl: "https://openai.com/index/hello-gpt-4o/",
    },
  });

  const claude35Sonnet = await prisma.release.create({
    data: {
      name: "Claude 3.5 Sonnet",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2024-06-20"),
      summary: "Most intelligent Claude model yet, outperforming GPT-4o on many benchmarks",
      features: JSON.stringify([
        "Outperforms GPT-4o on graduate-level reasoning (GPQA)",
        "Strong coding abilities (64.2% on HumanEval)",
        "200K context window",
        "2x faster than Claude 3 Opus",
        "Improved instruction following"
      ]),
      pricing: "Input: $3/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-3-5-sonnet",
    },
  });

  const llama31 = await prisma.release.create({
    data: {
      name: "Llama 3.1",
      company: "Meta",
      category: "model",
      releaseDate: new Date("2024-07-23"),
      summary: "405B flagship model rivaling GPT-4o and Claude 3.5 Sonnet",
      features: JSON.stringify([
        "405B parameter flagship model",
        "128K context window",
        "8B and 70B updated versions",
        "Multilingual support (8 languages)",
        "Tool use and function calling"
      ]),
      pricing: "Free and open source",
      docsUrl: "https://llama.meta.com/docs/",
      sourceUrl: "https://ai.meta.com/blog/meta-llama-3-1/",
    },
  });

  const gpt4oMini = await prisma.release.create({
    data: {
      name: "GPT-4o mini",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2024-07-18"),
      summary: "Small, fast, affordable model replacing GPT-3.5 Turbo",
      features: JSON.stringify([
        "Replaces GPT-3.5 Turbo",
        "128K context window",
        "Significantly cheaper than GPT-4o",
        "Multimodal (text and vision)",
        "LMSYS Elo score higher than GPT-4"
      ]),
      pricing: "Input: $0.15/1M tokens, Output: $0.60/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-4o-mini",
      sourceUrl: "https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/",
    },
  });

  const o1 = await prisma.release.create({
    data: {
      name: "o1 (Strawberry)",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2024-09-12"),
      summary: "New reasoning model that thinks before answering, excels at math and coding",
      features: JSON.stringify([
        "Chain-of-thought reasoning built-in",
        "Excels at math, science, and coding",
        "o1-preview and o1-mini variants",
        "Significantly better at complex reasoning",
        "Thinks for seconds to minutes before responding"
      ]),
      pricing: "o1-preview: $15/$60, o1-mini: $3/$12 per 1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/o1",
      sourceUrl: "https://openai.com/index/introducing-openai-o1-preview/",
    },
  });

  const claudeCode = await prisma.release.create({
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
        "Works with any language or framework",
        "MCP server integration"
      ]),
      pricing: "Usage-based via Claude API",
      docsUrl: "https://docs.anthropic.com/claude-code",
      sourceUrl: "https://www.anthropic.com/news/claude-code",
    },
  });

  // ===========================================
  // 2025 RELEASES (from whiteboard)
  // ===========================================

  const claudeSonnet4 = await prisma.release.create({
    data: {
      name: "Claude Sonnet 4",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-05-22"),
      summary: "Next generation Sonnet with improved reasoning and coding capabilities",
      features: JSON.stringify([
        "Significant improvements over Claude 3.5 Sonnet",
        "Enhanced reasoning capabilities",
        "Better code generation and understanding",
        "Improved instruction following",
        "200K context window"
      ]),
      pricing: "Input: $3/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-4",
    },
  });

  const claudeOpus4 = await prisma.release.create({
    data: {
      name: "Claude Opus 4",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-05-22"),
      summary: "Most capable Claude model, new frontier in AI reasoning",
      features: JSON.stringify([
        "State-of-the-art performance across benchmarks",
        "Extended thinking capabilities",
        "Superior coding and analysis",
        "Best-in-class for complex tasks",
        "200K context window"
      ]),
      pricing: "Input: $15/1M tokens, Output: $75/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-4",
    },
  });

  const claudeOpus41 = await prisma.release.create({
    data: {
      name: "Claude Opus 4.1",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-08-05"),
      summary: "Incremental update to Opus 4 with performance improvements",
      features: JSON.stringify([
        "Improved performance over Opus 4",
        "Better at long-context tasks",
        "Enhanced tool use capabilities",
        "Reduced latency",
        "Better instruction following"
      ]),
      pricing: "Input: $15/1M tokens, Output: $75/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-opus-4-1",
    },
  });

  const gpt5 = await prisma.release.create({
    data: {
      name: "GPT-5",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2025-08-07"),
      summary: "OpenAI's next major model release with significant capability gains",
      features: JSON.stringify([
        "Major leap in reasoning capabilities",
        "Improved multimodal understanding",
        "256K context window",
        "Better factual accuracy",
        "Enhanced safety features"
      ]),
      pricing: "Input: $10/1M tokens, Output: $30/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-5",
      sourceUrl: "https://openai.com/index/gpt-5",
    },
  });

  const gpt5Codex = await prisma.release.create({
    data: {
      name: "GPT-5-Codex",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2025-09-15"),
      summary: "GPT-5 fine-tuned for code generation and software development",
      features: JSON.stringify([
        "Specialized for code generation",
        "Full repository understanding",
        "Multi-file editing capabilities",
        "Built-in debugging assistance",
        "Supports all major programming languages"
      ]),
      pricing: "Input: $12/1M tokens, Output: $36/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-5-codex",
      sourceUrl: "https://openai.com/index/gpt-5-codex",
    },
  });

  const claudeSonnet45 = await prisma.release.create({
    data: {
      name: "Claude Sonnet 4.5",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-09-29"),
      summary: "Mid-cycle update bringing Sonnet closer to Opus performance",
      features: JSON.stringify([
        "Significant performance improvements",
        "Better reasoning capabilities",
        "Improved coding abilities",
        "Faster response times",
        "Better value for complex tasks"
      ]),
      pricing: "Input: $3/1M tokens, Output: $15/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-sonnet-4-5",
    },
  });

  const claudeCode2 = await prisma.release.create({
    data: {
      name: "Claude Code 2.0",
      company: "Anthropic",
      category: "tool",
      releaseDate: new Date("2025-09-29"),
      summary: "Major update to Claude Code with enhanced agentic capabilities",
      features: JSON.stringify([
        "Improved codebase understanding",
        "Better multi-file editing",
        "Enhanced git integration",
        "Parallel task execution",
        "Custom agent workflows"
      ]),
      pricing: "Usage-based via Claude API",
      docsUrl: "https://docs.anthropic.com/claude-code",
      sourceUrl: "https://www.anthropic.com/news/claude-code-2",
    },
  });

  const claudeHaiku45 = await prisma.release.create({
    data: {
      name: "Claude Haiku 4.5",
      company: "Anthropic",
      category: "model",
      releaseDate: new Date("2025-10-15"),
      summary: "Fast and affordable model with improved capabilities",
      features: JSON.stringify([
        "Fastest Claude model",
        "Significantly improved over Haiku 3",
        "Great for high-volume tasks",
        "Low latency responses",
        "Cost-effective for production"
      ]),
      pricing: "Input: $0.25/1M tokens, Output: $1.25/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-haiku-4-5",
    },
  });

  const gpt51 = await prisma.release.create({
    data: {
      name: "GPT-5.1",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2025-11-12"),
      summary: "Incremental update to GPT-5 with reliability improvements",
      features: JSON.stringify([
        "Improved reliability and consistency",
        "Better instruction following",
        "Reduced hallucinations",
        "Faster inference",
        "Enhanced safety"
      ]),
      pricing: "Input: $10/1M tokens, Output: $30/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-5",
      sourceUrl: "https://openai.com/index/gpt-5-1",
    },
  });

  const gpt51CodexMax = await prisma.release.create({
    data: {
      name: "GPT-5.1-Codex-Max",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2025-11-19"),
      summary: "Maximum capability code model for enterprise development",
      features: JSON.stringify([
        "Largest code-specialized model",
        "Enterprise-grade reliability",
        "Full codebase reasoning",
        "Advanced debugging and refactoring",
        "Supports complex architectural decisions"
      ]),
      pricing: "Input: $20/1M tokens, Output: $60/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-5-codex-max",
      sourceUrl: "https://openai.com/index/gpt-5-1-codex-max",
    },
  });

  const claudeOpus45 = await prisma.release.create({
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
        "Superior long-context understanding",
        "Advanced tool use and agents"
      ]),
      pricing: "Input: $15/1M tokens, Output: $75/1M tokens",
      docsUrl: "https://docs.anthropic.com/claude/docs/models-overview",
      sourceUrl: "https://www.anthropic.com/news/claude-opus-4-5",
    },
  });

  const gpt52 = await prisma.release.create({
    data: {
      name: "GPT-5.2",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2025-12-11"),
      summary: "Year-end update with major capability improvements",
      features: JSON.stringify([
        "Significant reasoning improvements",
        "Better multimodal integration",
        "Enhanced factual accuracy",
        "Improved creative writing",
        "512K context window"
      ]),
      pricing: "Input: $10/1M tokens, Output: $30/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-5",
      sourceUrl: "https://openai.com/index/gpt-5-2",
    },
  });

  const gpt52Codex = await prisma.release.create({
    data: {
      name: "GPT-5.2-Codex",
      company: "OpenAI",
      category: "model",
      releaseDate: new Date("2025-12-18"),
      summary: "Latest code-specialized model with GPT-5.2 improvements",
      features: JSON.stringify([
        "All GPT-5.2 improvements for code",
        "Enhanced multi-language support",
        "Better code review capabilities",
        "Improved test generation",
        "Advanced refactoring suggestions"
      ]),
      pricing: "Input: $12/1M tokens, Output: $36/1M tokens",
      docsUrl: "https://platform.openai.com/docs/models/gpt-5-codex",
      sourceUrl: "https://openai.com/index/gpt-5-2-codex",
    },
  });

  // ===========================================
  // SAMPLE REVIEWS
  // ===========================================

  await prisma.review.createMany({
    data: [
      // GPT-4 reviews
      {
        releaseId: gpt4.id,
        source: "reddit",
        author: "u/ai_researcher",
        content: "GPT-4 is a massive leap from GPT-3.5. The reasoning capabilities are noticeably better, especially for complex multi-step problems. Still hallucinates sometimes but much less frequently.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/ChatGPT/comments/example1",
      },
      // Claude 3 reviews
      {
        releaseId: claude3.id,
        source: "blog",
        author: "Simon Willison",
        content: "Claude 3 Opus is genuinely impressive. It's the first model where I've felt it truly understands nuance in complex instructions. The 200K context is game-changing for document analysis.",
        sentiment: "positive",
        sourceUrl: "https://simonwillison.net/example",
      },
      // GPT-4o reviews
      {
        releaseId: gpt4o.id,
        source: "reddit",
        author: "u/ml_researcher",
        content: "The speed improvement is noticeable immediately. API response times are genuinely 2x faster. Multimodal capabilities work well but still have some edge cases.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/ChatGPT/comments/example2",
      },
      {
        releaseId: gpt4o.id,
        source: "youtube",
        author: "AI Explained",
        content: "GPT-4o represents a significant architectural shift. The unified model approach eliminates the latency of separate models for different modalities.",
        sentiment: "positive",
        sourceUrl: "https://youtube.com/watch?v=example1",
      },
      // Claude 3.5 Sonnet reviews
      {
        releaseId: claude35Sonnet.id,
        source: "reddit",
        author: "u/code_developer",
        content: "Been using it for coding tasks all week. The instruction following is notably better than previous Claude versions. It actually reads the full context now.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/LocalLLaMA/comments/example3",
      },
      {
        releaseId: claude35Sonnet.id,
        source: "blog",
        author: "Simon Willison",
        content: "Claude 3.5 Sonnet is my new daily driver. The combination of speed, capability, and cost makes it hard to justify using more expensive alternatives for most tasks.",
        sentiment: "positive",
        sourceUrl: "https://simonwillison.net/example2",
      },
      // Claude Code reviews
      {
        releaseId: claudeCode.id,
        source: "reddit",
        author: "u/terminal_user",
        content: "This is what I wanted Copilot to be. It understands my entire codebase and can make changes across multiple files. The terminal integration is seamless.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/programming/comments/example4",
      },
      {
        releaseId: claudeCode.id,
        source: "x",
        author: "@swyx",
        content: "Claude Code is surprisingly good at understanding project structure. Gave it a complex refactoring task and it handled it better than I expected.",
        sentiment: "positive",
        sourceUrl: "https://x.com/swyx/status/example",
      },
      // Gemini 1.5 Pro reviews
      {
        releaseId: gemini15Pro.id,
        source: "reddit",
        author: "u/context_window_fan",
        content: "The 1M context window is not a gimmick. I tested it with a 700K token codebase and it maintained coherent understanding throughout.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/MachineLearning/comments/example5",
      },
      // Cursor reviews
      {
        releaseId: cursor.id,
        source: "youtube",
        author: "Fireship",
        content: "Cursor is like VSCode on steroids. The Cmd-K workflow is addictive once you get used to it.",
        sentiment: "positive",
        sourceUrl: "https://youtube.com/watch?v=example2",
      },
      {
        releaseId: cursor.id,
        source: "reddit",
        author: "u/vscode_user",
        content: "Switched from vanilla VSCode + Copilot. The integrated chat that understands your codebase is the killer feature.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/programming/comments/example6",
      },
      // Llama 3 reviews
      {
        releaseId: llama3.id,
        source: "reddit",
        author: "u/open_source_advocate",
        content: "Finally an open model that can compete with the big players. Running the 70B on my own hardware is a game changer for privacy-sensitive work.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/LocalLLaMA/comments/example7",
      },
      {
        releaseId: llama3.id,
        source: "blog",
        author: "Hugging Face Team",
        content: "Llama 3 70B achieves 82% on MMLU, putting it firmly in GPT-4 territory. The open weights enable innovations that closed models cannot.",
        sentiment: "positive",
        sourceUrl: "https://huggingface.co/blog/example",
      },
      // o1 reviews
      {
        releaseId: o1.id,
        source: "reddit",
        author: "u/math_phd",
        content: "o1 solved competition math problems that GPT-4 couldn't touch. The chain-of-thought reasoning is visible in how it breaks down problems. Genuinely impressive for STEM.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/MachineLearning/comments/example8",
      },
      // GPT-5 reviews
      {
        releaseId: gpt5.id,
        source: "reddit",
        author: "u/ai_enthusiast",
        content: "GPT-5 feels like another GPT-3 to GPT-4 level jump. The reasoning is noticeably better and it makes far fewer obvious mistakes.",
        sentiment: "positive",
        sourceUrl: "https://reddit.com/r/ChatGPT/comments/example9",
      },
      // Claude Opus 4.5 reviews
      {
        releaseId: claudeOpus45.id,
        source: "x",
        author: "@karpathy",
        content: "Claude Opus 4.5 is genuinely pushing the frontier. Tested it on some tricky reasoning tasks and it handles nuance better than anything I've seen.",
        sentiment: "positive",
        sourceUrl: "https://x.com/karpathy/status/example",
      },
    ],
  });

  console.log("Database seeded successfully!");
  console.log(`Added ${await prisma.release.count()} releases`);
  console.log(`Added ${await prisma.review.count()} reviews`);
  console.log(`Added ${await prisma.scraperSource.count()} scraper sources`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
