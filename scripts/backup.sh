#!/bin/bash
# ========================================
# StoryWeaver SQLite 数据库备份脚本
# ========================================
# 功能：
# - 热备份 SQLite 数据库
# - Gzip 压缩
# - 自动清理过期备份
# - 支持 Docker 和本地环境
# ========================================

set -e

# ========== 配置 ==========
# 数据库路径（根据环境调整）
DB_PATH="${DB_PATH:-/home/adam/story-weaver/data/story.db}"

# 备份目录
BACKUP_DIR="${BACKUP_DIR:-/home/adam/story-weaver/backups}"

# 保留天数
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# 时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 备份文件名
BACKUP_FILE="${BACKUP_DIR}/story_${TIMESTAMP}.db"

# ========== 函数 ==========

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
    exit 1
}

# ========== 主逻辑 ==========

log "开始备份 StoryWeaver 数据库..."

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    error "数据库文件不存在: $DB_PATH"
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 使用 SQLite 热备份（.backup 命令）
# 这是最安全的备份方式，即使数据库正在使用中也能正确备份
log "执行 SQLite 热备份..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ ! -f "$BACKUP_FILE" ]; then
    error "备份失败: 备份文件未创建"
fi

# 压缩备份
log "压缩备份文件..."
gzip "$BACKUP_FILE"

FINAL_FILE="${BACKUP_FILE}.gz"

if [ ! -f "$FINAL_FILE" ]; then
    error "压缩失败"
fi

# 获取文件大小
FILE_SIZE=$(du -h "$FINAL_FILE" | cut -f1)
log "备份完成: $FINAL_FILE ($FILE_SIZE)"

# 清理过期备份
log "清理超过 ${RETENTION_DAYS} 天的旧备份..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "story_*.db.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "已删除 ${DELETED_COUNT} 个过期备份"

# 列出现有备份
log "当前备份列表:"
ls -lh "$BACKUP_DIR"/story_*.db.gz 2>/dev/null || log "  (无备份)"

log "备份任务完成！"

# ========== 使用说明 ==========
#
# 手动运行：
#   ./scripts/backup.sh
#
# 设置定时任务（每天凌晨 3 点）：
#   crontab -e
#   0 3 * * * /home/adam/story-weaver/scripts/backup.sh >> /var/log/storyweaver-backup.log 2>&1
#
# Docker 环境中运行：
#   docker exec storyweaver-backend /app/scripts/backup.sh
#
# 自定义配置：
#   DB_PATH=/custom/path/story.db BACKUP_DIR=/custom/backups ./scripts/backup.sh
#
