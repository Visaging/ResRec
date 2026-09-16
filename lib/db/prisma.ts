import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string {
  // If user provided a custom cloud database URL (e.g., PostgreSQL, Neon, Supabase, Turso), use it directly
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith("file:./") && !envUrl.startsWith("file:dev.db")) {
    return envUrl;
  }

  // Detect serverless environment (Vercel, AWS Lambda, Netlify, etc.)
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (process.env.NODE_ENV === "production" && process.platform !== "win32")
  );

  if (isServerless) {
    const tmpDir = process.env.TMPDIR || (process.platform === "win32" ? (process.env.TEMP || "C:\\tmp") : "/tmp");
    const tmpDbPath = path.join(tmpDir, "dev.db");

    // Check if /tmp/dev.db is already populated
    let needCopy = true;
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ tmpDbPath)) {
        const stats = fs.statSync(/*turbopackIgnore: true*/ tmpDbPath);
        if (stats.size > 1024) {
          needCopy = false;
        }
      }
    } catch {
      needCopy = true;
    }

    if (needCopy) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "..", "prisma", "dev.db"),
        path.join("/var/task", "prisma", "dev.db"),
        path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
        path.resolve("./prisma/dev.db"),
      ];

      let copied = false;
      for (const candidate of candidates) {
        try {
          if (fs.existsSync(/*turbopackIgnore: true*/ candidate) && fs.statSync(/*turbopackIgnore: true*/ candidate).size > 1024) {
            fs.copyFileSync(candidate, tmpDbPath);
            // Copy WAL/SHM files if they exist alongside dev.db
            if (fs.existsSync(/*turbopackIgnore: true*/ `${candidate}-wal`)) {
              try { fs.copyFileSync(`${candidate}-wal`, `${tmpDbPath}-wal`); } catch {}
            }
            if (fs.existsSync(/*turbopackIgnore: true*/ `${candidate}-shm`)) {
              try { fs.copyFileSync(`${candidate}-shm`, `${tmpDbPath}-shm`); } catch {}
            }
            console.log(`[ResRec] Initialized writable /tmp/dev.db from ${candidate}`);
            copied = true;
            break;
          }
        } catch (err) {
          console.warn(`[ResRec] Could not copy candidate ${candidate}:`, err);
        }
      }

      if (!copied) {
        console.warn("[ResRec] Source dev.db not found in bundle candidates. Creating fresh database in /tmp.");
      }
    }

    const normalizedTmpPath = tmpDbPath.replace(/\\/g, "/");
    return `file:${normalizedTmpPath}`;
  }

  // Local development / Node server environment:
  const localCandidates = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "ResRec-main", "prisma", "dev.db"),
    path.resolve(__dirname, "../../prisma/dev.db"),
    path.resolve("./prisma/dev.db"),
  ];

  for (const candidate of localCandidates) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
        const normalized = candidate.replace(/\\/g, "/");
        return `file:${normalized}`;
      }
    } catch {}
  }

  return "file:./prisma/dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
