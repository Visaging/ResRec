import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cool-nwc", "@prisma/client"],
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
};

export default nextConfig;
