import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
