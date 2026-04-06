import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 이미지 업로드 허용 — IMAGE_MAX_FILES(5) × IMAGE_MAX_BYTES(5MB) = 25MB
      // + FormData 오버헤드 여유분 1MB. Next.js 기본값은 1MB이므로 명시 필수.
      // 관련: src/features/products/validation.ts IMAGE_MAX_*
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
