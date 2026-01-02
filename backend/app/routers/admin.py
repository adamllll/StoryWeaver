"管理员路由 - 用户管理、内容管理、数据统计、ENV配置"
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
import math
import os
import re

from ..database import get_db
from ..models import User, Novel, Chapter, Adventure
from ..schemas.admin import (
    UserAdminResponse, UserListResponse, UserStatusUpdate, UserAdminUpdate,
    NovelAdminResponse, NovelListAdminResponse, NovelStatusUpdate,
    AdventureAdminResponse, AdventureListAdminResponse,
    PlatformOverview, UserStats, ContentStats, DailyCount, TopAuthor,
    EnvConfigItem, EnvConfigResponse, EnvConfigUpdate,
    BatchUserIds, BatchNovelIds, BatchOperationResult,
)
from ..utils.auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["管理员"])


# ========== 辅助函数 ========== 
def user_to_admin_response(user: User, db: Session) -> UserAdminResponse:
    """将 User 模型转换为管理员响应"""
    novel_count = db.query(func.count(Novel.id)).filter(
        Novel.user_id == user.id,
        Novel.deleted_at.is_(None)
    ).scalar()
    adventure_count = db.query(func.count(Adventure.id)).filter(
        Adventure.player_id == user.id
    ).scalar()
    return UserAdminResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        bio=user.bio,
        is_admin=user.is_admin,
        is_active=user.is_active if user.is_active is not None else True,
        role_preference=user.role_preference or "author",
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        deleted_at=user.deleted_at,
        novel_count=novel_count or 0,
        adventure_count=adventure_count or 0,
    )


def novel_to_admin_response(novel: Novel) -> NovelAdminResponse:
    """将 Novel 模型转换为管理员响应"""
    return NovelAdminResponse(
        id=novel.id,
        title=novel.title,
        description=novel.description,
        category=novel.category,
        status=novel.status,
        is_interactive=novel.is_interactive or False,
        chapter_count=novel.chapter_count,
        word_count=novel.word_count,
        author_id=novel.user_id,
        author_username=novel.author.username if novel.author else "未知",
        created_at=novel.created_at,
        updated_at=novel.updated_at,
        deleted_at=novel.deleted_at,
    )


