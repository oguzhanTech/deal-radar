import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
