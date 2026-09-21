import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @opennextjs/cloudflare
  // Disables the default Next.js server component bundling optimization
  // so OpenNext can properly handle the output
  output: "standalone",
};

export default nextConfig;
