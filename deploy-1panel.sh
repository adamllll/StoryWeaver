#!/bin/bash
#############################################
# StoryWeaver 一键部署脚本 - 1Panel 专用版
# 作者：Claude Code + 哈雷酱 (￣▽￣)ノ
# 版本：1.1.0
# 特性：SSH-only 部署，需要配置 GitHub SSH 密钥
#############################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 分割线
print_separator() {
    echo "=================================================="
}

# 显示标题
show_header() {
    clear
    print_separator
    echo -e "${BLUE}   StoryWeaver 一键部署脚本${NC}"
    echo -e "${GREEN}   适配 1Panel + OpenResty 环境${NC}"
    print_separator
    echo ""
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户运行此脚本！"
        echo "使用方法: sudo bash deploy-1panel.sh"
        exit 1
    fi
}

# 检查必要的命令
check_commands() {
    log_info "检查必要的命令..."

    local missing_commands=()

    for cmd in docker git openssl; do
        if ! command -v $cmd &> /dev/null; then
            missing_commands+=($cmd)
        fi
    done

    if [ ${#missing_commands[@]} -gt 0 ]; then
        log_error "缺少必要的命令: ${missing_commands[*]}"
        log_info "请先安装 1Panel，它会自动安装 Docker"
        exit 1
    fi

    log_success "所有必要命令已安装"
}

# 选择部署目录
select_deploy_path() {
    log_info "选择部署目录..."
    echo ""
    echo "请选择部署路径："
    echo "1) /opt/1panel/apps/storyweaver (推荐，1Panel 标准路径)"
    echo "2) 自定义路径"
    echo ""
    read -p "请选择 [1-2]: " choice

    case $choice in
        1)
            DEPLOY_PATH="/opt/1panel/apps/storyweaver"
            ;;
        2)
            read -p "请输入自定义路径: " custom_path
            DEPLOY_PATH="${custom_path%/}/storyweaver"
            ;;
        *)
            log_error "无效的选择"
            exit 1
            ;;
    esac

    log_success "部署路径: $DEPLOY_PATH"
}

# 创建部署目录
create_deploy_dir() {
    log_info "创建部署目录..."

    if [ -d "$DEPLOY_PATH" ]; then
        log_warning "目录已存在: $DEPLOY_PATH"
        read -p "是否删除重新部署? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
            rm -rf "$DEPLOY_PATH"
            log_success "已删除旧目录"
        else
            log_error "部署已取消"
            exit 1
        fi
    fi

    mkdir -p "$DEPLOY_PATH"
    log_success "目录创建成功"
}

# 检查 SSH 密钥
check_ssh_key() {
    log_info "检查 SSH 密钥配置..."

    # 检查是否有 SSH 密钥
    if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
        log_error "未找到 SSH 密钥！"
        echo ""
        echo -e "${YELLOW}请先配置 SSH 密钥：${NC}"
        echo "  1. 生成密钥: ssh-keygen -t ed25519 -C 'your_email@example.com'"
        echo "  2. 查看公钥: cat ~/.ssh/id_ed25519.pub"
        echo "  3. 添加到 GitHub: https://github.com/settings/keys"
        echo ""
        exit 1
    fi

    # 测试 GitHub SSH 连接
    log_info "测试 GitHub SSH 连接..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        log_success "SSH 连接正常"
    else
        log_warning "SSH 连接测试返回非预期结果，继续尝试克隆..."
    fi
}

# 克隆项目
clone_project() {
    log_info "使用 SSH 克隆项目代码..."

    cd "$(dirname $DEPLOY_PATH)"

    if git clone git@github.com:adamllll/StoryWeaver.git storyweaver; then
        log_success "SSH 克隆成功"
    else
        log_error "SSH 克隆失败！"
        echo ""
        echo -e "${YELLOW}可能的原因：${NC}"
        echo "  1. SSH 密钥未添加到 GitHub"
        echo "  2. 网络无法访问 GitHub"
        echo "  3. 仓库不存在或无权限访问"
        echo ""
        echo -e "${YELLOW}排查步骤：${NC}"
        echo "  - 测试连接: ssh -T git@github.com"
        echo "  - 查看公钥: cat ~/.ssh/id_ed25519.pub 或 cat ~/.ssh/id_rsa.pub"
        echo "  - 添加到 GitHub: https://github.com/settings/keys"
        echo ""
        exit 1
    fi

    cd "$DEPLOY_PATH"
    log_success "项目克隆成功"
}

# 生成 JWT 密钥
generate_jwt_key() {
    log_info "生成 JWT 密钥..."
    JWT_SECRET=$(openssl rand -hex 32)
    log_success "JWT 密钥已生成"
}

