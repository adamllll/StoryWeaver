# 前端 Dockerfile - 针对 2GB 内存服务器优化
# 使用多阶段构建：构建阶段 + 生产运行阶段

# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖配置文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括devDependencies，构建时需要）
RUN npm ci

# 复制源代码
COPY . .

# 设置生产环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN npm run build

# ========== 生产运行阶段 ==========
FROM node:20-alpine AS runner

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户（安全最佳实践）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物（standalone 模式）
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# 复制 Next.js 独立输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 如果不使用 standalone 模式，则复制完整 node_modules 和 .next
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
# COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动命令（standalone 模式）
CMD ["node", "server.js"]
