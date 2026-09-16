import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cool-nwc", "@prisma/client"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/dev.db"],
    "/**/*": ["./prisma/dev.db"],
  },
};

export default nextConfig;
