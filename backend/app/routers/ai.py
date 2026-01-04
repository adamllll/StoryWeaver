"""AI路由 - AI内容生成相关端点（简化版）

本模块只负责：
- 接收 HTTP 请求
- 验证权限
- 调用 Service 层
- 返回响应

所有业务逻辑已迁移到 services/ai_generation_service.py
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware import ai_rate_limiter
from ..models import Novel, Chapter, User
from ..schemas import (
    OutlineRequest,
    OutlineResponse,
    ContinueRequest,
    ContinueResponse,
    ExpandRequest,
    ExpandResponse,
    CharacterRequest,
    CharacterResponse,
    GeneratedCharacter,
    FormatOptimizeRequest,
    FormatOptimizeResponse,
    FormatOptimizeBatchRequest,
    FormatOptimizeBatchResponse,
    OptimizedChapterResult,
    RewriteRequest,
    RewriteResponse,
)
from ..services import ai_generation_service
from ..utils.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI生成"])
logger = logging.getLogger(__name__)


@router.post("/outline", response_model=OutlineResponse)
async def generate_outline(
    request: OutlineRequest,
    current_user: User = Depends(get_current_user),
):
    """使用AI生成小说大纲"""
    ai_rate_limiter.check(current_user.id)

    try:
        title, description, outline, usage = await ai_generation_service.generate_outline(
            category=request.category,
            keywords=request.keywords,
            chapter_count=request.chapter_count,
            target_words=request.target_words,
            target_audience=request.target_audience,
            protagonist=request.protagonist,
            background=request.background,
            special_requirements=request.special_requirements,
        )

        return OutlineResponse(
            title=title,
            description=description,
            outline=outline,
            usage=usage,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI 大纲生成失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )


@router.post("/continue", response_model=ContinueResponse)
async def continue_chapter(
    request: ContinueRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """使用AI续写章节内容"""
    ai_rate_limiter.check(current_user.id)

    # 获取小说上下文
    novel = db.query(Novel).filter(Novel.id == request.novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该小说",
        )

    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此小说",
        )

    # 获取章节（如果有）
    chapter = None
    if request.chapter_id:
        chapter = db.query(Chapter).filter(
            Chapter.id == request.chapter_id,
            Chapter.novel_id == request.novel_id,
        ).first()

    try:
        content, title, word_count, usage = await ai_generation_service.continue_chapter(
            novel=novel,
            chapter=chapter,
            word_count=request.word_count,
            mode=request.mode or "continue",
            chapter_outline=request.chapter_outline,
            style=request.style,
            special_requirements=request.special_requirements,
            cursor_position=request.cursor_position,
            db=db,
        )

        return ContinueResponse(
            content=content,
            title=title,
            word_count=word_count,
            usage=usage,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI 续写失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )


@router.post("/expand", response_model=ExpandResponse)
async def expand_text(
    request: ExpandRequest,
    current_user: User = Depends(get_current_user),
):
    """将简短文本扩写为更详细的版本"""
    ai_rate_limiter.check(current_user.id)

    try:
        expanded_text, word_count, usage = await ai_generation_service.expand_text(
            text=request.text,
            style=request.style,
            word_count=request.word_count,
            chapter_title=request.chapter_title,
            context_before=request.context_before,
            context_after=request.context_after,
            position_hint=request.position_hint,
        )

        return ExpandResponse(
            expanded_text=expanded_text,
            word_count=word_count,
            usage=usage,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI 扩写失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )


@router.post("/character", response_model=CharacterResponse)
async def generate_character(
    request: CharacterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """使用AI生成角色设定"""
    ai_rate_limiter.check(current_user.id)

    # 获取小说上下文
    novel = db.query(Novel).filter(Novel.id == request.novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该小说",
        )

    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限为此小说生成角色",
        )

    try:
        character_data, usage = await ai_generation_service.generate_character(
            novel=novel,
            role_type=request.role_type,
            design_direction=request.design_direction,
            character_name=request.character_name,
        )

        character = GeneratedCharacter(**character_data)

        return CharacterResponse(
            character=character,
            usage=usage,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI 角色生成失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )


@router.post("/format-optimize", response_model=FormatOptimizeResponse)
async def format_optimize_chapter(
    request: FormatOptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """使用AI优化单个章节的格式和表达"""
    ai_rate_limiter.check(current_user.id)

    # 获取章节信息
    chapter = db.query(Chapter).filter(Chapter.id == request.chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该章节",
        )

    # 获取小说信息并验证权限
    novel = db.query(Novel).filter(Novel.id == chapter.novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该小说",
        )

    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此小说的章节",
        )

    # 检查章节内容是否为空
    if not chapter.content or len(chapter.content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="章节内容为空，无法优化",
        )

    try:
        optimized_content, usage = await ai_generation_service.format_optimize(
            content=chapter.content,
            chapter_title=chapter.title,
            chapter_order=chapter.order_num,
            category=novel.category,
            optimization_focus=request.optimization_focus,
        )

        return FormatOptimizeResponse(
            optimized_content=optimized_content,
            original_word_count=len(chapter.content),
            optimized_word_count=len(optimized_content),
            usage=usage,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI 格式优化失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI优化失败: {str(e)}",
        )


@router.post("/format-optimize-batch", response_model=FormatOptimizeBatchResponse)
async def format_optimize_batch(
    request: FormatOptimizeBatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """批量优化多个章节的格式和表达"""
    chapter_count = len(request.chapter_ids)
    ai_rate_limiter.check(current_user.id, cost=chapter_count)

    # 验证小说权限
    novel = db.query(Novel).filter(Novel.id == request.novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该小说",
        )

    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此小说",
        )

    # 获取所有章节
    chapters = db.query(Chapter).filter(
        Chapter.id.in_(request.chapter_ids),
        Chapter.novel_id == request.novel_id,
    ).all()

    if not chapters:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到任何有效章节",
        )

    # 批量优化
    results = []
    success_count = 0
    failed_count = 0
    total_prompt_tokens = 0
    total_completion_tokens = 0
    total_tokens = 0

    for chapter in chapters:
        # 跳过空章节
        if not chapter.content or len(chapter.content.strip()) == 0:
            results.append(OptimizedChapterResult(
                chapter_id=chapter.id,
                chapter_title=chapter.title,
                success=False,
                error_message="章节内容为空",
            ))
            failed_count += 1
            continue

        try:
            optimized_content, usage = await ai_generation_service.format_optimize(
                content=chapter.content,
                chapter_title=chapter.title,
                chapter_order=chapter.order_num,
                category=novel.category,
                optimization_focus=request.optimization_focus,
            )

            total_prompt_tokens += usage.prompt_tokens
            total_completion_tokens += usage.completion_tokens
            total_tokens += usage.total_tokens

            results.append(OptimizedChapterResult(
                chapter_id=chapter.id,
                chapter_title=chapter.title,
                success=True,
                optimized_content=optimized_content,
                original_word_count=len(chapter.content),
                optimized_word_count=len(optimized_content),
            ))
            success_count += 1

        except Exception as e:
            logger.error(f"章节 {chapter.id} 优化失败: {str(e)}")
            results.append(OptimizedChapterResult(
                chapter_id=chapter.id,
                chapter_title=chapter.title,
                success=False,
                error_message=str(e),
            ))
            failed_count += 1

    from ..schemas import AIUsage
    return FormatOptimizeBatchResponse(
        results=results,
        success_count=success_count,
        failed_count=failed_count,
        total_usage=AIUsage(
            prompt_tokens=total_prompt_tokens,
            completion_tokens=total_completion_tokens,
            total_tokens=total_tokens,
        ),
    )


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite_text(
    request: RewriteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """使用AI重写指定文本"""
    ai_rate_limiter.check(current_user.id)

    # 获取小说上下文
    novel = db.query(Novel).filter(Novel.id == request.novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该小说",
        )

    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此小说",
        )

    try:
        rewritten_text, usage = await ai_generation_service.rewrite_text(
            original_text=request.original_text,
            rewrite_style=request.rewrite_style,
            novel=novel,
            special_requirements=request.special_requirements,
        )

        return RewriteResponse(
            rewritten_text=rewritten_text,
            original_word_count=len(request.original_text),
            rewritten_word_count=len(rewritten_text),
            usage=usage,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI 重写失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )
