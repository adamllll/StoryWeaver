"""
章节服务 - 处理章节相关的业务逻辑

这个服务封装了所有章节相关的业务逻辑，遵循单一职责原则。
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.chapter import Chapter
from ..models.novel import Novel
from ..schemas.chapter import ChapterCreate, ChapterUpdate
from .novel_service import NovelService


class ChapterService:
    """章节服务类"""

    def __init__(self, db: Session):
        self.db = db
        self.novel_service = NovelService(db)

    def get_chapter_by_id(
        self,
        chapter_id: int,
        user_id: Optional[int] = None
    ) -> Optional[Chapter]:
        """
        根据 ID 获取章节

        参数:
            chapter_id: 章节 ID
            user_id: 用户 ID（用于权限验证）

        返回:
            Chapter 对象，如果不存在或无权限则返回 None
        """
        chapter = self.db.query(Chapter).filter(Chapter.id == chapter_id).first()

        if not chapter:
            return None

        # 权限验证
        if user_id:
            novel = chapter.novel
            if novel.user_id != user_id and novel.status != "published":
                return None

        return chapter

    def create_chapter(
        self,
        chapter_data: ChapterCreate,
        novel_id: int,
        user_id: int
    ) -> Optional[Chapter]:
        """
        创建新章节

        参数:
            chapter_data: 章节创建数据
            novel_id: 小说 ID
            user_id: 用户 ID

        返回:
            创建的 Chapter 对象，如果无权限则返回 None
        """
        # 验证小说权限
        novel = self.novel_service.get_novel_by_id(novel_id, user_id)
        if not novel or novel.user_id != user_id:
            return None

        # 获取下一个章节序号
        max_order = self.db.query(Chapter).filter(
            Chapter.novel_id == novel_id
        ).count()

        chapter = Chapter(
            novel_id=novel_id,
            title=chapter_data.title,
            content=chapter_data.content,
            order_num=max_order + 1,
            parent_chapter_id=chapter_data.parent_chapter_id,
        )

        self.db.add(chapter)
        self.db.commit()
        self.db.refresh(chapter)

        # 更新小说的缓存计数
        self.novel_service.update_cached_counts(novel_id)

        return chapter

    def update_chapter(
        self,
        chapter_id: int,
        chapter_data: ChapterUpdate,
        user_id: int
    ) -> Optional[Chapter]:
        """
        更新章节

        参数:
            chapter_id: 章节 ID
            chapter_data: 更新数据
            user_id: 用户 ID

        返回:
            更新后的 Chapter 对象，如果不存在或无权限则返回 None
        """
        chapter = self.get_chapter_by_id(chapter_id, user_id)

        if not chapter or chapter.novel.user_id != user_id:
            return None

        # 更新字段
        update_data = chapter_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(chapter, field, value)

        chapter.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(chapter)

        # 如果内容改变，更新小说的缓存字数
        if 'content' in update_data:
            self.novel_service.update_cached_counts(chapter.novel_id)

        return chapter

    def delete_chapter(
        self,
        chapter_id: int,
        user_id: int
    ) -> bool:
        """
        删除章节

        参数:
            chapter_id: 章节 ID
            user_id: 用户 ID

        返回:
            True 如果删除成功
        """
        chapter = self.get_chapter_by_id(chapter_id, user_id)

        if not chapter or chapter.novel.user_id != user_id:
            return False

        novel_id = chapter.novel_id

        self.db.delete(chapter)
        self.db.commit()

        # 更新小说的缓存计数
        self.novel_service.update_cached_counts(novel_id)

        return True

    def list_chapters(
        self,
        novel_id: int,
        user_id: Optional[int] = None
    ) -> List[Chapter]:
        """
        获取小说的所有章节

        参数:
            novel_id: 小说 ID
            user_id: 用户 ID（用于权限验证）

        返回:
            章节列表
        """
        # 验证小说权限
        novel = self.novel_service.get_novel_by_id(novel_id, user_id)
        if not novel:
            return []

        chapters = (
            self.db.query(Chapter)
            .filter(Chapter.novel_id == novel_id)
            .order_by(Chapter.order_num)
            .all()
        )

        return chapters

    def reorder_chapters(
        self,
        novel_id: int,
        chapter_orders: List[tuple[int, int]],  # [(chapter_id, new_order), ...]
        user_id: int
    ) -> bool:
        """
        重新排序章节

        参数:
            novel_id: 小说 ID
            chapter_orders: 章节 ID 和新序号的列表
            user_id: 用户 ID

        返回:
            True 如果成功
        """
        # 验证小说权限
        novel = self.novel_service.get_novel_by_id(novel_id, user_id)
        if not novel or novel.user_id != user_id:
            return False

        # 更新章节序号
        for chapter_id, new_order in chapter_orders:
            chapter = self.db.query(Chapter).filter(
                Chapter.id == chapter_id,
                Chapter.novel_id == novel_id
            ).first()

            if chapter:
                chapter.order_num = new_order

        self.db.commit()

        return True
