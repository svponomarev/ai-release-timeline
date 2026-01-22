import { scrapeEpochAI } from "../src/lib/scrapers/epoch-ai";

async function main() {
  console.log("Testing Epoch AI scraper...\n");

  const result = await scrapeEpochAI();

  console.log("\n=== Results ===");
  console.log(`Added: ${result.added}`);
  console.log(`Updated: ${result.updated}`);

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((err) => console.log(`  - ${err}`));
  }
}

main().catch(console.error);
