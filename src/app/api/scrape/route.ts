import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Status endpoint - shows scraping info without triggering scrapes
export async function GET() {
  const releaseCount = await prisma.release.findMany({
    select: { id: true },
  });

  const reviewCount = await prisma.review.findMany({
    select: { id: true },
  });

  return NextResponse.json({
    status: "ok",
    releases: releaseCount.length,
    reviews: reviewCount.length,
    endpoints: {
      blogs: "POST /api/scrape/blogs - Scrape official blogs for new releases",
      reddit:
        "POST /api/scrape/reddit?limit=3&offset=0 - Scrape Reddit reviews (batched)",
    },
    note: "Scraping is triggered via GitHub Actions every 6 hours",
  });
}
