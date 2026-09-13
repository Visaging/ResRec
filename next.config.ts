import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cool-nwc", "@prisma/client"],
};

export default nextConfig;