# ========== 用户管理 API ========== 
@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索用户名/邮箱"),
    is_admin: Optional[bool] = Query(None, description="筛选管理员"),
    is_active: Optional[bool] = Query(None, description="筛选启用状态"),
    include_deleted: bool = Query(False, description="是否包含已删除用户"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取用户列表（管理员）"""
    query = db.query(User)

    # 默认不包含已删除用户
    if not include_deleted:
        query = query.filter(User.deleted_at.is_(None))

    # 搜索
    if search:
        query = query.filter(
            or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    # 筛选管理员
    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)

    # 筛选启用状态
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # 统计总数
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # 分页
    users = query.order_by(User.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return UserListResponse(
        users=[user_to_admin_response(u, db) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/users/{user_id}", response_model=UserAdminResponse)
async def get_user_detail(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取用户详情（管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user_to_admin_response(user, db)


@router.patch("/users/{user_id}/status", response_model=UserAdminResponse)
async def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """禁用/启用用户"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="不能修改自己的状态")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if user.deleted_at is not None:
        raise HTTPException(status_code=400, detail="用户已被删除")

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user_to_admin_response(user, db)


@router.patch("/users/{user_id}/admin", response_model=UserAdminResponse)
async def update_user_admin(
    user_id: int,
    data: UserAdminUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """设置/取消管理员权限"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="不能修改自己的管理员权限")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if user.deleted_at is not None:
        raise HTTPException(status_code=400, detail="用户已被删除")

    # 检查是否是最后一个管理员
    if not data.is_admin and user.is_admin:
        admin_count = db.query(func.count(User.id)).filter(
            User.is_admin == True,
            User.deleted_at.is_(None),
            User.is_active == True,
        ).scalar()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="不能取消最后一个管理员的权限")

    user.is_admin = data.is_admin
    db.commit()
    db.refresh(user)
    return user_to_admin_response(user, db)


@router.delete("/users/{user_id}", response_model=UserAdminResponse)
async def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """软删除用户"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="不能删除自己的账户")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if user.deleted_at is not None:
        raise HTTPException(status_code=400, detail="用户已被删除")

    # 检查是否是最后一个管理员
    if user.is_admin:
        admin_count = db.query(func.count(User.id)).filter(
            User.is_admin == True,
            User.deleted_at.is_(None),
        ).scalar()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="不能删除最后一个管理员")

    user.deleted_at = datetime.utcnow()
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user_to_admin_response(user, db)


# ========== 内容管理 API ========== 
@router.get("/novels", response_model=NovelListAdminResponse)
async def list_all_novels(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索标题"),
    category: Optional[str] = Query(None, description="分类筛选"),
    novel_status: Optional[str] = Query(None, description="状态筛选"),
    user_id: Optional[int] = Query(None, description="按作者筛选"),
    include_deleted: bool = Query(False, description="是否包含已删除小说"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取所有小说列表（管理员）"""
    query = db.query(Novel)

    # 默认不包含已删除小说
    if not include_deleted:
        query = query.filter(Novel.deleted_at.is_(None))

    # 搜索
    if search:
        query = query.filter(Novel.title.ilike(f"%{search}%"))

    # 分类筛选
    if category:
        query = query.filter(Novel.category == category)

    # 状态筛选
    if novel_status:
        query = query.filter(Novel.status == novel_status)

    # 作者筛选
    if user_id:
        query = query.filter(Novel.user_id == user_id)

    # 统计总数
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # 分页
    novels = query.order_by(Novel.updated_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return NovelListAdminResponse(
        novels=[novel_to_admin_response(n) for n in novels],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.patch("/novels/{novel_id}/status", response_model=NovelAdminResponse)
async def update_novel_status(
    novel_id: int,
    data: NovelStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """审核小说（发布/下架）"""
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")

    if novel.deleted_at is not None:
        raise HTTPException(status_code=400, detail="小说已被删除")

    novel.status = data.status
    db.commit()
    db.refresh(novel)
    return novel_to_admin_response(novel)


@router.delete("/novels/{novel_id}", response_model=NovelAdminResponse)
async def delete_novel(
    novel_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """软删除小说"""
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")

    if novel.deleted_at is not None:
        raise HTTPException(status_code=400, detail="小说已被删除")

    novel.deleted_at = datetime.utcnow()
    novel.status = "draft"  # 下架
    db.commit()
    db.refresh(novel)
    return novel_to_admin_response(novel)


@router.get("/adventures", response_model=AdventureListAdminResponse)
async def list_all_adventures(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索标题"),
    category: Optional[str] = Query(None, description="分类筛选"),
    is_finished: Optional[bool] = Query(None, description="是否完成"),
    player_id: Optional[int] = Query(None, description="按玩家筛选"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取所有冒险列表（管理员）"""
    query = db.query(Adventure)

    # 搜索
    if search:
        query = query.filter(Adventure.title.ilike(f"%{search}%"))

    # 分类筛选
    if category:
        query = query.filter(Adventure.category == category)

    # 完成状态筛选
    if is_finished is not None:
        query = query.filter(Adventure.is_finished == is_finished)

    # 玩家筛选
    if player_id:
        query = query.filter(Adventure.player_id == player_id)

    # 统计总数
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # 分页
    adventures = query.order_by(Adventure.updated_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    result = []
    for adv in adventures:
        result.append(AdventureAdminResponse(
            id=adv.id,
            title=adv.title,
            category=adv.category,
            protagonist_name=adv.protagonist_name,
            is_finished=adv.is_finished,
            total_nodes=adv.total_nodes or 0,
            total_words=adv.total_words or 0,
            player_id=adv.player_id,
            player_username=adv.player.username if adv.player else "未知",
            created_at=adv.created_at,
            updated_at=adv.updated_at,
        ))

    return AdventureListAdminResponse(
        adventures=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.delete("/adventures/{adventure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_adventure(
    adventure_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """管理员删除冒险（物理删除）"""
    adventure = db.query(Adventure).filter(Adventure.id == adventure_id).first()
    if not adventure:
        raise HTTPException(status_code=404, detail="冒险不存在")
    
    db.delete(adventure)
    db.commit()


# ========== 统计 API ========== 
@router.get("/stats/overview", response_model=PlatformOverview)
async def get_platform_overview(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取平台总览统计"""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    # 总用户数（不含已删除）
    total_users = db.query(func.count(User.id)).filter(
        User.deleted_at.is_(None)
    ).scalar() or 0

    # 总小说数（不含已删除）
    total_novels = db.query(func.count(Novel.id)).filter(
        Novel.deleted_at.is_(None)
    ).scalar() or 0

    # 总章节数
    total_chapters = db.query(func.count(Chapter.id)).scalar() or 0

    # 总冒险数
    total_adventures = db.query(func.count(Adventure.id)).scalar() or 0

    # 总字数（所有章节内容长度之和）
    chapters = db.query(Chapter.content).all()
    total_words = sum(len(c.content) if c.content else 0 for c in chapters)

    # 今日新用户
    new_users_today = db.query(func.count(User.id)).filter(
        User.created_at >= today_start,
        User.deleted_at.is_(None),
    ).scalar() or 0

    # 今日新小说
    new_novels_today = db.query(func.count(Novel.id)).filter(
        Novel.created_at >= today_start,
        Novel.deleted_at.is_(None),
    ).scalar() or 0

    # 今日活跃用户（今日登录过的用户）
    active_users_today = db.query(func.count(User.id)).filter(
        User.last_login_at >= today_start,
        User.deleted_at.is_(None),
    ).scalar() or 0

    return PlatformOverview(
        total_users=total_users,
        total_novels=total_novels,
        total_chapters=total_chapters,
        total_adventures=total_adventures,
        total_words=total_words,
        new_users_today=new_users_today,
        new_novels_today=new_novels_today,
        active_users_today=active_users_today,
    )


@router.get("/stats/users", response_model=UserStats)
async def get_user_stats(
    days: int = Query(30, ge=1, le=365, description="统计天数"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取用户活跃度统计"""
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days - 1)

    # 每日注册用户数
    daily_registrations = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date + timedelta(days=1), datetime.min.time())
        count = db.query(func.count(User.id)).filter(
            User.created_at >= date_start,
            User.created_at < date_end,
            User.deleted_at.is_(None),
        ).scalar() or 0
        daily_registrations.append(DailyCount(date=date.isoformat(), count=count))

    # 每日活跃用户数
    daily_active_users = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date + timedelta(days=1), datetime.min.time())
        count = db.query(func.count(User.id)).filter(
            User.last_login_at >= date_start,
            User.last_login_at < date_end,
            User.deleted_at.is_(None),
        ).scalar() or 0
        daily_active_users.append(DailyCount(date=date.isoformat(), count=count))

    # 用户角色分布
    author_count = db.query(func.count(User.id)).filter(
        User.role_preference == "author",
        User.deleted_at.is_(None),
    ).scalar() or 0
    player_count = db.query(func.count(User.id)).filter(
        User.role_preference == "player",
        User.deleted_at.is_(None),
    ).scalar() or 0

    return UserStats(
        daily_registrations=daily_registrations,
        daily_active_users=daily_active_users,
        user_role_distribution={"author": author_count, "player": player_count},
    )


@router.get("/stats/content", response_model=ContentStats)
async def get_content_stats(
    days: int = Query(30, ge=1, le=365, description="统计天数"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """获取内容创作统计"""
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days - 1)

    # 每日新增小说数
    daily_novels = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date + timedelta(days=1), datetime.min.time())
        count = db.query(func.count(Novel.id)).filter(
            Novel.created_at >= date_start,
            Novel.created_at < date_end,
            Novel.deleted_at.is_(None),
        ).scalar() or 0
        daily_novels.append(DailyCount(date=date.isoformat(), count=count))

    # 每日新增章节数
    daily_chapters = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_start = datetime.combine(date, datetime.min.time())
        date_end = datetime.combine(date + timedelta(days=1), datetime.min.time())
        count = db.query(func.count(Chapter.id)).filter(
            Chapter.created_at >= date_start,
            Chapter.created_at < date_end,
        ).scalar() or 0
        daily_chapters.append(DailyCount(date=date.isoformat(), count=count))

    # 分类分布
    category_counts = db.query(
        Novel.category, func.count(Novel.id)
    ).filter(
        Novel.deleted_at.is_(None)
    ).group_by(Novel.category).all()
    category_distribution = {cat: count for cat, count in category_counts}

    # 热门作者（按小说数量排序）
    top_authors_query = db.query(
        User.id, User.username, func.count(Novel.id).label("novel_count")
    ).join(Novel, Novel.user_id == User.id).filter(
        Novel.deleted_at.is_(None),
        User.deleted_at.is_(None),
    ).group_by(User.id).order_by(func.count(Novel.id).desc()).limit(10).all()

    top_authors = [
        TopAuthor(user_id=uid, username=uname, novel_count=ncount)
        for uid, uname, ncount in top_authors_query
    ]

    return ContentStats(
        daily_novels=daily_novels,
        daily_chapters=daily_chapters,
        category_distribution=category_distribution,
        top_authors=top_authors,
    )


# ========== ENV 配置管理 API ========== 
# 允许修改的配置项白名单（安全考虑）
ALLOWED_ENV_KEYS = {
    "OPENAI_API_KEY": {"is_secret": True, "description": "OpenAI API 密钥"},
    "OPENAI_BASE_URL": {"is_secret": False, "description": "OpenAI API 基础地址"},
    "OPENAI_MODEL": {"is_secret": False, "description": "默认 AI 模型"},
    "OPENAI_MODEL_OUTLINE": {"is_secret": False, "description": "大纲生成模型"},
    "OPENAI_MODEL_CONTINUE": {"is_secret": False, "description": "章节续写模型"},
    "OPENAI_MODEL_EXPAND": {"is_secret": False, "description": "文本扩写模型"},
    "OPENAI_MODEL_REWRITE": {"is_secret": False, "description": "文本重写模型"},
    "OPENAI_MODEL_CHARACTER": {"is_secret": False, "description": "角色生成模型"},
    "OPENAI_MODEL_BRANCH": {"is_secret": False, "description": "分支生成模型"},
    "OPENAI_MODEL_FORMAT_OPTIMIZE": {"is_secret": False, "description": "格式优化模型"},
    "CLAUDE_API_KEY": {"is_secret": True, "description": "Claude API 密钥"},
    "CLAUDE_MODEL": {"is_secret": False, "description": "Claude 模型"},
    "DEBUG": {"is_secret": False, "description": "调试模式"},
    "FRONTEND_URL": {"is_secret": False, "description": "前端地址"},
    "AI_REQUESTS_PER_MINUTE": {"is_secret": False, "description": "AI 请求速率限制"},
}


def get_env_file_path() -> Path:
    """获取 .env 文件路径"""
    return Path(__file__).parent.parent.parent / ".env"


def mask_secret(value: str) -> str:
    """隐藏敏感信息，只显示前4位和后4位"""
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "*" * (len(value) - 8) + value[-4:]


def parse_env_file(env_path: Path) -> dict:
    """解析 .env 文件"""
    env_vars = {}
    if not env_path.exists():
        return env_vars

    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # 跳过空行和注释
            if not line or line.startswith("#"):
                continue
            # 解析 KEY=VALUE
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip()
                # 移除引号
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                env_vars[key] = value
    return env_vars


def update_env_file(env_path: Path, key: str, new_value: str) -> bool:
    """更新 .env 文件中的配置项"""
    if not env_path.exists():
        # 如果文件不存在，创建新文件
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(f"{key}={new_value}\n")
        return True

    lines = []
    key_found = False

    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            # 检查是否是目标 key
            if stripped and not stripped.startswith("#") and "=" in stripped:
                line_key = stripped.split("=", 1)[0].strip()
                if line_key == key:
                    lines.append(f"{key}={new_value}\n")
                    key_found = True
                    continue
            lines.append(line)

    # 如果 key 不存在，添加到文件末尾
    if not key_found:
        if lines and not lines[-1].endswith("\n"):
            lines.append("\n")
        lines.append(f"{key}={new_value}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    return True


@router.get("/env", response_model=EnvConfigResponse)
async def get_env_config(
    admin: User = Depends(get_admin_user),
):
    """获取 ENV 配置（管理员）"""
    env_path = get_env_file_path()
    env_vars = parse_env_file(env_path)

    items = []
    for key, meta in ALLOWED_ENV_KEYS.items():
        value = env_vars.get(key, "")
        # 敏感信息部分隐藏
        display_value = mask_secret(value) if meta["is_secret"] and value else value
        items.append(EnvConfigItem(
            key=key,
            value=display_value,
            is_secret=meta["is_secret"],
            description=meta["description"],
        ))

    return EnvConfigResponse(
        items=items,
        env_file_path=str(env_path),
    )


@router.patch("/env", response_model=EnvConfigItem)
async def update_env_config(
    data: EnvConfigUpdate,
    admin: User = Depends(get_admin_user),
):
    """更新 ENV 配置项（管理员）"""
    # 检查是否在白名单中
    if data.key not in ALLOWED_ENV_KEYS:
        raise HTTPException(
            status_code=400,
            detail=f"不允许修改此配置项: {data.key}"
        )

    env_path = get_env_file_path()
    meta = ALLOWED_ENV_KEYS[data.key]

    # 更新文件
    try:
        update_env_file(env_path, data.key, data.value)
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"无法写入配置文件（文件系统只读）：{str(e)}。请通过环境变量或Docker配置设置此参数。"
        )

    # 返回更新后的值（敏感信息隐藏）
    display_value = mask_secret(data.value) if meta["is_secret"] and data.value else data.value
    return EnvConfigItem(
        key=data.key,
        value=display_value,
        is_secret=meta["is_secret"],
        description=meta["description"],
    )


# ========== 恢复已删除数据 API ========== 
@router.post("/users/{user_id}/restore", response_model=UserAdminResponse)
async def restore_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """恢复已删除的用户"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.deleted_at is None:
        raise HTTPException(status_code=400, detail="用户未被删除")

    user.deleted_at = None
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user_to_admin_response(user, db)


@router.post("/novels/{novel_id}/restore", response_model=NovelAdminResponse)
async def restore_novel(
    novel_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """恢复已删除的小说"""
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(status_code=404, detail="小说不存在")
    if novel.deleted_at is None:
        raise HTTPException(status_code=400, detail="小说未被删除")

    novel.deleted_at = None
    db.commit()
    db.refresh(novel)
    return novel_to_admin_response(novel)


# ========== 批量操作 API ========== 
@router.post("/users/batch/delete", response_model=BatchOperationResult)
async def batch_delete_users(
    data: BatchUserIds,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """批量软删除用户"""
    success_count = 0
    failed_ids = []

    for user_id in data.user_ids:
        if user_id == admin.id:
            failed_ids.append(user_id)
            continue
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if user and not user.is_admin:
            user.deleted_at = datetime.utcnow()
            user.is_active = False
            success_count += 1
        else:
            failed_ids.append(user_id)

    db.commit()
    return BatchOperationResult(
        success_count=success_count,
        failed_count=len(failed_ids),
        failed_ids=failed_ids,
    )


@router.post("/users/batch/disable", response_model=BatchOperationResult)
async def batch_disable_users(
    data: BatchUserIds,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """批量禁用用户"""
    success_count = 0
    failed_ids = []

    for user_id in data.user_ids:
        if user_id == admin.id:
            failed_ids.append(user_id)
            continue
        user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
        if user:
            user.is_active = False
            success_count += 1
        else:
            failed_ids.append(user_id)

    db.commit()
    return BatchOperationResult(
        success_count=success_count,
        failed_count=len(failed_ids),
        failed_ids=failed_ids,
    )


@router.post("/novels/batch/delete", response_model=BatchOperationResult)
async def batch_delete_novels(
    data: BatchNovelIds,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """批量软删除小说"""
    success_count = 0
    failed_ids = []

    for novel_id in data.novel_ids:
        novel = db.query(Novel).filter(Novel.id == novel_id, Novel.deleted_at.is_(None)).first()
        if novel:
            novel.deleted_at = datetime.utcnow()
            novel.status = "draft"
            success_count += 1
        else:
            failed_ids.append(novel_id)

    db.commit()
    return BatchOperationResult(
        success_count=success_count,
        failed_count=len(failed_ids),
        failed_ids=failed_ids,
    )
