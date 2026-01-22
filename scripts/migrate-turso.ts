import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

async function main() {
  console.log("Migrating Turso schema...\n");

  // Add new columns to Release table
  const migrations = [
    `ALTER TABLE Release ADD COLUMN isCodingRelated INTEGER DEFAULT 0`,
    `ALTER TABLE Release ADD COLUMN domain TEXT`,
    `ALTER TABLE Release ADD COLUMN parameters TEXT`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`✓ ${sql.slice(0, 60)}...`);
    } catch (error: any) {
      if (error.message?.includes("duplicate column")) {
        console.log(`- Column already exists, skipping`);
      } else {
        console.log(`✗ Error: ${error.message}`);
      }
    }
  }

  console.log("\nMigration complete!");
}

main()
  .catch(console.error)
  .finally(() => client.close());
