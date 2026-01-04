#!/bin/bash
# ============================================
# 服务器存储清理脚本 - StoryWeaver 项目
# 作者：傲娇大小姐哈雷酱 ✨
# 用途：清理 Docker 镜像/缓存/日志，释放服务器空间
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   服务器存储清理脚本 - 哈雷酱出品 ✨${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# 第一步：诊断当前存储情况
# ============================================
echo -e "${YELLOW}📊 [诊断] 当前磁盘使用情况：${NC}"
df -h | grep -E "^/dev|Filesystem"
echo ""

echo -e "${YELLOW}📊 [诊断] Docker 资源使用情况：${NC}"
docker system df
echo ""

echo -e "${YELLOW}📊 [诊断] Docker 镜像列表：${NC}"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -20
echo ""

# 计算可清理空间
RECLAIMABLE=$(docker system df --format '{{.Reclaimable}}' | head -1)
echo -e "${GREEN}💡 预计可回收空间: ${RECLAIMABLE}${NC}"
echo ""

# ============================================
# 确认是否继续
# ============================================
echo -e "${RED}⚠️  警告：即将执行清理操作！${NC}"
echo "这将删除："
echo "  - 所有停止的容器"
echo "  - 所有未使用的镜像"
echo "  - 所有构建缓存"
echo "  - 所有未挂载的数据卷"
echo ""
read -p "确认继续清理？(y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo -e "${YELLOW}已取消清理操作。${NC}"
    exit 0
fi

# ============================================
# 第二步：执行清理
# ============================================
echo ""
echo -e "${BLUE}🧹 [清理] 开始清理 Docker 资源...${NC}"

# 清理停止的容器
echo -e "${YELLOW}  → 清理停止的容器...${NC}"
docker container prune -f

# 清理悬空镜像
echo -e "${YELLOW}  → 清理悬空镜像...${NC}"
docker image prune -f

# 清理未使用的镜像
echo -e "${YELLOW}  → 清理未使用的镜像...${NC}"
docker image prune -a -f

# 清理构建缓存
echo -e "${YELLOW}  → 清理构建缓存...${NC}"
docker builder prune -f

# 清理未使用的网络
echo -e "${YELLOW}  → 清理未使用的网络...${NC}"
docker network prune -f

echo ""
echo -e "${GREEN}✅ Docker 资源清理完成！${NC}"

# ============================================
# 第三步：清理容器日志
# ============================================
echo ""
echo -e "${BLUE}🧹 [清理] 清理容器日志...${NC}"

# 获取所有容器日志文件并清空
LOG_COUNT=0
LOG_SIZE_BEFORE=0
for log in /var/lib/docker/containers/*/*-json.log; do
    if [ -f "$log" ]; then
        size=$(du -b "$log" 2>/dev/null | cut -f1 || echo 0)
        LOG_SIZE_BEFORE=$((LOG_SIZE_BEFORE + size))
        truncate -s 0 "$log" 2>/dev/null || true
        LOG_COUNT=$((LOG_COUNT + 1))
    fi
done

echo -e "${GREEN}  ✅ 已清空 ${LOG_COUNT} 个日志文件${NC}"
echo -e "${GREEN}  ✅ 释放日志空间: $(numfmt --to=iec $LOG_SIZE_BEFORE 2>/dev/null || echo "${LOG_SIZE_BEFORE} bytes")${NC}"

# ============================================
# 第四步：清理 1Panel 旧备份（可选）
# ============================================
echo ""
if [ -d "/opt/1panel/backup" ]; then
    echo -e "${YELLOW}📦 [可选] 发现 1Panel 备份目录${NC}"
    BACKUP_SIZE=$(du -sh /opt/1panel/backup 2>/dev/null | cut -f1 || echo "0")
    echo "  备份目录大小: ${BACKUP_SIZE}"
    read -p "是否清理旧备份（保留最近3个）？(y/N): " clean_backup
    if [[ "$clean_backup" == "y" || "$clean_backup" == "Y" ]]; then
        cd /opt/1panel/backup
        ls -t | tail -n +4 | xargs -r rm -rf
        echo -e "${GREEN}  ✅ 旧备份已清理${NC}"
    fi
fi

# ============================================
# 第五步：显示清理结果
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   清理完成！查看结果 ✨${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}📊 清理后磁盘使用情况：${NC}"
df -h | grep -E "^/dev|Filesystem"
echo ""

echo -e "${YELLOW}📊 清理后 Docker 资源：${NC}"
docker system df
echo ""

echo -e "${GREEN}🎉 清理完成！本小姐的工作完美结束了！${NC}"
echo -e "${GREEN}   才...才不是为了帮你呢！哼！(￣へ￣)${NC}"
