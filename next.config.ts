import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/workers/:path*',
        destination: '/dashboard/users/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
