"""
冒险游戏导出功能路由

包含：导出为文件、获取摘要
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from urllib.parse import quote

from ...database import get_db
from ...models import User, Adventure
from ...utils.auth import get_current_user
from ...services.export_service import (
    compile_adventure_to_novel,
    export_to_txt,
    export_to_markdown,
    get_adventure_summary
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{adventure_id}/export")
async def export_adventure(
    adventure_id: int,
    format: str = "txt",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    导出冒险为完整小说文件

    支持格式：
    - txt: 纯文本格式
    - md/markdown: Markdown 格式

    返回：
    - 文件内容（text/plain 或 text/markdown）
    """
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    # 整理小说数据
    try:
        novel_data = compile_adventure_to_novel(db, adventure_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile novel: {str(e)}"
        )

    # 根据格式导出
    format = format.lower()
    if format == "txt":
        content = export_to_txt(novel_data)
        media_type = "text/plain; charset=utf-8"
        filename = f"{adventure.title or 'adventure'}.txt"
    elif format in ["md", "markdown"]:
        content = export_to_markdown(novel_data)
        media_type = "text/markdown; charset=utf-8"
        filename = f"{adventure.title or 'adventure'}.md"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format: {format}. Supported formats: txt, md"
        )

    # 返回文件（使用 RFC 6266 标准对文件名进行 URL 编码以支持中文）
    filename_encoded = quote(filename)
    return Response(
        content=content.encode("utf-8"),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename_encoded}"
        }
    )


@router.get("/{adventure_id}/summary")
async def get_summary(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取冒险摘要（用于分享）

    返回简短的摘要信息，包括：
    - 标题
    - 类型和主角
    - 简介（前100字）
    - 统计信息
    - 结局（如已完成）
    """
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    try:
        summary = get_adventure_summary(db, adventure_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )

    return {
        "adventure_id": adventure_id,
        "summary": summary
    }
