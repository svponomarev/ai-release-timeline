import { prisma } from "../src/lib/db";

async function main() {
  const codingModels = await prisma.release.findMany({
    where: {
      isCodingRelated: true,
    },
    select: {
      name: true,
      company: true,
      domain: true,
      parameters: true,
      releaseDate: true,
    },
    orderBy: {
      releaseDate: "desc",
    },
  });

  console.log(`Found ${codingModels.length} coding-related models:\n`);

  codingModels.forEach((m) => {
    const date = m.releaseDate.toISOString().split("T")[0];
    console.log(`- ${m.name} (${m.company}) - ${date} - ${m.parameters || "N/A"}`);
  });

  // Also show total count
  const total = await prisma.release.count();
  console.log(`\nTotal releases in database: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
