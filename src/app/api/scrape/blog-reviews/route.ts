import { NextResponse } from "next/server";
import { scrapeBlogReviews } from "@/lib/scrapers/blog-reviews";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log("Starting blog reviews scrape...");
    const result = await scrapeBlogReviews();
    console.log(`Blog reviews scrape complete: ${result.added} added`);

    return NextResponse.json({
      success: true,
      added: result.added,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Blog reviews scrape error:", error);
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
