import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/notifications",
        destination: "http://4.224.186.213/evaluation-service/notifications",
      },
    ];
  },
};

export default nextConfig;
