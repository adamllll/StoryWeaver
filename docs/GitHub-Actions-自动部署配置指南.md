# GitHub Actions 自动部署配置指南

> 本指南教你如何配置 GitHub Secrets，实现推送代码后自动部署到服务器（1Panel 环境）

## 📋 前置要求

- ✅ 服务器已安装 1Panel
- ✅ 项目已部署在 `/opt/1panel/apps/storyweaver/`（参考部署指南）
- ✅ 服务器可以通过 SSH 连接
- ✅ 服务器上已配置 Git（可以 `git pull`）

---

## 步骤 1：获取 SSH 私钥

### 方式一：生成新的 SSH 密钥（推荐）

#### 1.1 在本地生成密钥

```bash
ssh-keygen -t ed25519 -C "github-actions@storyweaver" -f ~/.ssh/storyweaver_deploy
```

**不要设置密码**（直接回车），否则 GitHub Actions 无法使用。

#### 1.2 查看私钥

```bash
cat ~/.ssh/storyweaver_deploy
```

**复制完整输出**（包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）

#### 1.3 将公钥添加到服务器

```bash
# 查看公钥
cat ~/.ssh/storyweaver_deploy.pub

# SSH 连接到服务器
ssh root@你的服务器IP

# 添加公钥到授权文件
echo "你的公钥内容" >> ~/.ssh/authorized_keys

# 设置权限
chmod 600 ~/.ssh/authorized_keys
```

#### 1.4 测试连接

```bash
ssh -i ~/.ssh/storyweaver_deploy root@你的服务器IP
```

如果能直接登录（不需要密码），说明配置成功！

---

### 方式二：使用现有密钥

如果你已经可以通过 SSH 密钥登录服务器，可以直接使用现有私钥。

#### 2.1 找到现有私钥

```bash
# 通常在这些位置
ls -la ~/.ssh/

# 常见的密钥文件
~/.ssh/id_rsa          # RSA 密钥（旧格式）
~/.ssh/id_ed25519      # ED25519 密钥（新格式，推荐）
~/.ssh/id_ecdsa        # ECDSA 密钥
```

#### 2.2 查看私钥内容

```bash
cat ~/.ssh/id_ed25519  # 或你的密钥文件名
```

**⚠️ 重要**：私钥必须是**未加密**的（生成时没有设置 passphrase），否则 GitHub Actions 无法使用。

如果你的密钥有密码保护，需要生成新的无密码密钥（参考方式一）。

---

## 步骤 2：配置 GitHub Secrets

### 2.1 进入仓库设置

1. 打开你的 GitHub 仓库：https://github.com/adamllll/StoryWeaver
2. 点击 **Settings**（设置）
3. 左侧菜单 → **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

---

### 2.2 添加必需的 Secrets

#### Secret 1: `SERVER_HOST`

- **Name（名称）**：`SERVER_HOST`
- **Value（值）**：你的服务器 IP 或域名
- **示例**：`123.45.67.89` 或 `example.com`

点击 **Add secret**

---

#### Secret 2: `SERVER_USER`

- **Name（名称）**：`SERVER_USER`
- **Value（值）**：SSH 用户名
- **示例**：`root`（1Panel 通常使用 root）

点击 **Add secret**

---

#### Secret 3: `SERVER_SSH_KEY`

- **Name（名称）**：`SERVER_SSH_KEY`
- **Value（值）**：**完整的 SSH 私钥内容**

**⚠️ 重要格式要求**：
- 必须包含头尾标记：`-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`
- 保持原始换行（不要删除空格或换行符）

**正确示例**：
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDGvVcrXaEg3GqLbQqVLG+9S4WVd0JcEzHFkYlKb1Y7wQAAAJjqF8Ke6hfC
...（中间省略）...
ZC5jb20AAAAAAQID
-----END OPENSSH PRIVATE KEY-----
```

点击 **Add secret**

---

#### Secret 4: `SERVER_PORT`（可选）

- **Name（名称）**：`SERVER_PORT`
- **Value（值）**：SSH 端口
- **默认值**：`22`
- **仅在修改过 SSH 端口时需要配置**

点击 **Add secret**

---

### 2.3 验证配置

所有 Secrets 配置完成后，你应该看到：

```
SERVER_HOST       ✅ Updated 刚刚
SERVER_USER       ✅ Updated 刚刚
SERVER_SSH_KEY    ✅ Updated 刚刚
SERVER_PORT       ✅ Updated 刚刚 （可选）
```

---

## 步骤 3：准备服务器环境

### 3.1 确保项目已部署

在服务器上执行：

```bash
# 检查项目目录是否存在
ls -la /opt/1panel/apps/storyweaver/

