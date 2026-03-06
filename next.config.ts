import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize ffmpeg-installer packages to avoid webpack bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
        '@ffmpeg-installer/darwin-arm64': 'commonjs @ffmpeg-installer/darwin-arm64',
        'fluent-ffmpeg': 'commonjs fluent-ffmpeg'
      });
    }
    return config;
  },
};

export default nextConfig;
