"""章节路由 - 小说章节的增删改查操作"""
import json
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Novel, Chapter, User
from ..models.chapter import ReadingProgress
from ..schemas import (
    ChapterCreate,
    ChapterUpdate,
    ChapterReorder,
    ChapterListItem,
    ChapterDetail,
    ChapterListResponse,
    ChapterNavigation,
    ChoiceSelection,
    ChoiceResult,
    EndingInfo,
    EndingsList,
    MarkEndingRequest,
)
from ..utils.auth import get_current_user, get_optional_user
from ..utils.db_helpers import get_accessible_novel, get_owned_novel, get_chapter as get_chapter_helper

router = APIRouter(prefix="/novels/{novel_id}/chapters", tags=["章节"])


@router.get("", response_model=ChapterListResponse)
async def list_chapters(
    novel_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    获取小说的所有章节列表

    参数:
        novel_id: 小说ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        章节列表及导航信息

    异常:
        HTTPException: 小说不存在或无权访问时抛出
    """
    novel = get_accessible_novel(novel_id, current_user, db)

    chapters = [
        ChapterListItem(
            id=ch.id,
            title=ch.title,
            order_num=ch.order_num,
            word_count=ch.word_count,
            is_branch=ch.parent_chapter_id is not None,
            parent_chapter_id=ch.parent_chapter_id,
            choice_text=ch.choice_text,
            created_at=ch.created_at,
            updated_at=ch.updated_at,
        )
        for ch in sorted(novel.chapters, key=lambda x: x.order_num)
    ]

    return ChapterListResponse(
        novel_id=novel.id,
        novel_title=novel.title,
        chapters=chapters,
        total=len(chapters),
    )


@router.post("", response_model=ChapterDetail, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    novel_id: int,
    chapter_data: ChapterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建新章节

    参数:
        novel_id: 小说ID
        chapter_data: 章节创建数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        创建的章节详情

    异常:
        HTTPException: 小说不存在或非作者时抛出
    """
    novel = get_owned_novel(novel_id, current_user, db)

    def get_next_main_order(chapters: list[Chapter]) -> int:
        used = set()
        for ch in chapters:
            if ch.parent_chapter_id is not None:
                continue
            if isinstance(ch.order_num, (int, float)) and float(ch.order_num).is_integer():
                order = int(ch.order_num)
                if order > 0:
                    used.add(order)

        next_order = 1
        while next_order in used:
            next_order += 1
        return next_order

    # 如果未提供顺序号，自动计算
    order_num = chapter_data.order_num
    if order_num is None:
        if chapter_data.parent_chapter_id:
            max_order = max((ch.order_num for ch in novel.chapters), default=0)
            order_num = max_order + 1
        else:
            order_num = get_next_main_order(novel.chapters)

    # 如果是分支章节，验证父章节是否存在
    if chapter_data.parent_chapter_id:
        parent = db.query(Chapter).filter(
            Chapter.id == chapter_data.parent_chapter_id,
            Chapter.novel_id == novel_id,
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="父章节不存在于此小说中",
            )

    chapter = Chapter(
        novel_id=novel_id,
        title=chapter_data.title,
        content=chapter_data.content or "",
        order_num=order_num,
        parent_chapter_id=chapter_data.parent_chapter_id,
        choice_text=chapter_data.choice_text,
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)

    return _chapter_to_detail(chapter, novel, db)


@router.put("/reorder", response_model=ChapterListResponse)
async def reorder_chapters(
    novel_id: int,
    reorder_data: ChapterReorder,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    重新排序章节（注意：此路由必须在 /{chapter_id} 之前定义）

    参数:
        novel_id: 小说ID
        reorder_data: 新顺序的章节ID列表
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        更新后的章节列表

    异常:
        HTTPException: 小说不存在或非作者时抛出
    """
    novel = get_owned_novel(novel_id, current_user, db)

    # 验证所有章节ID都属于此小说
    novel_chapter_ids = {ch.id for ch in novel.chapters}
    for ch_id in reorder_data.chapter_ids:
        if ch_id not in novel_chapter_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"章节 {ch_id} 不属于此小说",
            )

    # 更新顺序号
    for idx, ch_id in enumerate(reorder_data.chapter_ids, start=1):
        chapter = db.query(Chapter).filter(Chapter.id == ch_id).first()
        chapter.order_num = idx

    db.commit()
    db.refresh(novel)

    # 返回更新后的列表
    return await list_chapters(novel_id, current_user, db)


@router.get("/{chapter_id}", response_model=ChapterDetail)
async def get_chapter(
    novel_id: int,
    chapter_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    根据ID获取章节详情

    参数:
        novel_id: 小说ID
        chapter_id: 章节ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        章节详情及导航信息

    异常:
        HTTPException: 章节不存在或无权访问时抛出
    """
    novel = get_accessible_novel(novel_id, current_user, db)
    chapter = get_chapter_helper(chapter_id, novel_id, db)

    return _chapter_to_detail(chapter, novel, db)


@router.put("/{chapter_id}", response_model=ChapterDetail)
async def update_chapter(
    novel_id: int,
    chapter_id: int,
    chapter_data: ChapterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新章节内容

    参数:
        novel_id: 小说ID
        chapter_id: 章节ID
        chapter_data: 更新数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        更新后的章节详情

    异常:
        HTTPException: 章节不存在或非作者时抛出
    """
    novel = get_owned_novel(novel_id, current_user, db)
    chapter = get_chapter_helper(chapter_id, novel_id, db)

    # 更新提供的字段
    update_data = chapter_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chapter, field, value)

    db.commit()
    db.refresh(chapter)

    return _chapter_to_detail(chapter, novel, db)


@router.delete("/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    novel_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除章节

    参数:
        novel_id: 小说ID
        chapter_id: 章节ID
        current_user: 当前登录用户
        db: 数据库会话

    异常:
        HTTPException: 章节不存在或非作者时抛出
    """
    get_owned_novel(novel_id, current_user, db)
    chapter = get_chapter_helper(chapter_id, novel_id, db)

    db.delete(chapter)
    db.commit()


# ============================================================
# 互动小说功能端点
# ============================================================


@router.post("/{chapter_id}/select-choice", response_model=ChoiceResult)
async def select_choice(
    novel_id: int,
    chapter_id: int,
    choice: ChoiceSelection,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    提交用户在互动章节的选择

    **功能**：
    - 记录用户选择到阅读进度
    - 更新当前章节到目标分支章节
    - 检测并记录结局解锁

    **参数**：
    - choice_id: 选择第几个选项（0-based索引）

    **返回**：
    - next_chapter_id: 下一章节ID
    - is_ending: 是否到达结局
    """
    # 验证小说存在
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"小说 ID {novel_id} 不存在"
        )

    # 验证章节存在
    chapter = db.query(Chapter).filter(
        Chapter.id == chapter_id,
        Chapter.novel_id == novel_id
    ).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="章节不存在"
        )

    # 获取该章节的所有分支选项（子章节）- 利用 ORM 关系
    child_chapters = sorted(chapter.children, key=lambda x: x.order_num)

    if not child_chapters:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该章节没有分支选项"
        )

    if choice.choice_id >= len(child_chapters):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的选择：choice_id {choice.choice_id}，可选范围 0-{len(child_chapters)-1}"
        )

    # 获取目标章节
    next_chapter = child_chapters[choice.choice_id]

    # 获取或创建阅读进度
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.novel_id == novel_id
    ).first()

    if not progress:
        progress = ReadingProgress(
            user_id=current_user.id,
            novel_id=novel_id,
            chapter_id=next_chapter.id,
            choices_made="[]",
            endings_unlocked="[]"
        )
        db.add(progress)
    else:
        progress.chapter_id = next_chapter.id

    # 记录选择到 choices_made
    choices_history = json.loads(progress.choices_made or "[]")
    choices_history.append({
        "chapter_id": chapter_id,
        "choice_id": choice.choice_id,
        "choice_text": next_chapter.choice_text or f"选项 {choice.choice_id + 1}",
        "timestamp": datetime.utcnow().isoformat()
    })
    progress.choices_made = json.dumps(choices_history, ensure_ascii=False)

    # 检测是否为结局章节
    is_ending = bool(next_chapter.is_ending)
    ending_type = None

    if is_ending:
        ending_type = next_chapter.ending_type
        endings = json.loads(progress.endings_unlocked or "[]")
        ending_id = f"ending_{next_chapter.id}"
        if ending_id not in endings:
            endings.append(ending_id)
            progress.endings_unlocked = json.dumps(endings, ensure_ascii=False)

    db.commit()

    return ChoiceResult(
        next_chapter_id=next_chapter.id,
        is_ending=is_ending,
        ending_type=ending_type
    )




@router.post("/{chapter_id}/mark-ending", response_model=ChapterDetail)
async def mark_ending(
    novel_id: int,
    chapter_id: int,
    mark_data: MarkEndingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    标记章节为结局（仅创作者可用）

    **参数**：
    - ending_type: 结局类型（happy/tragic/hidden）

    **返回**：更新后的章节详情
    """
    # 验证权限
    novel = get_owned_novel(novel_id, current_user, db)
    chapter = get_chapter_helper(chapter_id, novel_id, db)

    # 验证 ending_type
    valid_types = ["happy", "tragic", "hidden"]
    if mark_data.ending_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的结局类型，支持: {', '.join(valid_types)}"
        )

    # 标记为结局
    chapter.is_ending = 1
    chapter.ending_type = mark_data.ending_type

    db.commit()
    db.refresh(chapter)

    return _chapter_to_detail(chapter, novel, db)


@router.delete("/{chapter_id}/mark-ending", response_model=ChapterDetail)
async def unmark_ending(
    novel_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    取消章节的结局标记（仅创作者可用）

    **返回**：更新后的章节详情
    """
    # 验证权限
    novel = get_owned_novel(novel_id, current_user, db)
    chapter = get_chapter_helper(chapter_id, novel_id, db)

    # 取消结局标记
    chapter.is_ending = 0
    chapter.ending_type = None

    db.commit()
    db.refresh(chapter)

    return _chapter_to_detail(chapter, novel, db)


def _chapter_to_detail(chapter: Chapter, novel: Novel, db: Session) -> ChapterDetail:
    """将章节模型转换为详情响应格式"""
    # 获取导航信息
    sorted_chapters = sorted(novel.chapters, key=lambda x: x.order_num)
    current_idx = next(
        (i for i, ch in enumerate(sorted_chapters) if ch.id == chapter.id),
        -1
    )

    prev_chapter = sorted_chapters[current_idx - 1] if current_idx > 0 else None
    next_chapter = (
        sorted_chapters[current_idx + 1]
        if current_idx < len(sorted_chapters) - 1
        else None
    )

    return ChapterDetail(
        id=chapter.id,
        novel_id=chapter.novel_id,
        title=chapter.title,
        content=chapter.content,
        order_num=chapter.order_num,
        word_count=chapter.word_count,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
        navigation=ChapterNavigation(
            prev_chapter_id=prev_chapter.id if prev_chapter else None,
            prev_chapter_title=prev_chapter.title if prev_chapter else None,
            next_chapter_id=next_chapter.id if next_chapter else None,
            next_chapter_title=next_chapter.title if next_chapter else None,
        ),
    )
