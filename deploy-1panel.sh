#!/bin/bash
#############################################
# StoryWeaver 一键部署脚本 - 1Panel 专用版
# 版本：2.0.0 - 稳定版
#############################################

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root
if [ "$EUID" -ne 0 ]; then
    log_error "请用 root 运行: sudo bash deploy-1panel.sh"
    exit 1
fi

# 检查命令
for cmd in docker git openssl; do
    if ! command -v $cmd &> /dev/null; then
        log_error "缺少命令: $cmd，请先安装 1Panel"
        exit 1
    fi
done
log_success "环境检查通过"

# 测试 SSH（不影响脚本退出）
log_info "测试 GitHub SSH..."
ssh_test=$(ssh -T git@github.com 2>&1 || true)
if echo "$ssh_test" | grep -q "successfully authenticated"; then
    log_success "SSH 认证成功"
else
    log_error "SSH 认证失败！请先配置："
    echo ""
    echo "  1. cat > ~/.ssh/config << 'EOF'"
    echo "     Host github.com"
    echo "         HostName github.com"
    echo "         User git"
    echo "         IdentityFile ~/.ssh/你的私钥"
    echo "         IdentitiesOnly yes"
    echo "     EOF"
    echo ""
    echo "  2. chmod 600 ~/.ssh/config ~/.ssh/你的私钥"
    echo "  3. 公钥添加到: https://github.com/settings/keys"
    echo ""
    exit 1
fi

# 部署路径
DEPLOY_PATH="/opt/1panel/apps/storyweaver"
log_info "部署路径: $DEPLOY_PATH"

# 清理旧目录
if [ -d "$DEPLOY_PATH" ]; then
    log_warning "目录已存在，删除中..."
    rm -rf "$DEPLOY_PATH"
fi

# 创建父目录
mkdir -p "$(dirname $DEPLOY_PATH)"

# 克隆
log_info "克隆项目..."
cd "$(dirname $DEPLOY_PATH)"
if ! git clone git@github.com:adamllll/StoryWeaver.git "$(basename $DEPLOY_PATH)"; then
    log_error "克隆失败！"
    exit 1
fi
log_success "克隆完成"
cd "$DEPLOY_PATH"

# 生成 JWT
JWT_SECRET=$(openssl rand -hex 32)

# 收集配置
echo ""
read -p "域名或IP (如 example.com): " DOMAIN
read -p "使用 HTTPS? (y/n): " use_https
[[ "$use_https" == "y" ]] && PROTOCOL="https" || PROTOCOL="http"
read -p "OpenAI API Key: " OPENAI_KEY
read -p "OpenAI Base URL (回车用默认): " OPENAI_BASE
[ -z "$OPENAI_BASE" ] && OPENAI_BASE="https://api.openai.com/v1"

# 写后端配置
cat > "$DEPLOY_PATH/backend/.env" << EOF
DATABASE_URL=sqlite:///./data/story.db
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
OPENAI_API_KEY=$OPENAI_KEY
OPENAI_BASE_URL=$OPENAI_BASE
OPENAI_MODEL=gpt-4o-mini
DEBUG=false
FRONTEND_URL=$PROTOCOL://$DOMAIN
AI_REQUESTS_PER_MINUTE=5
EOF

# 写前端配置
cat > "$DEPLOY_PATH/frontend/.env.local" << EOF
NEXT_PUBLIC_API_URL=$PROTOCOL://$DOMAIN/api
EOF

# 创建数据目录
mkdir -p "$DEPLOY_PATH/backend/data"
chmod 755 "$DEPLOY_PATH/backend/data"

log_success "配置完成"

# 启动容器
log_info "启动 Docker（首次约3-5分钟）..."
cd "$DEPLOY_PATH"
if ! docker compose up -d --build; then
    log_error "Docker 启动失败！"
    docker compose logs
    exit 1
fi

# 等待就绪
log_info "等待容器启动..."
for i in {1..30}; do
    if docker ps | grep -q "storyweaver.*Up"; then
        break
    fi
    sleep 2
    echo -n "."
done
echo ""
log_success "容器已启动"

# 完成
echo ""
echo "=================================================="
log_success "部署完成！"
echo "=================================================="
echo ""
echo -e "${GREEN}访问地址:${NC} $PROTOCOL://$DOMAIN"
echo ""
echo -e "${YELLOW}【必须】在 1Panel 配置反向代理：${NC}"
echo ""
echo "1. 创建网站 → 反向代理 → 域名: $DOMAIN → 代理到: http://127.0.0.1:3000"
echo ""
echo "2. 编辑配置，在 location / 前面添加："
echo ""
echo -e "${GREEN}location /api/ {"
echo "    proxy_pass http://127.0.0.1:8000;"
echo "    proxy_set_header Host \$host;"
echo "    proxy_set_header X-Real-IP \$remote_addr;"
echo "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "    proxy_set_header X-Forwarded-Proto \$scheme;"
echo "    proxy_connect_timeout 120s;"
echo "    proxy_send_timeout 120s;"
echo "    proxy_read_timeout 120s;"
echo -e "}${NC}"
echo ""
echo -e "${BLUE}管理命令：${NC}"
echo "  cd $DEPLOY_PATH && docker compose logs -f   # 查看日志"
echo "  cd $DEPLOY_PATH && docker compose restart   # 重启"
echo "  cd $DEPLOY_PATH && docker compose down      # 停止"
echo ""
