import type { NextConfig } from "next";

// All browser API calls go to same-origin /api/* and are proxied to the
// NestJS backend. This keeps auth cookies first-party in every environment.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Demo member avatars
      { protocol: "https", hostname: "api.dicebear.com" },
      // Google account profile pictures
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
