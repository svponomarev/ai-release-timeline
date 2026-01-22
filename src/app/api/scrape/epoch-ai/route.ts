import { NextResponse } from "next/server";
import { scrapeEpochAI } from "@/lib/scrapers/epoch-ai";

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
    console.log("Starting Epoch AI scrape...");
    const result = await scrapeEpochAI();
    console.log(`Epoch AI scrape complete: ${result.added} added, ${result.updated} updated`);

    return NextResponse.json({
      success: true,
      added: result.added,
      updated: result.updated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Epoch AI scrape error:", error);
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
