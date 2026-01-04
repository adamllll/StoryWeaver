"""小说路由 - 小说的增删改查操作"""
import re
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Novel, User, Chapter, Character
from ..schemas import (
    NovelCreate,
    NovelUpdate,
    NovelPublish,
    NovelListItem,
    NovelDetail,
    NovelListResponse,
    AuthorInfo,
    ChapterSummary,
    CharacterSummary,
)
from ..utils.auth import get_current_user, get_optional_user
from ..utils.outline_parser import extract_characters_from_outline
from ..services import NovelService

router = APIRouter(prefix="/novels", tags=["小说"])

# 设置日志
logger = logging.getLogger(__name__)


def _extract_first_chapter_from_outline(outline: str) -> tuple[str, str]:
    """
    从大纲中提取第一章的标题和概要

    参数:
        outline: Markdown 格式的小说大纲

    返回:
        元组 (章节标题, 章节大纲内容)

    示例:
        输入大纲：
        ## 第一章：觉醒
        主角林凡在家族试炼中意外觉醒...

        ## 第二章：转折
        ...

        输出: ("第一章：觉醒", "主角林凡在家族试炼中意外觉醒...")
    """
    # 尝试匹配 "## 第X章：标题" 或 "第X章 标题" 格式
    pattern = r'(?:##\s*)?(?:第[一二三四五六七八九十\d]+章[：:：]?)\s*([^\n]+)'
    matches = list(re.finditer(pattern, outline, re.MULTILINE))

    if not matches:
        # 如果没有找到章节标记，使用默认标题
        return "第一章", outline[:500]  # 取前500字符作为概要

    # 提取第一章标题
    first_match = matches[0]
    title = first_match.group(1).strip()
    start_pos = first_match.end()

    # 查找下一章的位置
    if len(matches) > 1:
        end_pos = matches[1].start()
        chapter_outline = outline[start_pos:end_pos].strip()
    else:
        # 没有第二章，取到结尾
        chapter_outline = outline[start_pos:].strip()

    # 如果提取的内容为空，使用一部分原始大纲
    if not chapter_outline:
        chapter_outline = outline[:500]

    return f"第一章：{title}", chapter_outline


async def _auto_generate_first_chapter(
    novel: Novel,
    db: Session,
) -> Optional[Chapter]:
    """
    根据大纲自动生成第一章

    参数:
        novel: 小说对象（必须有 outline 字段）
        db: 数据库会话

    返回:
        创建的章节对象，如果失败则返回 None
    """
    if not novel.outline:
        return None

    try:
        # 1. 从大纲中提取第一章信息
        chapter_title, chapter_outline = _extract_first_chapter_from_outline(novel.outline)

        logger.info(f"开始自动生成第一章: novel_id={novel.id}, title={chapter_title}")

        # 2. 构造提示词生成第一章内容
        from ..utils.prompts import get_continue_prompt
        import json

        # 推断风格（根据类型）
        style_map = {
            "玄幻": "热血爽文",
            "言情": "细腻感人",
            "科幻": "硬核科幻",
            "悬疑": "紧张刺激",
            "历史": "严谨考据",
            "都市": "轻松现实",
        }
        style = style_map.get(novel.category, "根据类型自动推断")

        # 🆕 从数据库获取角色信息（如果有的话）
        characters_json = "暂无角色设定"
        if novel.characters:
            characters_list = [
                {"name": char.name, "role": char.role_type, "description": char.description or ""}
                for char in novel.characters[:5]  # 最多取5个角色
            ]
            if characters_list:
                characters_json = json.dumps(characters_list, ensure_ascii=False, indent=2)

        # 🆕 从大纲中提取世界观信息
        world_settings = "暂无世界观设定"
        if novel.outline:
            # 尝试从大纲中提取世界观相关内容
            outline_lower = novel.outline.lower()
            if "世界观" in novel.outline or "设定" in novel.outline or "背景" in novel.outline:
                # 提取大纲中的世界观部分（简化处理：取大纲的前500字作为背景）
                world_settings = novel.outline[:500] if len(novel.outline) > 500 else novel.outline

        system_prompt, user_prompt = get_continue_prompt(
            novel_title=novel.title,
            story_summary=novel.description or "暂无简介",
            category=novel.category,
            style=style,
            chapter_outline=chapter_outline,
            previous_summary="（本章是开篇第一章）",
            characters_json=characters_json,  # 🆕 使用实际角色信息
            world_settings=world_settings,    # 🆕 使用大纲中的世界观
            word_count=2000,  # 第一章生成2000字
            special_requirements="这是小说的开篇第一章，需要引人入胜，设定清晰，留下悬念。",
        )

        # 3. 调用 AI 生成内容
        from ..services.ai_service import ai_service

        content, usage = await ai_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=3000,
            temperature=0.8,
            task="continue",
        )

        # 4. 创建第一章
        chapter = Chapter(
            novel_id=novel.id,
            title=chapter_title,
            content=content,
            order_num=1,
        )
        db.add(chapter)
        db.commit()
        db.refresh(chapter)

        logger.info(f"自动生成第一章成功: novel_id={novel.id}, chapter_id={chapter.id}, word_count={len(content)}")
        return chapter

    except Exception as e:
        logger.error(f"自动生成第一章失败: novel_id={novel.id}, error={str(e)}")
        db.rollback()
        return None


