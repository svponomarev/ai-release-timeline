import { scrapeOfficialBlogs } from "../src/lib/scrapers/official-blogs";
import { scrapeBlogReviews } from "../src/lib/scrapers/blog-reviews";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== Testing Review Scrapers ===\n");

  // Show current state
  const releaseCount = await prisma.release.count();
  const reviewCount = await prisma.review.count();
  console.log(`Database state: ${releaseCount} releases, ${reviewCount} reviews\n`);

  // Test official blogs scraper
  console.log("1. Testing Official Blogs Scraper...");
  try {
    const blogsResult = await scrapeOfficialBlogs();
    console.log(`   Added: ${blogsResult.added} reviews`);
    if (blogsResult.errors.length > 0) {
      console.log(`   Errors: ${blogsResult.errors.join(", ")}`);
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  console.log("\n2. Testing Independent Blogs Scraper...");
  try {
    const blogReviewsResult = await scrapeBlogReviews();
    console.log(`   Added: ${blogReviewsResult.added} reviews`);
    if (blogReviewsResult.errors.length > 0) {
      console.log(`   Errors: ${blogReviewsResult.errors.join(", ")}`);
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  // Final state
  const finalReviewCount = await prisma.review.count();
  console.log(`\n=== Results ===`);
  console.log(`Reviews before: ${reviewCount}`);
  console.log(`Reviews after: ${finalReviewCount}`);
  console.log(`New reviews added: ${finalReviewCount - reviewCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
