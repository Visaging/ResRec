import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size < 1000) {
  console.log("⚡ [ResRec] prisma/dev.db is missing or empty. Initializing schema and seed data...");
  try {
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    console.log("✅ [ResRec] Database successfully initialized and seeded!");
  } catch (error) {
    console.error("❌ [ResRec] Failed to initialize database:", error);
    process.exit(1);
  }
} else {
  const sizeMb = (fs.statSync(dbPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ [ResRec] prisma/dev.db is ready (${sizeMb} MB).`);
}
