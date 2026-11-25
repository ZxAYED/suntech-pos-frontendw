import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  cacheLife: {
    landing: {
      stale: 86400, // 24 hours
      revalidate: 3600, // 1 hour
      expire: 604800, // 7 days
    },
    masterData: {
      stale: 600, // 10 minutes
      revalidate: 180, // 3 minutes
      expire: 3600, // 1 hour
    },
  },
  async headers() {
    return [
      {
        source: "/suntech-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/offline-assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

// The production build creates a neutral shell from the existing client screens.
// No private App Router HTML or RSC responses enter a service-worker cache.
export default nextConfig;
