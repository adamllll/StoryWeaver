# StoryWeaver 部署指南 - 1Panel + OpenResty

> 本指南专门针对已安装 1Panel 和 OpenResty 的服务器环境

## 📋 目录

- [部署架构](#部署架构)
- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [详细步骤](#详细步骤)
- [故障排查](#故障排查)
- [性能优化](#性能优化)
- [维护指南](#维护指南)

---

## 部署架构

```
用户请求
   ↓
OpenResty (反向代理，端口 80/443)
   ↓
   ├─→ Frontend 容器 (3000)
   └─→ Backend 容器 (8000)
```

**技术栈**：
- **前端**: Next.js 14 + TypeScript (Docker 容器)
- **后端**: FastAPI + SQLAlchemy (Docker 容器)
- **数据库**: SQLite (持久化卷)
- **反向代理**: OpenResty (1Panel 管理)
- **容器编排**: Docker Compose

---

## 环境要求

### 服务器配置

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 1核 | 2核+ |
| 内存 | 2GB | 4GB+ |
| 硬盘 | 10GB | 20GB+ |
| 系统 | Ubuntu 20.04+ / Debian 11+ | - |

### 软件要求

- ✅ 1Panel 面板（已安装）
- ✅ OpenResty（已安装）
- ✅ Docker 20.10+
- ✅ Docker Compose 2.0+

**验证安装**：
```bash
docker --version
docker-compose --version
openresty -v
```

---

## 快速部署

### 一键部署脚本

```bash
# 1. 克隆项目
cd /opt/1panel/apps/
git clone https://github.com/adamllll/StoryWeaver.git storyweaver
cd storyweaver

# 2. 生成 JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)
echo "生成的 JWT 密钥: $JWT_SECRET"

# 3. 配置环境变量
cat > backend/.env << EOF
DATABASE_URL=sqlite:///./data/story.db
JWT_SECRET_KEY=$JWT_SECRET
OPENAI_API_KEY=你的OpenAI密钥
OPENAI_API_BASE=https://api.openai.com/v1
DEBUG=false
FRONTEND_URL=http://你的域名
BACKEND_URL=http://你的域名/api
CORS_ORIGINS=["http://你的域名","https://你的域名"]
EOF

cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://你的域名/api
EOF

# 4. 创建数据目录
mkdir -p backend/data backend/backups

# 5. 启动容器
docker-compose up -d --build

# 6. 初始化数据库
docker exec -it storyweaver-backend alembic upgrade head

# 7. 检查状态
docker-compose ps
```

---

## 详细步骤

### 步骤一：准备项目目录

#### 1.1 创建项目目录

在 1Panel 文件管理中：
- **文件** → **创建目录** → `/opt/1panel/apps/storyweaver/`

或通过 SSH：
```bash
mkdir -p /opt/1panel/apps/storyweaver
cd /opt/1panel/apps/
```

#### 1.2 克隆项目

**方式一：SSH 克隆（推荐）**
```bash
cd /opt/1panel/apps/
git clone https://github.com/adamllll/StoryWeaver.git storyweaver
cd storyweaver
```

**方式二：1Panel 界面上传**
- 本地打包项目为 ZIP
- 在 1Panel 文件管理中上传并解压

---

### 步骤二：配置环境变量

#### 2.1 生成安全密钥

```bash
# 生成 JWT 密钥（记录下来！）
openssl rand -hex 32
```

#### 2.2 创建后端配置文件

编辑 `/opt/1panel/apps/storyweaver/backend/.env`：

```bash
# ==================== 数据库配置 ====================
DATABASE_URL=sqlite:///./data/story.db

# ==================== JWT 配置 ====================
# ⚠️ 必须修改！使用 openssl rand -hex 32 生成
JWT_SECRET_KEY=your-generated-secret-key-here

# ==================== AI 服务配置 ====================
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_API_BASE=https://api.openai.com/v1

# 可选：Claude API
CLAUDE_API_KEY=sk-ant-your-claude-key-here

# ==================== 应用配置 ====================
DEBUG=false
FRONTEND_URL=http://your-domain.com
BACKEND_URL=http://your-domain.com/api

# ==================== CORS 配置 ====================
# 允许的前端域名列表
CORS_ORIGINS=["http://your-domain.com","https://your-domain.com"]

# ==================== 可选配置 ====================
# 日志级别
LOG_LEVEL=INFO

# AI 请求超时时间（秒）
AI_REQUEST_TIMEOUT=120
```

#### 2.3 创建前端配置文件

编辑 `/opt/1panel/apps/storyweaver/frontend/.env.local`：

```bash
# 后端 API 地址（必须与 OpenResty 配置一致）
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

⚠️ **重要提示**：
- 将 `your-domain.com` 替换为你的实际域名或服务器 IP
- 如果使用 IP，格式为：`http://123.45.67.89/api`
- 如果配置了 HTTPS，使用 `https://` 前缀

---

### 步骤三：修改 Docker Compose 配置（适配 1Panel）

编辑 `/opt/1panel/apps/storyweaver/docker-compose.yml`：

```yaml
version: '3.8'

services:
  # ==================== 后端服务 ====================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: storyweaver-backend
    restart: always
    ports:
      - "8000:8000"
    volumes:
      # 持久化数据库
      - ./backend/data:/app/data
      # 挂载环境变量文件
      - ./backend/.env:/app/.env:ro
    environment:
      - DATABASE_URL=sqlite:///./data/story.db
      - PYTHONUNBUFFERED=1
    networks:
      - storyweaver-network
    # 内存限制（2GB 服务器必须配置）
    mem_limit: 512m
    mem_reservation: 256m
    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ==================== 前端服务 ====================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: storyweaver-frontend
    restart: always
    ports:
      - "3000:3000"
    volumes:
      # 挂载环境变量文件
      - ./frontend/.env.local:/app/.env.local:ro
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - storyweaver-network
    # 内存限制
    mem_limit: 768m
    mem_reservation: 512m
    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

networks:
  storyweaver-network:
    driver: bridge
```

---

### 步骤四：部署 Docker 容器

#### 4.1 在 1Panel 中部署（推荐）

1. **打开 1Panel 面板** → **容器** → **编排**
2. **点击"创建编排"**：
   - 名称：`storyweaver`
   - 路径：选择 `/opt/1panel/apps/storyweaver/docker-compose.yml`
3. **点击"创建并启动"**
4. **等待构建完成**（首次构建约 5-10 分钟）

#### 4.2 通过 SSH 部署

```bash
cd /opt/1panel/apps/storyweaver

# 构建并启动容器
docker-compose up -d --build

# 查看容器状态
docker-compose ps

# 查看启动日志
docker-compose logs -f
```

**预期输出**：
```
NAME                     STATUS    PORTS
storyweaver-backend      Up        0.0.0.0:8000->8000/tcp
storyweaver-frontend     Up        0.0.0.0:3000->3000/tcp
```

#### 4.3 初始化数据库

```bash
# 进入后端容器
docker exec -it storyweaver-backend bash

# 运行数据库迁移
alembic upgrade head

# 查看当前版本
alembic current

# 退出容器
exit
```

**预期输出**：
```
INFO  [alembic.runtime.migration] Running upgrade -> base, Initial migration
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
```

---

### 步骤五：配置 OpenResty 反向代理

#### 5.1 在 1Panel 中创建网站

1. **打开 1Panel** → **网站** → **创建网站**
2. **填写信息**：
   - **域名**：`your-domain.com`（或服务器 IP）
   - **网站类型**：反向代理
   - **代理地址**：`http://127.0.0.1:3000`

#### 5.2 修改 OpenResty 配置

**网站** → **你的域名** → **配置文件**

完整配置如下：

```nginx
# ==================== 限流配置 ====================
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ai_limit:10m rate=1r/s;

# ==================== 后端负载均衡 ====================
upstream storyweaver_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

# ==================== 前端负载均衡 ====================
upstream storyweaver_frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# ==================== HTTP 服务器配置 ====================
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名

    # 客户端请求体大小限制
    client_max_body_size 10M;
    client_body_buffer_size 128k;

    # 日志配置
    access_log /www/wwwlogs/storyweaver-access.log;
    error_log /www/wwwlogs/storyweaver-error.log;

    # ==================== 前端代理 ====================
    location / {
        proxy_pass http://storyweaver_frontend;

        # WebSocket 支持（Next.js HMR）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 标准代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓存控制
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # ==================== 后端 API 代理 ====================
    location /api {
        # 一般 API 限流（每秒 10 次请求，突发 20 次）
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://storyweaver_backend;

        # 标准代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置（AI 生成需要较长时间）
        proxy_connect_timeout 10s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # ==================== AI 端点特殊限流 ====================
    location ~ ^/api/ai/(outline|continue|expand|character|branch) {
        # AI 接口严格限流（每秒 1 次请求，突发 3 次）
        limit_req zone=ai_limit burst=3 nodelay;

        proxy_pass http://storyweaver_backend;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # AI 生成可能需要很长时间
        proxy_connect_timeout 10s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;
    }

    # ==================== 健康检查端点（无限流） ====================
    location /api/health {
        proxy_pass http://storyweaver_backend;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        access_log off;  # 不记录健康检查日志
    }

    # ==================== 静态资源缓存 ====================
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://storyweaver_frontend;

        expires 30d;
        add_header Cache-Control "public, immutable";
        proxy_cache_bypass $http_pragma $http_authorization;
    }

    # ==================== Gzip 压缩 ====================
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    gzip_disable "MSIE [1-6]\.";
}
```

#### 5.3 测试并重载配置

在 1Panel 中：
- **保存配置** → 1Panel 会自动测试并重载

或通过 SSH：
```bash
# 测试配置语法
openresty -t

# 重载配置
systemctl reload openresty

# 查看状态
systemctl status openresty
```

---

### 步骤六：配置 SSL 证书（HTTPS）

#### 6.1 在 1Panel 中申请证书

1. **网站** → **你的域名** → **SSL 证书**
2. **选择证书来源**：
   - **Let's Encrypt**（免费，自动续期）✅ 推荐
   - 或上传已有证书
3. **填写信息**：
   - 域名：`your-domain.com`
   - 邮箱：你的邮箱
4. **点击"申请"**

1Panel 会自动：
- 配置 HTTPS
- 设置 HTTP 自动跳转 HTTPS
- 配置证书自动续期

#### 6.2 验证 HTTPS

浏览器访问：`https://your-domain.com`
- ✅ 应显示绿色锁图标
- ✅ 证书有效期 90 天
- ✅ HTTP 自动跳转到 HTTPS

---

### 步骤七：配置自动备份

#### 7.1 在 1Panel 中创建定时任务

1. **计划任务** → **创建任务**
2. **填写信息**：
   - **任务名称**：StoryWeaver 数据库备份
   - **任务类型**：Shell 脚本
   - **执行周期**：每天 3:00
   - **脚本内容**：

```bash
#!/bin/bash
# StoryWeaver 自动备份脚本

BACKUP_DIR="/opt/1panel/apps/storyweaver/backups"
DB_PATH="/opt/1panel/apps/storyweaver/backend/data/story.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/story_${DATE}.db.gz"
LOG_FILE="/var/log/storyweaver-backup.log"

# 记录开始时间
echo "========================================" >> "$LOG_FILE"
echo "Backup started at $(date)" >> "$LOG_FILE"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Error: Database not found at $DB_PATH" >> "$LOG_FILE"
    exit 1
fi

# SQLite 热备份（不锁表）
sqlite3 "$DB_PATH" ".backup /tmp/story_backup.db"

# 压缩备份
gzip -c /tmp/story_backup.db > "$BACKUP_FILE"
rm /tmp/story_backup.db

# 检查备份是否成功
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup successful: $BACKUP_FILE (Size: $BACKUP_SIZE)" >> "$LOG_FILE"
else
    echo "❌ Backup failed!" >> "$LOG_FILE"
    exit 1
fi

# 删除 7 天前的旧备份
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "story_*.db.gz" -mtime +7 | wc -l)
if [ "$OLD_BACKUPS" -gt 0 ]; then
    find "$BACKUP_DIR" -name "story_*.db.gz" -mtime +7 -delete
    echo "🗑️  Deleted $OLD_BACKUPS old backup(s)" >> "$LOG_FILE"
fi

# 统计备份数量
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/story_*.db.gz 2>/dev/null | wc -l)
echo "📊 Total backups: $TOTAL_BACKUPS" >> "$LOG_FILE"

echo "Backup completed at $(date)" >> "$LOG_FILE"
```

3. **保存并启用任务**

#### 7.2 手动测试备份

```bash
# 运行备份脚本
/opt/1panel/apps/storyweaver/backups/backup.sh

# 查看备份文件
ls -lh /opt/1panel/apps/storyweaver/backups/

# 查看日志
tail -f /var/log/storyweaver-backup.log
```

#### 7.3 恢复数据库

```bash
# 停止后端容器
docker-compose stop backend

# 解压备份文件
gunzip -c /opt/1panel/apps/storyweaver/backups/story_20250126_030000.db.gz > /tmp/restored.db

# 替换数据库
cp /opt/1panel/apps/storyweaver/backend/data/story.db /opt/1panel/apps/storyweaver/backend/data/story.db.old
cp /tmp/restored.db /opt/1panel/apps/storyweaver/backend/data/story.db

# 启动后端容器
docker-compose start backend
```

---

## 故障排查

### 问题 1：容器启动失败

#### 症状
- 1Panel 中容器显示红色状态
- `docker-compose ps` 显示容器退出

#### 排查步骤

**1. 查看容器日志**
```bash
# 在 1Panel 中
容器 → 容器列表 → 点击容器名 → 日志

# 或通过 SSH
docker logs storyweaver-backend
docker logs storyweaver-frontend
```

**2. 常见错误及解决方案**

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `Port 8000 already in use` | 端口被占用 | 修改 docker-compose.yml 中的端口映射 |
| `Cannot connect to database` | 数据库文件不存在 | 创建 `backend/data` 目录 |
| `OPENAI_API_KEY not set` | 环境变量未配置 | 检查 `.env` 文件 |
| `OOM killed` | 内存不足 | 启用 Swap，减少容器内存限制 |

**3. 重启容器**
```bash
# 在 1Panel 中
容器 → 编排 → storyweaver → 重启

# 或通过 SSH
docker-compose restart
```

---

### 问题 2：前端无法连接后端

#### 症状
- 前端页面加载，但登录/注册失败
- 浏览器控制台显示 `ERR_CONNECTION_REFUSED` 或 `404`

#### 排查步骤

**1. 检查后端健康状态**
```bash
# 在服务器上测试
curl http://127.0.0.1:8000/api/health

# 预期返回
{"status":"ok","version":"1.0.0"}
```

**2. 检查前端环境变量**
```bash
# 查看前端容器环境变量
docker exec storyweaver-frontend printenv | grep API_URL

# 应该显示
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

**3. 检查网络连通性**
```bash
# 进入前端容器
docker exec -it storyweaver-frontend sh

# 测试后端连接
wget -O- http://storyweaver-backend:8000/api/health
```

**4. 解决方案**
- ✅ 确保 `frontend/.env.local` 中的 `NEXT_PUBLIC_API_URL` 正确
- ✅ 确保 OpenResty 配置中的 `/api` 代理正确
- ✅ 重启前端容器：`docker-compose restart frontend`

---

### 问题 3：OpenResty 502 Bad Gateway

#### 症状
- 访问网站显示 502 错误
- OpenResty 错误日志显示 `upstream timeout`

#### 排查步骤

**1. 检查后端容器是否运行**
```bash
docker-compose ps backend

# 应该显示 Up (healthy)
```

**2. 测试后端直接访问**
```bash
curl http://127.0.0.1:8000/api/health
```

**3. 查看 OpenResty 错误日志**
```bash
tail -f /www/wwwlogs/storyweaver-error.log
```

**4. 常见原因及解决方案**

| 原因 | 解决方案 |
|------|----------|
| 后端容器未启动 | `docker-compose start backend` |
| 后端容器健康检查失败 | 查看后端日志，修复错误 |
| OpenResty 配置错误 | 检查 `upstream` 地址是否为 `127.0.0.1:8000` |
| 超时时间过短 | 增加 `proxy_read_timeout` 值 |

---

### 问题 4：AI 生成失败

#### 症状
- 点击"生成大纲"等按钮无响应或报错
- 后端日志显示 `OpenAI API error`

#### 排查步骤

**1. 检查 API 密钥**
```bash
# 进入后端容器
docker exec -it storyweaver-backend bash

# 查看环境变量
echo $OPENAI_API_KEY

# 测试 OpenAI 连接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**2. 查看后端日志**
```bash
docker logs storyweaver-backend | grep -i "ai\|openai\|error"
```

**3. 常见错误及解决方案**

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `Invalid API key` | API 密钥错误 | 检查 `.env` 中的 `OPENAI_API_KEY` |
| `Rate limit exceeded` | 超出限额 | 等待或升级 API 套餐 |
| `Timeout` | 网络问题或请求过慢 | 检查网络，增加超时时间 |
| `Model not found` | 模型名称错误 | 检查代码中的模型名称 |

---

### 问题 5：内存不足 (OOM)

#### 症状
- 容器自动退出
- `docker logs` 显示 `Killed` 或 `OOM`
- 系统日志 `dmesg` 显示内存不足

#### 排查步骤

**1. 查看内存使用情况**
```bash
# 查看系统内存
free -h

# 查看容器资源使用
docker stats
```

**2. 查看 OOM 日志**
```bash
dmesg | grep -i "oom\|killed"
```

**3. 解决方案**

**方案 A：启用 Swap（推荐）**
```bash
# 在 1Panel 中
主机 → 系统调优 → Swap → 启用（2GB）

# 或通过 SSH
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**方案 B：减少容器内存限制**

编辑 `docker-compose.yml`：
```yaml
services:
  backend:
    mem_limit: 400m        # 从 512m 减少到 400m
    mem_reservation: 200m  # 从 256m 减少到 200m

  frontend:
    mem_limit: 600m        # 从 768m 减少到 600m
    mem_reservation: 400m  # 从 512m 减少到 400m
```

**方案 C：减少 Worker 数量**

编辑 `backend/Dockerfile`，修改启动命令：
```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

---

## 性能优化

### 1. 启用 Swap（2GB 服务器必备）

#### 在 1Panel 中启用

**主机** → **系统调优** → **Swap**：
- ✅ 启用 Swap
- 大小：2GB
- Swappiness：10（推荐值）

#### 通过命令行启用

```bash
# 创建 2GB swap 文件
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 调整 swappiness（越小越少使用 swap）
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 验证
free -h
swapon --show
```

---

### 2. 优化 Docker 资源限制

#### 调整内存限制

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    # CPU 限制（1 核的 50%）
    cpus: '0.5'
    # 内存限制
    mem_limit: 512m        # 硬限制（超过会被 OOM Kill）
    mem_reservation: 256m  # 软限制（尽量保证）
    # CPU 权重（相对其他容器）
    cpu_shares: 512

  frontend:
    cpus: '1.0'
    mem_limit: 768m
    mem_reservation: 512m
    cpu_shares: 1024
```

#### 设置重启策略

```yaml
services:
  backend:
    restart: always  # 总是重启
    # 或更精细的配置
    restart: on-failure:5  # 失败时最多重启 5 次
```

---

### 3. 清理 Docker 缓存

#### 在 1Panel 中清理

**容器** → **清理** → **清理未使用的镜像和容器**

#### 通过命令行清理

```bash
# 清理所有未使用的资源
docker system prune -a --volumes

# 只清理镜像
docker image prune -a

# 只清理容器
docker container prune

# 查看磁盘使用情况
docker system df
```

---

### 4. 优化 OpenResty 配置

#### 连接池优化

```nginx
upstream storyweaver_backend {
    server 127.0.0.1:8000;
    keepalive 32;           # 连接池大小
    keepalive_requests 100; # 每个连接最多处理 100 个请求
    keepalive_timeout 60s;  # 连接超时时间
}
```

#### 缓存静态资源

```nginx
# 静态资源缓存配置
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    proxy_pass http://storyweaver_frontend;

    # 缓存 30 天
    expires 30d;
    add_header Cache-Control "public, immutable";

    # 压缩
    gzip_static on;
}
```

#### 启用 HTTP/2（需要 HTTPS）

1Panel SSL 配置后会自动启用，或手动添加：

```nginx
server {
    listen 443 ssl http2;  # 启用 HTTP/2
    # ...
}
```

---

### 5. 数据库优化

#### SQLite 性能调优

编辑 `backend/app/database.py`，添加连接参数：

```python
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        # SQLite 性能优化参数
        "timeout": 30,
        "isolation_level": "DEFERRED",
    },
    # 连接池配置
    poolclass=StaticPool,  # 生产环境可改为 QueuePool
    pool_pre_ping=True,
    pool_recycle=3600,
)
```

#### 定期清理日志

```bash
# 创建日志清理脚本
cat > /usr/local/bin/clean-logs.sh << 'EOF'
#!/bin/bash
# 清理超过 7 天的日志
find /www/wwwlogs/ -name "*.log" -mtime +7 -exec truncate -s 0 {} \;
echo "Logs cleaned at $(date)"
EOF

chmod +x /usr/local/bin/clean-logs.sh

# 添加到 crontab（每周执行）
echo "0 2 * * 0 /usr/local/bin/clean-logs.sh" | crontab -
```

---

## 维护指南

### 日常维护检查清单

#### 每日检查
- [ ] 容器运行状态（1Panel → 容器列表）
- [ ] 磁盘空间使用情况（`df -h`）
- [ ] 访问网站测试功能

#### 每周检查
- [ ] 查看错误日志（OpenResty + Docker）
- [ ] 检查备份文件数量
- [ ] 查看资源使用情况（`docker stats`）

#### 每月检查
- [ ] 更新 Docker 镜像（`docker-compose pull && docker-compose up -d`）
- [ ] 检查 SSL 证书有效期（1Panel 自动续期）
- [ ] 清理 Docker 缓存（`docker system prune`）
- [ ] 测试数据库恢复流程

---

### 更新应用

#### 拉取最新代码

```bash
cd /opt/1panel/apps/storyweaver

# 备份当前版本
cp -r backend backend.bak.$(date +%Y%m%d)
cp -r frontend frontend.bak.$(date +%Y%m%d)

# 拉取更新
git pull origin main

# 查看变更
git log -5 --oneline
```

#### 重新构建容器

```bash
# 停止容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 运行数据库迁移（如果有新迁移）
docker exec -it storyweaver-backend alembic upgrade head

# 查看容器状态
docker-compose ps
```

---

### 监控脚本

#### 创建监控脚本

```bash
cat > /usr/local/bin/monitor-storyweaver.sh << 'EOF'
#!/bin/bash
# StoryWeaver 健康监控脚本

echo "=========================================="
echo "StoryWeaver Health Check - $(date)"
echo "=========================================="

# 1. 检查容器状态
echo -e "\n📦 Docker Containers:"
docker-compose -f /opt/1panel/apps/storyweaver/docker-compose.yml ps

# 2. 检查系统资源
echo -e "\n💾 System Resources:"
echo "Memory:"
free -h | grep -E "Mem|Swap"
echo "Disk:"
df -h / | tail -1

# 3. 检查服务健康
echo -e "\n🏥 Service Health:"

# 后端健康检查
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend: UP (HTTP $BACKEND_STATUS)"
else
    echo "❌ Backend: DOWN (HTTP $BACKEND_STATUS)"
fi

# 前端健康检查
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend: UP (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend: DOWN (HTTP $FRONTEND_STATUS)"
fi

# 4. 检查最近错误
echo -e "\n⚠️  Recent Errors (last 10):"
tail -10 /www/wwwlogs/storyweaver-error.log 2>/dev/null || echo "No errors found"

# 5. 检查备份状态
echo -e "\n💾 Backup Status:"
BACKUP_COUNT=$(ls -1 /opt/1panel/apps/storyweaver/backups/story_*.db.gz 2>/dev/null | wc -l)
LATEST_BACKUP=$(ls -t /opt/1panel/apps/storyweaver/backups/story_*.db.gz 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    echo "Total backups: $BACKUP_COUNT"
    echo "Latest backup: $(basename $LATEST_BACKUP) ($(stat -c%y "$LATEST_BACKUP" | cut -d' ' -f1))"
else
    echo "⚠️  No backups found!"
fi

echo -e "\n=========================================="
EOF

chmod +x /usr/local/bin/monitor-storyweaver.sh
```

#### 设置定期监控

在 1Panel 中：
**计划任务** → **创建任务**：
- 任务名称：StoryWeaver 健康监控
- 执行周期：每小时
- 脚本：`/usr/local/bin/monitor-storyweaver.sh`

或添加到 crontab：
```bash
# 每小时执行一次
0 * * * * /usr/local/bin/monitor-storyweaver.sh >> /var/log/storyweaver-monitor.log 2>&1
```

---

### 查看日志

#### 容器日志

```bash
# 实时查看后端日志
docker logs -f storyweaver-backend

# 实时查看前端日志
docker logs -f storyweaver-frontend

# 查看最近 100 行
docker logs --tail 100 storyweaver-backend

# 查看特定时间段
docker logs --since "2025-01-26T10:00:00" storyweaver-backend
```

#### OpenResty 日志

```bash
# 访问日志
tail -f /www/wwwlogs/storyweaver-access.log

# 错误日志
tail -f /www/wwwlogs/storyweaver-error.log

# 搜索特定错误
grep -i "error\|500\|502" /www/wwwlogs/storyweaver-error.log | tail -20
```

#### 系统日志

```bash
# 查看 Docker 服务日志
journalctl -u docker -f

# 查看 OpenResty 服务日志
journalctl -u openresty -f
```

---

## 部署后检查清单 ✅

完成部署后，请逐项检查：

### 容器运行状态
- [ ] `storyweaver-backend` 容器状态为 `Up (healthy)`
- [ ] `storyweaver-frontend` 容器状态为 `Up (healthy)`
- [ ] 查看日志无明显错误

### 数据库
- [ ] 数据库文件存在：`backend/data/story.db`
- [ ] 数据库迁移完成：`alembic current` 显示最新版本
- [ ] 数据库可读写（注册测试用户）

### 网络访问
- [ ] 前端可访问：`http://your-domain.com`
- [ ] 后端 API 可访问：`http://your-domain.com/api/docs`
- [ ] 健康检查正常：`curl http://your-domain.com/api/health`

### HTTPS 配置
- [ ] SSL 证书已配置
- [ ] 浏览器显示绿色锁图标
- [ ] HTTP 自动跳转到 HTTPS
- [ ] 证书有效期正常（90 天内）

### 功能测试
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 创建小说功能正常
- [ ] AI 生成功能正常（生成大纲）
- [ ] 富文本编辑器正常

### 安全配置
- [ ] `JWT_SECRET_KEY` 已修改（不是默认值）
- [ ] OpenResty 限流配置生效
- [ ] CORS 配置正确
- [ ] 防火墙规则正确（只开放 80/443/22）

### 备份与监控
- [ ] 自动备份任务已创建
- [ ] 备份脚本测试成功
- [ ] 监控脚本已部署（可选）
- [ ] Swap 已启用（2GB 服务器必须）

---

## 快速参考

### 常用命令

```bash
# ==================== 容器管理 ====================
# 启动所有服务
cd /opt/1panel/apps/storyweaver && docker-compose up -d

# 停止所有服务
docker-compose stop

# 重启所有服务
docker-compose restart

# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs -f

# 进入容器
docker exec -it storyweaver-backend bash

# ==================== 数据库管理 ====================
# 运行迁移
docker exec -it storyweaver-backend alembic upgrade head

# 查看当前版本
docker exec -it storyweaver-backend alembic current

# 手动备份
docker exec storyweaver-backend sqlite3 /app/data/story.db ".backup /tmp/backup.db"

# ==================== OpenResty 管理 ====================
# 测试配置
openresty -t

# 重载配置
systemctl reload openresty

# 查看状态
systemctl status openresty

# 查看日志
tail -f /www/wwwlogs/storyweaver-error.log

# ==================== 系统维护 ====================
# 查看资源使用
docker stats

# 查看内存
free -h

# 查看磁盘
df -h

# 清理 Docker
docker system prune -a
```

---

### 重要文件路径

| 文件/目录 | 路径 |
|----------|------|
| 项目根目录 | `/opt/1panel/apps/storyweaver/` |
| 后端配置文件 | `/opt/1panel/apps/storyweaver/backend/.env` |
| 前端配置文件 | `/opt/1panel/apps/storyweaver/frontend/.env.local` |
| Docker Compose | `/opt/1panel/apps/storyweaver/docker-compose.yml` |
| 数据库文件 | `/opt/1panel/apps/storyweaver/backend/data/story.db` |
| 备份目录 | `/opt/1panel/apps/storyweaver/backups/` |
| OpenResty 配置 | `/www/server/panel/vhost/nginx/*.conf` |
| OpenResty 日志 | `/www/wwwlogs/storyweaver-*.log` |

---

### 联系方式

| 项目 | 地址 |
|------|------|
| **GitHub** | https://github.com/adamllll/StoryWeaver |
| **Issues** | https://github.com/adamllll/StoryWeaver/issues |

---

## 附录

### A. 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | OpenResty | HTTP 入口（生产环境） |
| 443 | OpenResty | HTTPS 入口（生产环境） |
| 3000 | Frontend | Next.js 开发服务器 |
| 8000 | Backend | FastAPI 应用 |
| 8888 | 1Panel | 管理面板（默认） |

### B. 环境变量完整列表

#### 后端环境变量 (backend/.env)

```bash
# 数据库
DATABASE_URL=sqlite:///./data/story.db

# JWT 认证
JWT_SECRET_KEY=<生成的密钥>
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# AI 服务
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1
CLAUDE_API_KEY=sk-ant-...

# 应用配置
DEBUG=false
FRONTEND_URL=http://your-domain.com
BACKEND_URL=http://your-domain.com/api

# CORS
CORS_ORIGINS=["http://your-domain.com","https://your-domain.com"]

# 可选配置
LOG_LEVEL=INFO
AI_REQUEST_TIMEOUT=120
```

#### 前端环境变量 (frontend/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

### C. Docker Compose 完整配置

参见[步骤三](#步骤三修改-docker-compose-配置适配-1panel)

### D. 安全加固建议

1. **修改默认端口**：
   - 1Panel 默认端口从 8888 改为其他
   - SSH 端口从 22 改为其他

2. **配置防火墙**：
   ```bash
   # 只开放必要端口
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **启用 Fail2ban**：
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **定期更新系统**：
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

**文档版本**: v1.0.0
**最后更新**: 2025-12-26
**适用版本**: StoryWeaver 1.0.0

🤖 本文档由 Claude Sonnet 4.5 生成
