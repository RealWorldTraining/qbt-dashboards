import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force clean builds and disable caching issues
  experimental: {
    forceSwcTransforms: true,
  },
  // Ensure all routes are discovered
  trailingSlash: false,
  // Clear build cache
  ...(process.env.NEXT_BUILD_FORCE === 'true' && {
    distDir: '.next-forced'
  })
};

export default nextConfig;
