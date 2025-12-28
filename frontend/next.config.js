/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // 启用独立输出模式（Docker 部署优化）
  output: 'standalone',

  // API rewrites to backend (仅开发环境使用)
  async rewrites() {
    // 生产环境通过 Nginx/OpenResty 反向代理，不需要 Next.js rewrites
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    // 开发环境使用 rewrites 代理到本地后端
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Image optimization configuration
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ["isomorphic-dompurify", "jsdom"],
  },
};

module.exports = nextConfig;
