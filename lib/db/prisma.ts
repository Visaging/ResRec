import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function searchForDevDb(dir: string, depth = 0): string | null {
  if (depth > 4) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === "dev.db") {
        try {
          if (fs.statSync(/*turbopackIgnore: true*/ fullPath).size > 1024) {
            return fullPath;
          }
        } catch {}
      }
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        const found = searchForDevDb(fullPath, depth + 1);
        if (found) return found;
      }
    }
  } catch {}
  return null;
}

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
        path.join("/var/task", "ResRec", "prisma", "dev.db"),
        path.join("/var/task", "ResRec-main", "prisma", "dev.db"),
        path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
        path.resolve("./prisma/dev.db"),
      ];

      let sourcePath: string | null = null;
      for (const candidate of candidates) {
        try {
          if (fs.existsSync(/*turbopackIgnore: true*/ candidate) && fs.statSync(/*turbopackIgnore: true*/ candidate).size > 1024) {
            sourcePath = candidate;
            break;
          }
        } catch {}
      }

      if (!sourcePath) {
        // Fallback: search process.cwd() and /var/task recursively
        sourcePath = searchForDevDb(process.cwd()) || searchForDevDb("/var/task");
      }

      if (sourcePath) {
        try {
          fs.copyFileSync(sourcePath, tmpDbPath);
          if (fs.existsSync(/*turbopackIgnore: true*/ `${sourcePath}-wal`)) {
            try { fs.copyFileSync(`${sourcePath}-wal`, `${tmpDbPath}-wal`); } catch {}
          }
          if (fs.existsSync(/*turbopackIgnore: true*/ `${sourcePath}-shm`)) {
            try { fs.copyFileSync(`${sourcePath}-shm`, `${tmpDbPath}-shm`); } catch {}
          }
          console.log(`[ResRec] Initialized writable /tmp/dev.db from ${sourcePath}`);
        } catch (err) {
          console.error(`[ResRec] Failed to copy ${sourcePath} to ${tmpDbPath}:`, err);
        }
      } else {
        console.warn("[ResRec] Could not locate source dev.db in filesystem candidates or search roots.");
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
