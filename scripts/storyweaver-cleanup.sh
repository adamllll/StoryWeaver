#!/bin/bash
# ============================================
# StoryWeaver 专用清理脚本 - 安全版
# 作者：傲娇大小姐哈雷酱 ✨
# 用途：只清理 StoryWeaver 项目相关资源，不影响其他容器
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 项目标识（用于匹配容器和镜像名称）
PROJECT_PATTERNS=("storyweaver" "story-weaver" "story_weaver")

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   StoryWeaver 专用清理脚本 - 安全版 ✨${NC}"
echo -e "${BLUE}   只清理本项目资源，不影响其他服务${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================
# 辅助函数：检查名称是否匹配项目
# ============================================
matches_project() {
    local name="$1"
    local name_lower=$(echo "$name" | tr '[:upper:]' '[:lower:]')
    for pattern in "${PROJECT_PATTERNS[@]}"; do
        if [[ "$name_lower" == *"$pattern"* ]]; then
            return 0
        fi
    done
    return 1
}

# ============================================
# 第一步：诊断当前情况
# ============================================
echo -e "${YELLOW}📊 [诊断] 当前磁盘使用情况：${NC}"
df -h | grep -E "^/dev|Filesystem" | head -5
echo ""

echo -e "${YELLOW}📊 [诊断] Docker 整体资源：${NC}"
docker system df 2>/dev/null || echo "Docker 未运行"
echo ""

# ============================================
# 第二步：识别 StoryWeaver 相关资源
# ============================================
echo -e "${CYAN}🔍 [扫描] 查找 StoryWeaver 相关资源...${NC}"
echo ""

# 查找相关容器
echo -e "${YELLOW}  📦 相关容器：${NC}"
SW_CONTAINERS=()
while IFS= read -r line; do
    if [ -n "$line" ]; then
        container_name=$(echo "$line" | awk '{print $NF}')
        container_id=$(echo "$line" | awk '{print $1}')
        if matches_project "$container_name" || matches_project "$line"; then
            SW_CONTAINERS+=("$container_id")
            echo -e "     - $line"
        fi
    fi
done < <(docker ps -a --format "{{.ID}}\t{{.Status}}\t{{.Names}}" 2>/dev/null)

if [ ${#SW_CONTAINERS[@]} -eq 0 ]; then
    echo -e "     (无相关容器)"
fi
echo ""

# 查找相关镜像
echo -e "${YELLOW}  🖼️  相关镜像：${NC}"
SW_IMAGES=()
while IFS= read -r line; do
    if [ -n "$line" ]; then
        repo=$(echo "$line" | awk '{print $1}')
        image_id=$(echo "$line" | awk '{print $3}')
        if matches_project "$repo"; then
            SW_IMAGES+=("$image_id")
            echo -e "     - $line"
        fi
    fi
done < <(docker images --format "{{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" 2>/dev/null)

if [ ${#SW_IMAGES[@]} -eq 0 ]; then
    echo -e "     (无相关镜像)"
fi
echo ""

# 查找相关数据卷
echo -e "${YELLOW}  💾 相关数据卷：${NC}"
SW_VOLUMES=()
while IFS= read -r volume; do
    if [ -n "$volume" ] && matches_project "$volume"; then
        SW_VOLUMES+=("$volume")
        size=$(docker volume inspect "$volume" --format '{{.Mountpoint}}' 2>/dev/null | xargs du -sh 2>/dev/null | cut -f1 || echo "?")
        echo -e "     - $volume ($size)"
    fi
done < <(docker volume ls -q 2>/dev/null)

if [ ${#SW_VOLUMES[@]} -eq 0 ]; then
    echo -e "     (无相关数据卷)"
fi
echo ""

# ============================================
# 第三步：显示清理计划
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   清理计划${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "将要清理的资源："
echo "  - 容器数量: ${#SW_CONTAINERS[@]}"
echo "  - 镜像数量: ${#SW_IMAGES[@]}"
echo "  - 数据卷数量: ${#SW_VOLUMES[@]} (需额外确认)"
echo ""

if [ ${#SW_CONTAINERS[@]} -eq 0 ] && [ ${#SW_IMAGES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ 没有找到需要清理的 StoryWeaver 资源！${NC}"
    echo -e "${GREEN}   本小姐的工作完成了～ (￣▽￣*)${NC}"
    exit 0
fi

# ============================================
# 第四步：确认清理
# ============================================
echo -e "${RED}⚠️  警告：即将删除以上 StoryWeaver 资源！${NC}"
echo -e "${GREEN}   (其他项目的容器和镜像不会受影响)${NC}"
echo ""
read -p "确认继续清理？(y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo -e "${YELLOW}已取消清理操作。${NC}"
    exit 0
fi

# ============================================
# 第五步：执行清理
# ============================================
echo ""
echo -e "${BLUE}🧹 [清理] 开始清理 StoryWeaver 资源...${NC}"

# 停止并删除容器
if [ ${#SW_CONTAINERS[@]} -gt 0 ]; then
    echo -e "${YELLOW}  → 停止并删除容器...${NC}"
    for container_id in "${SW_CONTAINERS[@]}"; do
        docker stop "$container_id" 2>/dev/null || true
        docker rm "$container_id" 2>/dev/null || true
        echo -e "     ✓ 已删除容器: $container_id"
    done
fi

# 删除镜像
if [ ${#SW_IMAGES[@]} -gt 0 ]; then
    echo -e "${YELLOW}  → 删除镜像...${NC}"
    for image_id in "${SW_IMAGES[@]}"; do
        docker rmi "$image_id" 2>/dev/null || true
        echo -e "     ✓ 已删除镜像: $image_id"
    done
fi

# 询问是否删除数据卷
if [ ${#SW_VOLUMES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  发现 ${#SW_VOLUMES[@]} 个数据卷，删除后数据将丢失！${NC}"
    read -p "是否删除数据卷？(y/N): " delete_volumes
    if [[ "$delete_volumes" == "y" || "$delete_volumes" == "Y" ]]; then
        echo -e "${YELLOW}  → 删除数据卷...${NC}"
        for volume in "${SW_VOLUMES[@]}"; do
            docker volume rm "$volume" 2>/dev/null || true
            echo -e "     ✓ 已删除数据卷: $volume"
        done
    else
        echo -e "${GREEN}  ✓ 保留数据卷${NC}"
    fi
fi

# 清理悬空资源（只清理没有被任何容器使用的）
echo ""
echo -e "${YELLOW}  → 清理悬空镜像和构建缓存...${NC}"
docker image prune -f 2>/dev/null || true
docker builder prune -f 2>/dev/null || true

# ============================================
# 第六步：显示结果
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   清理完成！✨${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}📊 清理后磁盘使用情况：${NC}"
df -h | grep -E "^/dev|Filesystem" | head -5
echo ""

echo -e "${YELLOW}📊 清理后 Docker 资源：${NC}"
docker system df 2>/dev/null
echo ""

echo -e "${GREEN}🎉 StoryWeaver 资源清理完成！${NC}"
echo -e "${GREEN}   哼，本小姐只是顺手帮你而已！(￣^￣)ゞ${NC}"
