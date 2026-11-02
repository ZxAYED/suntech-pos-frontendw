import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

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

export default withPWA({
  dest: "public",
  disable: true, // Online-only MVP release: PWA registration explicitly deferred
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
})(nextConfig);
