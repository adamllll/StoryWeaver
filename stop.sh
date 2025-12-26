#!/bin/bash

# StoryWeaver 项目停止脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                           ║${NC}"
echo -e "${BLUE}║      织梦者 (StoryWeaver) 停止脚本       ║${NC}"
echo -e "${BLUE}║                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 停止后端
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "正在停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2

        # 强制杀死进程（如果还在运行）
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            log_warning "后端进程未响应，强制终止..."
            kill -9 $BACKEND_PID
        fi

        log_success "后端服务已停止"
    else
        log_warning "后端服务未运行"
    fi
    rm backend.pid
else
    log_warning "未找到 backend.pid 文件"
fi

echo ""

# 停止前端
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "正在停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2

        # 强制杀死进程（如果还在运行）
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log_warning "前端进程未响应，强制终止..."
            kill -9 $FRONTEND_PID
        fi

        log_success "前端服务已停止"
    else
        log_warning "前端服务未运行"
    fi
    rm frontend.pid
else
    log_warning "未找到 frontend.pid 文件"
fi

# 清理可能残留的进程
log_info "清理可能残留的进程..."

# 查找并杀死 uvicorn 进程
UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app" || true)
if [ -n "$UVICORN_PIDS" ]; then
    log_info "发现残留的 uvicorn 进程，正在清理..."
    echo "$UVICORN_PIDS" | xargs kill -9 2>/dev/null || true
    log_success "uvicorn 进程已清理"
fi

# 查找并杀死 next dev 进程
NEXT_PIDS=$(pgrep -f "next dev" || true)
if [ -n "$NEXT_PIDS" ]; then
    log_info "发现残留的 next dev 进程，正在清理..."
    echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null || true
    log_success "next dev 进程已清理"
fi

echo ""
log_success "所有服务已停止"
echo ""
log_info "日志文件保留在当前目录："
log_info "  - backend.log"
log_info "  - frontend.log"
echo ""
