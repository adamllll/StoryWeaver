#!/bin/bash

# StoryWeaver 项目启动脚本
# 适用于 Linux/WSL2 环境

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

# 标题
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                           ║${NC}"
echo -e "${BLUE}║      织梦者 (StoryWeaver) 启动脚本       ║${NC}"
echo -e "${BLUE}║                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 环境检查
log_info "检查环境依赖..."

# 检查 Python
if ! command -v python3 &> /dev/null; then
    log_error "未找到 Python3，请先安装 Python 3.10+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
log_success "Python 版本: $PYTHON_VERSION"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js 版本: $NODE_VERSION"

# 检查 npm
if ! command -v npm &> /dev/null; then
    log_error "未找到 npm，请先安装 npm"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_success "npm 版本: $NPM_VERSION"

echo ""

# 后端设置
log_info "设置后端环境..."
cd backend

# 检查 .env 文件
if [ ! -f .env ]; then
    log_warning ".env 文件不存在，正在从 .env.example 复制..."
    cp .env.example .env
    log_warning "请编辑 backend/.env 填入你的 API Keys！"
    log_warning "特别是 OPENAI_API_KEY 和 SECRET_KEY"
    echo ""
    read -p "是否现在编辑 .env 文件？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    else
        log_warning "请稍后手动编辑 backend/.env 文件"
    fi
fi

# 创建虚拟环境
if [ ! -d "venv" ]; then
    log_info "创建 Python 虚拟环境..."
    python3 -m venv venv
    log_success "虚拟环境创建完成"
else
    log_info "虚拟环境已存在，跳过创建"
fi

# 激活虚拟环境
log_info "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
log_info "安装 Python 依赖..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
log_success "Python 依赖安装完成"

# 检查数据库文件
if [ ! -f "story_weaver.db" ]; then
    log_info "数据库文件不存在，将在首次启动时自动创建"
fi

# 返回项目根目录
cd ..

echo ""

# 前端设置
log_info "设置前端环境..."
cd frontend

# 检查 .env.local 文件
if [ ! -f .env.local ]; then
    log_warning ".env.local 文件不存在，正在从 .env.example 复制..."
    cp .env.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    log_success ".env.local 文件创建完成"
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    log_info "安装 Node.js 依赖（这可能需要几分钟）..."
    npm install --silent
    log_success "Node.js 依赖安装完成"
else
    log_info "Node.js 依赖已存在，跳过安装"
    log_info "如需重新安装，请运行: rm -rf node_modules && npm install"
fi

# 返回项目根目录
cd ..

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        环境准备完成，正在启动服务...     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 启动后端
log_info "启动后端服务..."
cd backend
source venv/bin/activate

# 在后台启动后端
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

log_success "后端服务已启动 (PID: $BACKEND_PID)"
log_info "后端日志: backend.log"
log_info "后端 API: http://localhost:8000/docs"

cd ..

# 等待后端启动
log_info "等待后端服务就绪..."
sleep 3

# 检查后端是否成功启动
if ps -p $BACKEND_PID > /dev/null; then
    log_success "后端服务运行正常"
else
    log_error "后端服务启动失败，请检查 backend.log"
    exit 1
fi

echo ""

# 启动前端
log_info "启动前端服务..."
cd frontend

# 在后台启动前端
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

log_success "前端服务已启动 (PID: $FRONTEND_PID)"
log_info "前端日志: frontend.log"

cd ..

# 等待前端启动
log_info "等待前端服务就绪..."
sleep 5

# 检查前端是否成功启动
if ps -p $FRONTEND_PID > /dev/null; then
    log_success "前端服务运行正常"
else
    log_error "前端服务启动失败，请检查 frontend.log"
    # 清理后端进程
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║              🎉 项目启动成功！                            ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  前端地址: ${BLUE}http://localhost:3000${GREEN}                         ║${NC}"
echo -e "${GREEN}║  后端地址: ${BLUE}http://localhost:8000${GREEN}                         ║${NC}"
echo -e "${GREEN}║  API 文档: ${BLUE}http://localhost:8000/docs${GREEN}                    ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  查看日志: ${YELLOW}tail -f backend.log${GREEN} 或 ${YELLOW}frontend.log${GREEN}       ║${NC}"
echo -e "${GREEN}║  停止服务: ${YELLOW}./stop.sh${GREEN}                                   ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "服务已在后台运行，你可以关闭此终端"
log_info "PID 文件已保存: backend.pid, frontend.pid"
