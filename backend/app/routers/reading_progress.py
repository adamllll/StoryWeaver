"""阅读进度路由 - 管理用户阅读进度和选择历史"""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.chapter import ReadingProgress, Chapter
from ..models.novel import Novel
from ..schemas.chapter import (
    ReadingProgressResponse,
    ReadingProgressUpdate,
    ChoiceHistory,
    EndingInfo,
    EndingsList,
)
from ..utils.auth import get_current_user

router = APIRouter()


@router.get(
    "/novels/{novel_id}/reading-progress",
    response_model=ReadingProgressResponse,
    summary="获取阅读进度",
)
async def get_reading_progress(
    novel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取当前用户在指定小说的阅读进度

    **返回内容**：
    - 当前阅读章节
    - 选择历史记录
    - 已解锁的结局
    """
    # 验证小说存在
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"小说 ID {novel_id} 不存在"
        )

    # 获取阅读进度
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.novel_id == novel_id
    ).first()

    # 如果没有进度记录，创建默认进度（从第一章开始）
    if not progress:
        first_chapter = db.query(Chapter).filter(
            Chapter.novel_id == novel_id
        ).order_by(Chapter.order_num).first()

        if not first_chapter:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该小说还没有章节"
            )

        progress = ReadingProgress(
            user_id=current_user.id,
            novel_id=novel_id,
            chapter_id=first_chapter.id,
            choices_made="[]",
            endings_unlocked="[]"
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # 获取当前章节信息
    chapter = db.query(Chapter).filter(Chapter.id == progress.chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="当前章节不存在"
        )

    # 计算阅读进度百分比
    total_chapters = db.query(Chapter).filter(Chapter.novel_id == novel_id).count()
    if total_chapters > 0:
        # 计算当前章节之前有多少章节（按order_num排序）
        chapter_index = db.query(Chapter).filter(
            Chapter.novel_id == novel_id,
            Chapter.order_num < chapter.order_num
        ).count() + 1  # +1 包括当前章节
        progress_pct = round((chapter_index / total_chapters) * 100, 2)
    else:
        progress_pct = 0.0

    # 解析 JSON 字段
    choices_made = json.loads(progress.choices_made or "[]")
    endings_unlocked = json.loads(progress.endings_unlocked or "[]")

    # 构建响应
    return ReadingProgressResponse(
        novel_id=progress.novel_id,
        current_chapter_id=progress.chapter_id,  # Pydantic会自动映射到chapter_id
        chapter_title=chapter.title,
        progress_percentage=progress_pct,
        choices_made=[ChoiceHistory(**choice) for choice in choices_made],
        endings_unlocked=endings_unlocked,
        created_at=progress.created_at,
        updated_at=progress.updated_at
    )


@router.post(
    "/novels/{novel_id}/reading-progress",
    response_model=ReadingProgressResponse,
    summary="更新阅读进度",
)
async def update_reading_progress(
    novel_id: int,
    update_data: ReadingProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新当前用户在指定小说的阅读进度

    **注意**：
    - 仅更新当前阅读章节
    - 选择历史由 select-choice 端点自动记录
    """
    # 验证小说存在
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"小说 ID {novel_id} 不存在"
        )

    # 验证章节存在且属于该小说
    chapter = db.query(Chapter).filter(
        Chapter.id == update_data.chapter_id,
        Chapter.novel_id == novel_id
    ).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="章节不存在或不属于该小说"
        )

    # 获取或创建阅读进度
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.novel_id == novel_id
    ).first()

    if not progress:
        progress = ReadingProgress(
            user_id=current_user.id,
            novel_id=novel_id,
            chapter_id=update_data.chapter_id,
            choices_made="[]",
            endings_unlocked="[]"
        )
        db.add(progress)
    else:
        progress.chapter_id = update_data.chapter_id

    db.commit()
    db.refresh(progress)

    # 获取当前章节信息
    chapter = db.query(Chapter).filter(Chapter.id == progress.chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="当前章节不存在"
        )

    # 计算阅读进度百分比
    total_chapters = db.query(Chapter).filter(Chapter.novel_id == novel_id).count()
    if total_chapters > 0:
        chapter_index = db.query(Chapter).filter(
            Chapter.novel_id == novel_id,
            Chapter.order_num < chapter.order_num
        ).count() + 1
        progress_pct = round((chapter_index / total_chapters) * 100, 2)
    else:
        progress_pct = 0.0

    # 解析并返回
    choices_made = json.loads(progress.choices_made or "[]")
    endings_unlocked = json.loads(progress.endings_unlocked or "[]")

    return ReadingProgressResponse(
        novel_id=progress.novel_id,
        current_chapter_id=progress.chapter_id,  # Pydantic会自动映射到chapter_id
        chapter_title=chapter.title,
        progress_percentage=progress_pct,
        choices_made=[ChoiceHistory(**choice) for choice in choices_made],
        endings_unlocked=endings_unlocked,
        created_at=progress.created_at,
        updated_at=progress.updated_at
    )


@router.delete(
    "/novels/{novel_id}/reading-progress",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="重置阅读进度",
)
async def reset_reading_progress(
    novel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    重置当前用户在指定小说的阅读进度

    **效果**：
    - 删除阅读进度记录
    - 清空选择历史
    - 清空已解锁结局
    """
    # 查找进度记录
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.novel_id == novel_id
    ).first()

    if progress:
        db.delete(progress)
        db.commit()

    return None


@router.get(
    "/novels/{novel_id}/choice-history",
    response_model=List[ChoiceHistory],
    summary="获取选择历史",
)
async def get_choice_history(
    novel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取当前用户在指定互动小说中的所有选择历史

    **返回**：按时间顺序排列的选择记录
    """
    # 获取阅读进度
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.novel_id == novel_id
    ).first()

    if not progress:
        return []

    # 解析选择历史
    choices_made = json.loads(progress.choices_made or "[]")
    return [ChoiceHistory(**choice) for choice in choices_made]


@router.get(
    "/novels/{novel_id}/endings",
    response_model=EndingsList,
    summary="获取小说的所有结局",
)
async def get_endings(
    novel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取小说的所有结局列表

    **返回**：
    - total_endings: 总结局数量
    - unlocked_count: 当前用户已解锁数量
    - endings: 结局详细信息列表
    """
    # 验证小说存在
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"小说 ID {novel_id} 不存在"
        )

    # 获取所有标记为结局的章节
    ending_chapters = db.query(Chapter).filter(
        Chapter.novel_id == novel_id,
        Chapter.is_ending == 1
    ).all()

    # 获取用户进度
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.novel_id == novel_id
    ).first()

    unlocked_endings = set()
    if progress and progress.endings_unlocked:
        unlocked_endings = set(json.loads(progress.endings_unlocked))

    # 构建结局列表
    endings = []
    for chapter in ending_chapters:
        ending_id = f"ending_{chapter.id}"
        endings.append(EndingInfo(
            ending_id=ending_id,
            chapter_id=chapter.id,
            title=chapter.title,
            ending_type=chapter.ending_type or "normal",
            is_unlocked=ending_id in unlocked_endings,
            is_hidden=(chapter.ending_type == "hidden")
        ))

    return EndingsList(
        total_endings=len(endings),
        unlocked_count=len(unlocked_endings),
        endings=endings
    )