@router.get("", response_model=NovelListResponse)
async def list_novels(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=50, description="每页数量"),
    category: Optional[str] = Query(None, description="按分类筛选"),
    status: Optional[str] = Query(None, description="按状态筛选"),
    user_id: Optional[int] = Query(None, description="按作者筛选"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    获取小说分页列表，支持多种筛选条件

    参数:
        page: 页码（从1开始）
        page_size: 每页数量
        category: 小说分类
        status: 小说状态
        user_id: 作者ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        分页的小说列表及总数
    """
    service = NovelService(db)

    # 处理状态筛选逻辑
    effective_status = status
    if not status and not user_id:
        # 默认只显示已发布的小说
        effective_status = "published"
    elif user_id and current_user and current_user.id != user_id:
        # 查看其他用户的小说，只显示已发布的
        effective_status = "published"

    # 使用 Service 层获取小说列表
    novels, total = service.list_novels(
        user_id=user_id,
        category=category,
        status=effective_status,
        page=page,
        page_size=page_size
    )

    # 转换为响应格式
    items = []
    for novel in novels:
        items.append(
            NovelListItem(
                id=novel.id,
                title=novel.title,
                description=novel.description,
                category=novel.category,
                cover_url=novel.cover_url,
                status=novel.status,
                chapter_count=novel.chapter_count,
                word_count=novel.word_count,
                created_at=novel.created_at,
                updated_at=novel.updated_at,
                author=AuthorInfo(
                    id=novel.author.id,
                    username=novel.author.username,
                    avatar=novel.author.avatar,
                ),
            )
        )

    # 计算总页数
    total_pages = (total + page_size - 1) // page_size

    return NovelListResponse(
        novels=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=NovelDetail, status_code=status.HTTP_201_CREATED)
async def create_novel(
    novel_data: NovelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建新小说

    参数:
        novel_data: 小说创建数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        创建的小说详情

    注意:
        如果提供了大纲(outline)，系统会自动从大纲中提取第一章信息并生成第一章内容。
        生成过程可能需要 5-15 秒，请耐心等待。
    """
    service = NovelService(db)

    # 使用 Service 层创建小说
    novel = service.create_novel(novel_data, current_user.id)

    # 🆕 如果有大纲，提取并创建角色
    if novel.outline:
        logger.info(f"检测到大纲，开始提取角色: novel_id={novel.id}")
        try:
            extracted_characters = extract_characters_from_outline(novel.outline)

            for char_data in extracted_characters:
                character = Character(
                    novel_id=novel.id,
                    name=char_data["name"],
                    role_type=char_data["role_type"],
                    description=char_data["description"],
                )
                db.add(character)

            if extracted_characters:
                db.commit()
                logger.info(f"成功创建 {len(extracted_characters)} 个角色")
        except Exception as e:
            logger.warning(f"角色提取失败，但不影响小说创建: {e}")
            # 优雅降级，不中断流程

        # 自动生成第一章
        logger.info(f"开始自动生成第一章: novel_id={novel.id}")
        await _auto_generate_first_chapter(novel, db)
        # 重新刷新 novel 对象，获取包含新章节的数据
        db.refresh(novel)

    return _novel_to_detail(novel)


@router.get("/{novel_id}", response_model=NovelDetail)
async def get_novel(
    novel_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    根据ID获取小说详情

    参数:
        novel_id: 小说ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        包含章节和角色的小说详情

    异常:
        HTTPException: 小说不存在或无权访问时抛出
    """
    service = NovelService(db)

    # 使用 Service 层获取小说（不包含权限验证）
    novel = service.get_novel_by_id(novel_id, load_relations=True)

    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {novel_id} 的小说",
        )

    # 路由层权限验证：游客只能访问已发布的小说
    is_owner = current_user and current_user.id == novel.user_id
    if novel.status != "published" and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限查看此小说",
        )

    return _novel_to_detail(novel)


@router.put("/{novel_id}", response_model=NovelDetail)
async def update_novel(
    novel_id: int,
    novel_data: NovelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新小说信息

    参数:
        novel_id: 要更新的小说ID
        novel_data: 更新数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        更新后的小说详情

    异常:
        HTTPException: 小说不存在或非作者时抛出
    """
    service = NovelService(db)

    # 先获取小说
    novel = service.get_novel_by_id(novel_id)
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {novel_id} 的小说",
        )

    # 路由层权限验证
    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此小说",
        )

    # 使用 Service 层更新小说
    novel = service.update_novel(novel_id, novel_data)

    return _novel_to_detail(novel)