# 配置环境变量
configure_env() {
    log_info "配置环境变量..."
    echo ""

    # 询问域名或 IP
    read -p "请输入域名或 IP (例如: storyweaver.example.com): " DOMAIN

    # 询问是否使用 HTTPS
    read -p "是否使用 HTTPS? (y/n，推荐 y): " use_https
    if [ "$use_https" == "y" ]; then
        PROTOCOL="https"
    else
        PROTOCOL="http"
    fi

    # 询问 OpenAI API Key
    read -p "请输入 OpenAI API Key: " OPENAI_KEY

    # 询问 API Base URL
    read -p "OpenAI API Base URL (直接回车使用默认): " OPENAI_BASE
    if [ -z "$OPENAI_BASE" ]; then
        OPENAI_BASE="https://api.openai.com/v1"
    fi

    # 创建后端配置
    log_info "创建后端配置文件..."
    cat > "$DEPLOY_PATH/backend/.env" << EOF
# ==================== 数据库配置 ====================
DATABASE_URL=sqlite:///./data/story.db

# ==================== JWT 配置 ====================
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# ==================== AI 服务配置 ====================
OPENAI_API_KEY=$OPENAI_KEY
OPENAI_BASE_URL=$OPENAI_BASE
OPENAI_MODEL=gpt-4o-mini

# ==================== 应用配置 ====================
DEBUG=false
FRONTEND_URL=$PROTOCOL://$DOMAIN
BACKEND_URL=$PROTOCOL://$DOMAIN/api

# ==================== CORS 配置 ====================
CORS_ORIGINS=["$PROTOCOL://$DOMAIN"]

# ==================== 速率限制 ====================
AI_REQUESTS_PER_MINUTE=5
EOF

    log_success "后端配置已创建"

    # 创建前端配置
    log_info "创建前端配置文件..."
    cat > "$DEPLOY_PATH/frontend/.env.local" << EOF
# 前端环境变量配置
NEXT_PUBLIC_API_URL=$PROTOCOL://$DOMAIN/api
EOF

    log_success "前端配置已创建"

    # 创建数据目录
    mkdir -p "$DEPLOY_PATH/backend/data"
    chmod 755 "$DEPLOY_PATH/backend/data"
}

# 启动容器
start_containers() {
    log_info "启动 Docker 容器..."
    echo ""
    log_warning "首次启动需要 3-5 分钟（构建镜像）"
    log_info "请耐心等待..."
    echo ""

    cd "$DEPLOY_PATH"

    if docker compose up -d --build; then
        log_success "容器启动成功"
    else
        log_error "容器启动失败！"
        echo ""
        log_info "查看错误日志:"
        docker compose logs
        exit 1
    fi
}

# 等待容器就绪
wait_for_containers() {
    log_info "等待容器就绪..."

    local max_wait=60
    local waited=0

    while [ $waited -lt $max_wait ]; do
        if docker ps | grep -q "storyweaver-backend.*Up" && docker ps | grep -q "storyweaver-frontend.*Up"; then
            log_success "容器已就绪"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
        echo -n "."
    done

    echo ""
    log_error "容器启动超时"
    return 1
}

# 显示 OpenResty 配置说明
show_openresty_config() {
    print_separator
    log_info "OpenResty 反向代理配置（必须完成！）"
    print_separator
    echo ""
    echo -e "${YELLOW}请在 1Panel 中完成以下配置：${NC}"
    echo ""
    echo "1. 创建网站："
    echo "   - 网站类型: 反向代理"
    echo "   - 域名: $DOMAIN"
    echo "   - 代理地址: http://127.0.0.1:3000"
    echo "   - SSL: 如需 HTTPS，选择 Let's Encrypt 自动申请"
    echo ""
    echo "2. 添加 API 路由（在 location / 前面）："
    echo ""
    echo -e "${GREEN}location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}${NC}"
    echo ""
    echo "3. 保存并重载配置"
    echo ""
}

# 显示部署信息
show_deployment_info() {
    print_separator
    log_success "部署完成！"
    print_separator
    echo ""
    echo -e "${GREEN}部署信息：${NC}"
    echo "  - 部署路径: $DEPLOY_PATH"
    echo "  - 访问地址: $PROTOCOL://$DOMAIN"
    echo "  - 后端 API: $PROTOCOL://$DOMAIN/api/health"
    echo ""
    echo -e "${GREEN}容器状态：${NC}"
    docker compose -f "$DEPLOY_PATH/docker-compose.yml" ps
    echo ""
    echo -e "${YELLOW}后续操作：${NC}"
    echo "  1. 完成 OpenResty 配置（见上方说明）"
    echo "  2. 访问 $PROTOCOL://$DOMAIN 查看应用"
    echo "  3. 查看日志: cd $DEPLOY_PATH && docker compose logs -f"
    echo ""
    echo -e "${BLUE}管理命令：${NC}"
    echo "  - 重启: cd $DEPLOY_PATH && docker compose restart"
    echo "  - 停止: cd $DEPLOY_PATH && docker compose down"
    echo "  - 查看日志: cd $DEPLOY_PATH && docker compose logs -f"
    echo ""
    print_separator
}

# 主流程
main() {
    show_header

    # 检查环境
    check_root
    check_commands
    check_ssh_key

    # 部署流程
    select_deploy_path
    create_deploy_dir
    clone_project
    generate_jwt_key
    configure_env
    start_containers
    wait_for_containers

    # 显示配置说明
    show_openresty_config
    show_deployment_info

    log_success "一键部署完成！(￣▽￣)ノ"
}

# 执行主流程
main
