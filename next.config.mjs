/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/swap",
      },
    ];
  },
};

export default nextConfig;
