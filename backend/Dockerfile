# 后端 Dockerfile - 针对 2GB 内存服务器优化
# 使用多阶段构建减少最终镜像大小

# ========== 构建阶段 ==========
FROM python:3.12-slim AS builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖到用户目录
RUN pip install --no-cache-dir --user -r requirements.txt

# ========== 运行阶段 ==========
FROM python:3.12-slim

WORKDIR /app

# 创建非 root 用户（安全最佳实践）
RUN useradd -m -u 1000 appuser

# 从构建阶段复制已安装的依赖
COPY --from=builder /root/.local /home/appuser/.local

# 复制应用代码
COPY --chown=appuser:appuser . .

# 创建数据目录
RUN mkdir -p /app/data && chown appuser:appuser /app/data

# 设置 PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
