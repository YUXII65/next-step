import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 允许手机通过局域网 IP 访问 dev server 的 /_next/* 资源。
  // 若本机 IP 变化，把新 IP 加进来即可；Next 未来版本会强制校验这里。
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.69.29.63"],
};

export default nextConfig;
