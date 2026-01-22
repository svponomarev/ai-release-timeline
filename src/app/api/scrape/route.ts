import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Status endpoint - shows scraping info without triggering scrapes
export async function GET() {
  const releaseCount = await prisma.release.count();
  const reviewCount = await prisma.review.count();
  const codingModelCount = await prisma.release.count({
    where: { isCodingRelated: true },
  });

  return NextResponse.json({
    status: "ok",
    releases: releaseCount,
    reviews: reviewCount,
    codingModels: codingModelCount,
    endpoints: {
      epochAi: "POST /api/scrape/epoch-ai - Fetch releases from Epoch AI (primary source)",
      blogs: "POST /api/scrape/blogs - Scrape official blogs for reviews",
      blogReviews: "POST /api/scrape/blog-reviews - Scrape independent blogs for reviews",
      reddit: "POST /api/scrape/reddit - Scrape Reddit for reviews",
      xReviews: "POST /api/scrape/x-reviews - Scrape X/Twitter for reviews",
    },
    architecture: {
      releases: "Epoch AI notable_ai_models.csv (curated, updated daily)",
      reviews: "Reddit, X, official blogs, independent blogs (Simon Willison, etc.)",
    },
    note: "Scraping is triggered via GitHub Actions",
  });
}
