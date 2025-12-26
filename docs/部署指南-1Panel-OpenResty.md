# StoryWeaver 部署指南 - 1Panel 专用版

> **本指南完全基于 1Panel 界面操作，无需使用命令行！**

## 📋 目录

- [部署架构](#部署架构)
- [环境要求](#环境要求)
- [快速部署（推荐）](#快速部署推荐)
- [故障排查](#故障排查)
- [维护指南](#维护指南)

---

## 部署架构

```
用户请求
   ↓
OpenResty (反向代理, 80/443)
   ↓
   ├─→ Frontend 容器 (3000)
   └─→ Backend 容器 (8000)
```

**技术栈**：
- **前端**: Next.js 14 + Docker
- **后端**: FastAPI + Docker
- **数据库**: SQLite (持久化卷)
- **反向代理**: OpenResty (1Panel 管理)
- **容器管理**: 1Panel 编排

---

## 环境要求

### 服务器配置

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 2核+ |
| 内存 | 2GB | 4GB+ |
| 硬盘 | 10GB | 20GB+ |

### 软件要求

- ✅ 1Panel 面板（已安装）
- ✅ OpenResty（已安装）
- ✅ Docker（1Panel 自动安装）

**验证方式**：
1. 打开 1Panel 面板
2. 侧边栏 → **容器** → 如果能看到 Docker 信息，说明已安装

---

## 快速部署（推荐）

### 步骤 1：准备项目文件

#### 1.1 下载项目

**方式一：直接下载 ZIP**
1. 访问 https://github.com/adamllll/StoryWeaver
2. 点击 **Code** → **Download ZIP**
3. 解压到本地

**方式二：Git Clone（如果本地有 Git）**
```bash
git clone https://github.com/adamllll/StoryWeaver.git
cd StoryWeaver
```

#### 1.2 上传到服务器

1. **1Panel** → **文件** → **创建目录**
   - 路径：`/opt/1panel/apps/`
   - 目录名：`storyweaver`

2. **进入目录** → **上传**
   - 上传整个项目文件夹
   - 或上传 ZIP 后点击 **解压**

---

### 步骤 2：配置环境变量

#### 2.1 生成 JWT 密钥

1. **1Panel** → **主机** → **终端**
2. 输入命令（生成随机密钥）：
   ```bash
   openssl rand -hex 32
   ```
3. **复制输出的密钥**（类似：`a3f8b2c9...`）

#### 2.2 创建后端配置

1. **1Panel** → **文件** → 导航到 `/opt/1panel/apps/storyweaver/backend/`
2. **新建文件** → 文件名：`.env`
3. 粘贴以下内容（**替换标记的值**）：

```bash
# ==================== 数据库配置 ====================
DATABASE_URL=sqlite:///./data/story.db

# ==================== JWT 配置 ====================
# ⚠️ 必须替换！使用刚才生成的密钥
JWT_SECRET_KEY=你刚才生成的密钥

# ==================== AI 服务配置 ====================
# ⚠️ 必须替换！你的 OpenAI API Key
OPENAI_API_KEY=sk-your-openai-key
OPENAI_API_BASE=https://api.openai.com/v1

# 可选：Claude API
# CLAUDE_API_KEY=sk-ant-your-claude-key

# ==================== 应用配置 ====================
DEBUG=false
# ⚠️ 替换为你的域名或 IP
FRONTEND_URL=http://你的域名或IP
BACKEND_URL=http://你的域名或IP/api

# ==================== CORS 配置 ====================
CORS_ORIGINS=["http://你的域名或IP","https://你的域名或IP"]
```

#### 2.3 创建前端配置

1. **1Panel** → **文件** → 导航到 `/opt/1panel/apps/storyweaver/frontend/`
2. **新建文件** → 文件名：`.env.local`
3. 粘贴以下内容（**替换域名/IP**）：

```bash
# ⚠️ 替换为你的域名或 IP
NEXT_PUBLIC_API_URL=http://你的域名或IP/api
```

**🔑 配置示例（IP 模式）**：
```bash
# 如果你的服务器 IP 是 123.45.67.89
FRONTEND_URL=http://123.45.67.89
BACKEND_URL=http://123.45.67.89/api
NEXT_PUBLIC_API_URL=http://123.45.67.89/api
CORS_ORIGINS=["http://123.45.67.89"]
```

---

### 步骤 3：创建 Docker Compose 编排

#### 3.1 创建编排文件

1. **1Panel** → **容器** → **编排**
2. 点击 **创建编排**
3. 填写以下信息：

**编排名称**：`storyweaver`

**工作目录**：`/opt/1panel/apps/storyweaver`

**docker-compose.yml 内容**：

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
      # 挂载环境变量
      - ./backend/.env:/app/.env:ro
    environment:
      - DATABASE_URL=sqlite:///./data/story.db
      - PYTHONUNBUFFERED=1
    networks:
      - storyweaver-network
    # 内存限制（2GB 服务器必须配置）
    mem_limit: 512m
    mem_reservation: 256m
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
      # 挂载环境变量
      - ./frontend/.env.local:/app/.env.local:ro
    depends_on:
      - backend
    networks:
      - storyweaver-network
    # 内存限制
    mem_limit: 768m
    mem_reservation: 512m
    environment:
      - NODE_ENV=production

networks:
  storyweaver-network:
    driver: bridge
```

4. 点击 **确定** 创建编排

---

### 步骤 4：启动容器

#### 4.1 构建并启动

1. **1Panel** → **容器** → **编排** → 找到 `storyweaver`
2. 点击 **操作** → **启动**

**⏱️ 首次启动需要 3-5 分钟**（构建镜像需要时间）

#### 4.2 查看构建进度

1. 点击 **日志** 按钮
2. 查看构建输出（会显示 npm install、npm build 等）

#### 4.3 验证启动状态

1. **容器** → **容器列表**
2. 确认两个容器都显示 **运行中**（绿色）：
   - `storyweaver-backend`
   - `storyweaver-frontend`

---

### 步骤 5：配置 OpenResty 反向代理

#### 5.1 创建网站

1. **1Panel** → **网站** → **创建网站**
2. **网站类型**：反向代理
3. 填写配置：

| 配置项 | 值 |
|--------|-----|
| **域名** | 你的域名（或 `_` 使用IP访问） |
| **代理地址** | `http://127.0.0.1:3000` |
| **SSL** | 如需HTTPS，选择证书 |

4. 点击 **确定** 创建

#### 5.2 添加 API 路由

1. **网站列表** → 找到刚创建的网站 → **配置**
2. 在 `location /` 块**前面**添加以下内容：

```nginx
# API 请求转发到后端
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 超时配置（AI 生成需要更长时间）
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

3. 点击 **保存**
4. 点击 **重载配置**

---

### 步骤 6：访问应用

打开浏览器访问：
- **使用域名**：`http://你的域名`
- **使用 IP**：`http://你的服务器IP`

**✅ 看到登录页面说明部署成功！**

---

## 故障排查

### 问题 1：Docker 构建失败

#### 症状
- 编排启动时报错：`Cannot find module 'autoprefixer'`
- 或报错：`"/app/public": not found`

#### 原因分析
1. **前端缺少 devDependencies**：Dockerfile builder 阶段需要完整依赖才能构建
2. **public 目录不存在**：Next.js standalone 模式需要 public 目录

#### 解决方案

**方案 A：确保使用最新代码**
1. **1Panel** → **文件** → 删除旧的项目目录
2. 重新下载最新代码（2025-12-26 之后的版本已修复）
3. 重新上传并启动

**方案 B：手动修复（如果用的旧代码）**

1. **检查 frontend/Dockerfile**，确保 builder 阶段是：
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci  # ✅ 不要用 --only=production！
COPY . .
RUN npm run build
```

2. **创建 public 目录**：
   - **1Panel** → **文件** → 导航到 `/opt/1panel/apps/storyweaver/frontend/`
   - **创建目录** → 名称：`public`
   - 进入 public 目录 → **新建文件** → `.gitkeep`（内容留空）

3. **创建 .dockerignore**（优化构建速度）：
   - **1Panel** → **文件** → 导航到 `/opt/1panel/apps/storyweaver/frontend/`
   - **新建文件** → 名称：`.dockerignore`
   - 内容：
```
node_modules
.next
out
.env*.local
.git
```

4. **重新构建**：
   - **容器** → **编排** → `storyweaver` → **重建**

---

### 问题 2：容器启动失败

#### 症状
- 容器显示红色或灰色状态
- 编排页面显示 "已停止"

#### 排查步骤

**1. 查看容器日志**
1. **容器** → **容器列表** → 点击容器名
2. 点击 **日志** 按钮
3. 查看最后的错误信息

**2. 常见错误及解决**

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `Port 8000 already in use` | 端口被占用 | 修改编排文件中的端口映射 |
| `Cannot connect to database` | 数据目录不存在 | 创建 `backend/data` 目录 |
| `OPENAI_API_KEY not set` | 环境变量未配置 | 检查 `.env` 文件 |
| `OOM killed` | 内存不足 | [启用 Swap](#启用-swap2gb-服务器必备) |

**3. 重启容器**
1. **容器** → **编排** → `storyweaver`
2. 点击 **重启**

---

### 问题 3：前端无法连接后端

#### 症状
- 前端页面加载，但登录/注册失败
- 浏览器控制台显示 `404` 或 `CORS error`

#### 排查步骤

**1. 检查后端健康状态**

使用 **1Panel 主机终端**：
```bash
curl http://127.0.0.1:8000/api/health
```

预期返回：
```json
{"status":"ok","version":"1.0.0"}
```

**2. 检查环境变量**

1. **文件** → 打开 `frontend/.env.local`
2. 确认 `NEXT_PUBLIC_API_URL` 与实际访问地址一致

**3. 检查 OpenResty 配置**

1. **网站** → 你的网站 → **配置**
2. 确认有 `/api/` 的 location 块
3. 确认代理地址是 `http://127.0.0.1:8000`

---

### 问题 4：OpenResty 502 Bad Gateway

#### 症状
- 访问网站显示 "502 Bad Gateway"

#### 原因分析
1. 后端容器未启动
2. 代理地址配置错误
3. 容器网络问题

#### 解决方案

**1. 确认容器状态**
1. **容器** → **容器列表**
2. 确认 `storyweaver-backend` 和 `storyweaver-frontend` 都是**运行中**

**2. 检查代理配置**
1. **网站** → **配置** → 确认代理地址：
   - 主页面：`http://127.0.0.1:3000`
   - API：`http://127.0.0.1:8000`

**3. 检查容器端口**
1. **容器** → **容器列表** → 点击 `storyweaver-frontend`
2. 确认端口映射：`0.0.0.0:3000->3000/tcp`
3. 对 backend 容器检查：`0.0.0.0:8000->8000/tcp`

---

### 问题 5：内存不足 (OOM Killed)

#### 症状
- 容器频繁重启
- 日志显示 `killed` 或 `signal 9`

#### 解决方案

#### 启用 Swap（2GB 服务器必备）

1. **1Panel** → **主机** → **系统调优** → **Swap**
2. 配置：
   - ✅ **启用 Swap**
   - **大小**：`2048 MB`（2GB）
   - **Swappiness**：`10`（推荐值）
3. 点击 **应用**

#### 调整容器内存限制

如果启用 Swap 后仍 OOM，编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    mem_limit: 400m        # 从 512m 减少
    mem_reservation: 200m  # 从 256m 减少

  frontend:
    mem_limit: 600m        # 从 768m 减少
    mem_reservation: 400m  # 从 512m 减少
```

重新启动编排。

---

## 维护指南

### 查看容器状态

1. **容器** → **容器列表**
2. 查看 CPU、内存使用情况

### 查看日志

1. **容器** → **容器列表** → 点击容器名
2. 点击 **日志** 按钮
3. 可以选择时间范围和日志级别

### 备份数据库

1. **文件** → 导航到 `/opt/1panel/apps/storyweaver/backend/data/`
2. 右键 `story.db` → **下载**
3. 保存到本地

**建议**：每周备份一次

### 更新应用

#### 方式一：重新部署（推荐）
1. **容器** → **编排** → `storyweaver` → **停止**
2. **文件** → 删除旧项目目录
3. 上传新版本代码
4. **编排** → **启动**

#### 方式二：Git Pull（如果用 Git）
1. **主机** → **终端**
2. 执行：
```bash
cd /opt/1panel/apps/storyweaver
git pull
```
3. **容器** → **编排** → **重建**

### 清理资源

**清理未使用的镜像**：
1. **容器** → **镜像**
2. 选择 `<none>` 标签的镜像
3. 点击 **删除**

**查看磁盘使用**：
1. **主机** → **监控**
2. 查看磁盘使用情况

---

## 常见问题 FAQ

### Q1：可以只用 IP 访问吗？
**A**：可以！在 OpenResty 配置时，域名填 `_` 即可用 IP 访问。

### Q2：构建时间太长怎么办？
**A**：首次构建需 3-5 分钟（下载依赖、编译），这是正常的。后续更新会快很多（使用缓存）。

### Q3：需要配置防火墙吗？
**A**：需要开放以下端口：
- `80` (HTTP)
- `443` (HTTPS，如果用SSL)

1Panel 通常会自动配置，如果无法访问，检查：**主机** → **防火墙**

### Q4：如何启用 HTTPS？
**A**：
1. **网站** → 你的网站 → **配置** → **SSL**
2. 选择证书来源（Let's Encrypt 自动申请 或 自有证书）
3. 启用 **强制 HTTPS**

### Q5：忘记 JWT 密钥怎么办？
**A**：
1. 生成新密钥：`openssl rand -hex 32`（在主机终端）
2. 更新 `backend/.env` 中的 `JWT_SECRET_KEY`
3. 重启后端容器

⚠️ **注意**：更换密钥后所有用户需重新登录！

---

**最后更新**: 2025-12-26
**项目版本**: 1.0.0
**维护者**: Course Project Team

如有问题，请提交 Issue：https://github.com/adamllll/StoryWeaver/issues
