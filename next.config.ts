import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.122",
    "192.168.1.157",
    "172.20.10.8",
    "192.168.182.146",
    "192.168.1.76",
    "192.168.1.133"
  ],
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