# 应该看到
drwxr-xr-x  backend/
drwxr-xr-x  frontend/
-rw-r--r--  docker-compose.yml
-rw-r--r--  README.md
...
```

**如果目录不存在**，参考 [部署指南-1Panel-OpenResty.md](部署指南-1Panel-OpenResty.md) 完成首次部署。

---

### 3.2 配置 Git 仓库

```bash
# 进入项目目录
cd /opt/1panel/apps/storyweaver/

# 检查 Git 状态
git status

# 如果不是 Git 仓库，初始化
git init
git remote add origin https://github.com/adamllll/StoryWeaver.git
git fetch
git checkout main

# 确保在 main 分支
git branch
```

---

## 步骤 4：测试自动部署

### 4.1 触发部署

在本地修改代码后：

```bash
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

### 4.2 查看部署进度

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 找到最新的 workflow 运行
4. 点击进入查看详细日志

**部署流程**：
1. ✅ Backend Tests（后端测试）
2. ✅ Frontend Tests（前端测试）
3. ✅ Build Docker Images（Docker 构建）
4. ✅ Deploy to Production (1Panel)（部署到服务器）

### 4.3 查看部署日志

在 **Deploy to Production (1Panel)** 步骤中，可以看到：

```
=== 容器状态 ===
NAME                    STATUS    PORTS
storyweaver-backend     Up        0.0.0.0:8000->8000/tcp
storyweaver-frontend    Up        0.0.0.0:3000->3000/tcp

=== 后端日志 ===
[最后 20 行后端日志]

=== 前端日志 ===
[最后 20 行前端日志]

✅ 部署完成于 2025-12-26 14:30:00
```

---

## 常见问题排查

### ❌ 错误：`Permission denied (publickey)`

**原因**：SSH 公钥未正确添加到服务器

**解决**：
1. 检查公钥是否在服务器的 `~/.ssh/authorized_keys` 中
2. 检查权限：`chmod 600 ~/.ssh/authorized_keys`
3. 重启 SSH 服务：`systemctl restart sshd`

---

### ❌ 错误：`git pull failed`

**原因**：服务器上的 Git 仓库配置有问题

**解决**：
```bash
cd /opt/1panel/apps/storyweaver/
git status
git remote -v  # 检查远程仓库
git pull origin main --rebase  # 手动拉取
```

---

### ❌ 错误：`docker compose: command not found`

**原因**：服务器未安装 Docker Compose V2

**解决**：
```bash
# 检查 Docker Compose 版本
docker compose version

# 如果是旧版本（docker-compose），更新到 V2
# 1Panel 默认已包含 Docker Compose V2
```

---

### ❌ 错误：`OOM killed` 或容器启动失败

**原因**：内存不足

**解决**：
1. **1Panel** → **主机** → **系统调优** → **Swap** → 启用 2GB
2. 参考 [部署指南](部署指南-1Panel-OpenResty.md) 的 "问题 5：内存不足" 章节

---

## 自动部署工作流程

```
本地提交代码
    ↓
git push origin main
    ↓
GitHub Actions 触发
    ↓
1. 运行后端测试
2. 运行前端测试
3. 构建 Docker 镜像
    ↓
所有测试通过？
    ↓ 是
SSH 连接到服务器
    ↓
cd /opt/1panel/apps/storyweaver
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
    ↓
部署完成！
```

---

## 安全建议

### ✅ 推荐做法

1. **使用独立的部署密钥**：不要用个人 SSH 密钥
2. **限制密钥权限**：在服务器上只给必要的权限
3. **定期轮换密钥**：每 3-6 个月更换一次
4. **使用 GitHub Environment**：为 production 环境添加保护规则

### ⚠️ 不推荐做法

1. ❌ 使用带密码的 SSH 密钥（GitHub Actions 无法输入密码）
2. ❌ 把私钥提交到代码仓库（泄露风险极高！）
3. ❌ 使用服务器 root 密码（安全性差）

---

## 禁用自动部署

如果暂时不需要自动部署：

### 方式一：禁用 deploy job

编辑 `.github/workflows/ci.yml`，在 `deploy` job 开头添加：

```yaml
deploy:
  if: false  # 禁用此 job
  name: Deploy to Production (1Panel)
  ...
```

### 方式二：删除 Secrets

在 GitHub 仓库设置中删除所有 `SERVER_*` secrets，deploy job 会自动跳过。

---

## 进阶配置

### 仅在标签发布时部署

修改 `.github/workflows/ci.yml` 的触发条件：

```yaml
on:
  push:
    tags:
      - 'v*'  # 仅在推送 v1.0.0 这样的标签时部署
```

### 添加部署通知

在 deploy job 后添加：

```yaml
- name: Send notification
  if: always()
  run: |
    curl -X POST "你的通知 Webhook URL" \
      -d "部署状态: ${{ job.status }}"
```

---

**最后更新**: 2025-12-26
**适用版本**: 1.0.0

有问题？提交 Issue：https://github.com/adamllll/StoryWeaver/issues
