"""数据库查询辅助函数

统一管理常用的数据库查询逻辑，避免代码重复（DRY原则）
本小姐的专业抽象！(￣▽￣)ノ
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import Novel, Chapter, User


def get_accessible_novel(
    novel_id: int, current_user: User | None, db: Session
) -> Novel:
    """获取当前用户可访问的小说

    访问规则：
    - 如果小说状态为published，任何人都可以访问
    - 如果小说状态为draft，只有作者可以访问

    参数:
        novel_id: 小说ID
        current_user: 当前用户（可为None，表示未登录）
        db: 数据库会话

    返回:
        Novel: 小说对象

    异常:
        HTTPException: 小说不存在或无权访问时抛出
    """
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {novel_id} 的小说",
        )

    is_owner = current_user and current_user.id == novel.user_id
    if novel.status != "published" and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限访问此小说",
        )

    return novel


def get_owned_novel(novel_id: int, current_user: User, db: Session) -> Novel:
    """获取当前用户拥有的小说

    只有小说的作者才能访问，用于修改、删除等操作

    参数:
        novel_id: 小说ID
        current_user: 当前用户
        db: 数据库会话

    返回:
        Novel: 小说对象

    异常:
        HTTPException: 小说不存在或非作者时抛出
    """
    novel = db.query(Novel).filter(Novel.id == novel_id).first()
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {novel_id} 的小说",
        )

    if novel.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限修改此小说",
        )

    return novel


def get_chapter(chapter_id: int, novel_id: int, db: Session) -> Chapter:
    """根据ID获取章节

    参数:
        chapter_id: 章节ID
        novel_id: 小说ID（用于验证章节属于该小说）
        db: 数据库会话

    返回:
        Chapter: 章节对象

    异常:
        HTTPException: 章节不存在时抛出
    """
    chapter = db.query(Chapter).filter(
        Chapter.id == chapter_id,
        Chapter.novel_id == novel_id,
    ).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {chapter_id} 的章节",
        )
    return chapter
