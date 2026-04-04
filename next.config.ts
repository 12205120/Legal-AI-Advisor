import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {},
  // Allow Next.js to transpile @mediapipe/tasks-vision
  transpilePackages: ["@mediapipe/tasks-vision"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle .wasm files from mediapipe
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    // Treat .wasm files as asset/resource so webpack doesn't try to parse them
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;