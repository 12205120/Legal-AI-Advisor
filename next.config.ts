  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    // Move logging out of experimental
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    experimental: {
      // Keep other experimental features here, 
      // but remove allowedDevOrigins if you don't explicitly need it
    },
  };

  export default nextConfig;