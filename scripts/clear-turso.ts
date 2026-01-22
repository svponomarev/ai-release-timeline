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

async function main() {
  console.log("Connecting to Turso...");
  console.log(`URL: ${url?.replace(/\/\/.*@/, "//***@")}\n`);

  // Show current state
  const releasesBefore = await prisma.release.count();
  const reviewsBefore = await prisma.review.count();
  const sourcesBefore = await prisma.scraperSource.count();

  console.log("Current Turso state:");
  console.log(`  Releases: ${releasesBefore}`);
  console.log(`  Reviews: ${reviewsBefore}`);
  console.log(`  Sources: ${sourcesBefore}`);

  console.log("\nClearing all data...");

  // Clear in order (reviews depend on releases)
  await prisma.review.deleteMany();
  console.log("  Deleted all reviews");

  await prisma.release.deleteMany();
  console.log("  Deleted all releases");

  await prisma.scraperSource.deleteMany();
  console.log("  Deleted all scraper sources");

  console.log("\nTurso database cleared!");
  console.log("Run 'npm run seed' with TURSO env vars to re-seed with fresh data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
