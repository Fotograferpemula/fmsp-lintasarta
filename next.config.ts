import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hilangkan dev indicator (tombol "N" di kiri bawah)
  devIndicators: false,

  // Production-ready settings
  poweredByHeader: false,
  compress: true,

  // Standalone output for deployment (Docker/VPS)
  output: 'standalone',
};

export default nextConfig;
