import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Lets next/image optimize Cloudinary-hosted covers (see
    // src/lib/cloudinary.ts) alongside the existing local /public paths,
    // which need no config — Next already handles same-origin sources.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
