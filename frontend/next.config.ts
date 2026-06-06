import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? packageJson.version,
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || "http://localhost:8004";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${target}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