@router.post("/{novel_id}/publish", response_model=NovelDetail)
async def publish_novel(
    novel_id: int,
    publish_data: NovelPublish,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    发布或取消发布小说

    参数:
        novel_id: 小说ID
        publish_data: 发布操作（true=发布, false=取消发布）
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        更新后的小说详情

    异常:
        HTTPException: 小说不存在或非作者时抛出
    """
    service = NovelService(db)

    # 先获取小说
    novel = service.get_novel_by_id(novel_id)
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {novel_id} 的小说",
        )

    # 路由层权限验证
    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限发布此小说",
        )

    # 使用 Service 层更新状态
    from ..schemas.novel import NovelUpdate
    update_data = NovelUpdate(status="published" if publish_data.publish else "draft")
    novel = service.update_novel(novel_id, update_data)

    return _novel_to_detail(novel)


@router.delete("/{novel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_novel(
    novel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除小说及其所有章节

    参数:
        novel_id: 要删除的小说ID
        current_user: 当前登录用户
        db: 数据库会话

    异常:
        HTTPException: 小说不存在或非作者时抛出
    """
    service = NovelService(db)

    # 先获取小说
    novel = service.get_novel_by_id(novel_id)
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {novel_id} 的小说",
        )

    # 路由层权限验证
    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限删除此小说",
        )

    # 使用 Service 层删除小说（硬删除）
    success = service.delete_novel(novel_id, soft_delete=False)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除小说失败",
        )


def _novel_to_detail(novel: Novel) -> NovelDetail:
    """将小说模型转换为详情响应格式"""
    chapters = [
        ChapterSummary(
            id=ch.id,
            title=ch.title,
            order_num=ch.order_num,
            word_count=ch.word_count,
            is_branch=ch.parent_chapter_id is not None,
            created_at=ch.created_at,
        )
        for ch in sorted(novel.chapters, key=lambda x: x.order_num)
    ]

    characters = [
        CharacterSummary(
            id=char.id,
            name=char.name,
            role_type=char.role_type,
        )
        for char in novel.characters
    ]

    return NovelDetail(
        id=novel.id,
        title=novel.title,
        description=novel.description,
        outline=novel.outline,
        category=novel.category,
        cover_url=novel.cover_url,
        status=novel.status,
        chapter_count=novel.chapter_count,
        word_count=novel.word_count,
        created_at=novel.created_at,
        updated_at=novel.updated_at,
        author=AuthorInfo(
            id=novel.author.id,
            username=novel.author.username,
            avatar=novel.author.avatar,
        ),
        chapters=chapters,
        characters=characters,
    )
