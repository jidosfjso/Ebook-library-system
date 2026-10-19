import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 上传封面走 Server Action，默认 1MB 的请求体限制对图片太小，放宽到 10MB
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
