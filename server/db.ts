import { createRequire } from "module";
import path from "path";
import fs from "fs";

// better-sqlite3 is a native C++ addon unavailable in Vercel's serverless runtime.
// We use createRequire (sync) so we can try/catch the load without top-level await.
// All API routes are in demo/in-memory mode, so the DB is never called on Vercel.

let db: any = null;

try {
  const req = createRequire(import.meta.url);
  const { drizzle } = req("drizzle-orm/better-sqlite3");
  const Database = req("better-sqlite3");
  const schema = req("../shared/schema");

  let dbPath = "sqlite.db";
  if (process.env.NODE_ENV === "production") {
    dbPath = "/tmp/sqlite.db";
    try {
      const sourceDb = path.join(process.cwd(), "sqlite.db");
      if (fs.existsSync(sourceDb) && !fs.existsSync(dbPath)) {
        fs.copyFileSync(sourceDb, dbPath);
      }
    } catch (err) {
      console.error("Failed to copy database to /tmp:", err);
    }
  }

  const sqlite = new Database(dbPath);
  db = drizzle(sqlite, { schema });
  console.log("SQLite database loaded successfully.");
} catch (err) {
  console.warn(
    "better-sqlite3 unavailable (expected on Vercel). Running in memory-only mode.",
    (err as Error).message
  );
  db = null;
}

export { db };
