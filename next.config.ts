import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  async rewrites() {
    return [
      {
        source: "/internal/deals/import",
        destination: "/api/internal/deals/import",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Küçük thumbnail'lar (anasayfa 64px) için net görüntü: 128/256w üretilsin
    deviceSizes: [128, 256, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};

export default nextConfig;
