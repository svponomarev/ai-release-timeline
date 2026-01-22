import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeRedditForReleases } from "@/lib/scrapers/reddit";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Get pagination params from URL
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "3", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  try {
    // Get releases with pagination
    const releases = await prisma.release.findMany({
      select: { id: true, name: true, company: true },
      orderBy: { releaseDate: "desc" },
      skip: offset,
      take: limit,
    });

    if (releases.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No releases to process in this batch",
        added: 0,
        processed: 0,
      });
    }

    console.log(
      `Starting Reddit scrape for ${releases.length} releases (offset: ${offset})...`
    );

    const result = await scrapeRedditForReleases(releases);

    console.log(`Reddit scrape complete: ${result.added} reviews added`);

    return NextResponse.json({
      success: true,
      added: result.added,
      processed: releases.length,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reddit scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
