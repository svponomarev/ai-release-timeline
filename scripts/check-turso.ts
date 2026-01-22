import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Turso Database Status ===\n");

  const releases = await prisma.release.count();
  const reviews = await prisma.review.count();
  const sources = await prisma.scraperSource.count();
  const codingModels = await prisma.release.count({ where: { isCodingRelated: true } });

  console.log(`Releases: ${releases}`);
  console.log(`Reviews: ${reviews}`);
  console.log(`Sources: ${sources}`);
  console.log(`Coding models: ${codingModels}`);

  // Show recent releases
  console.log("\n=== Recent Releases ===\n");
  const recent = await prisma.release.findMany({
    orderBy: { releaseDate: "desc" },
    take: 10,
    select: { name: true, company: true, releaseDate: true, isCodingRelated: true },
  });

  recent.forEach((r) => {
    const date = r.releaseDate.toISOString().split("T")[0];
    const coding = r.isCodingRelated ? " [coding]" : "";
    console.log(`${date} - ${r.name} (${r.company})${coding}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
