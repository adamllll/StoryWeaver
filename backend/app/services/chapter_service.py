"""
章节服务 - 处理章节相关的业务逻辑

这个服务封装了所有章节相关的业务逻辑，遵循单一职责原则。
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from ..models.chapter import Chapter
from ..schemas.chapter import ChapterCreate, ChapterUpdate


class ChapterService:
    """章节服务类"""

    def __init__(self, db: Session):
        self.db = db

    def get_chapter_by_id(
        self,
        chapter_id: int,
        load_relations: bool = False
    ) -> Optional[Chapter]:
        """
        根据 ID 获取章节（不包含权限验证）

        参数:
            chapter_id: 章节 ID
            load_relations: 是否预加载关联数据

        返回:
            Chapter 对象，如果不存在则返回 None

        注意:
            本方法不进行权限验证，调用方需要自行验证权限
        """
        query = self.db.query(Chapter).filter(Chapter.id == chapter_id)

        if load_relations:
            query = query.options(
                joinedload(Chapter.novel),
                joinedload(Chapter.children),
            )

        return query.first()

    def list_chapters(
        self,
        novel_id: int,
        include_branches: bool = False
    ) -> List[Chapter]:
        """
        获取小说的章节列表

        参数:
            novel_id: 小说 ID
            include_branches: 是否包含分支章节

        返回:
            章节列表，按 order_num 排序
        """
        query = self.db.query(Chapter).filter(Chapter.novel_id == novel_id)

        if not include_branches:
            query = query.filter(Chapter.parent_chapter_id.is_(None))

        return query.order_by(Chapter.order_num).all()

    def get_next_order_num(self, novel_id: int) -> float:
        """
        获取下一个可用的章节序号

        参数:
            novel_id: 小说 ID

        返回:
            下一个可用的序号（主线章节）
        """
        max_order = self.db.query(Chapter.order_num).filter(
            Chapter.novel_id == novel_id,
            Chapter.parent_chapter_id.is_(None)
        ).order_by(Chapter.order_num.desc()).first()

        if max_order:
            return max_order[0] + 1.0
        return 1.0

    def create_chapter(
        self,
        novel_id: int,
        chapter_data: ChapterCreate
    ) -> Chapter:
        """
        创建新章节（不包含权限验证）

        参数:
            novel_id: 小说 ID
            chapter_data: 章节创建数据

        返回:
            创建的 Chapter 对象

        注意:
            本方法不进行权限验证，调用方需要自行验证权限
        """
        # 自动计算 order_num
        if chapter_data.parent_chapter_id:
            parent = self.get_chapter_by_id(chapter_data.parent_chapter_id)
            if not parent:
                raise ValueError(f"父章节不存在: {chapter_data.parent_chapter_id}")

            branch_count = self.db.query(Chapter).filter(
                Chapter.parent_chapter_id == chapter_data.parent_chapter_id
            ).count()

            order_num = parent.order_num + (branch_count + 1) * 0.1
        else:
            order_num = self.get_next_order_num(novel_id)

        chapter = Chapter(
            novel_id=novel_id,
            title=chapter_data.title,
            content=chapter_data.content or "",
            order_num=order_num,
            parent_chapter_id=chapter_data.parent_chapter_id,
            choice_text=chapter_data.choice_text,
        )

        self.db.add(chapter)
        self.db.commit()
        self.db.refresh(chapter)

        return chapter

    def update_chapter(
        self,
        chapter_id: int,
        chapter_data: ChapterUpdate
    ) -> Optional[Chapter]:
        """
        更新章节（不包含权限验证）

        参数:
            chapter_id: 章节 ID
            chapter_data: 更新数据

        返回:
            更新后的 Chapter 对象，如果不存在则返回 None

        注意:
            本方法不进行权限验证，调用方需要自行验证权限
        """
        chapter = self.get_chapter_by_id(chapter_id)

        if not chapter:
            return None

        update_data = chapter_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(chapter, field, value)

        chapter.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(chapter)

        return chapter

    def delete_chapter(self, chapter_id: int) -> bool:
        """
        删除章节（不包含权限验证）

        参数:
            chapter_id: 章节 ID

        返回:
            True 如果删除成功，False 如果章节不存在

        注意:
            本方法不进行权限验证，调用方需要自行验证权限
            删除章节会级联删除其所有分支章节
        """
        chapter = self.get_chapter_by_id(chapter_id)

        if not chapter:
            return False

        self.db.delete(chapter)
        self.db.commit()

        return True

    def reorder_chapters(
        self,
        novel_id: int,
        chapter_ids: List[int]
    ) -> List[Chapter]:
        """
        批量重排章节顺序（不包含权限验证）

        参数:
            novel_id: 小说 ID
            chapter_ids: 章节 ID 列表（按新顺序排列）

        返回:
            重排后的章节列表

        注意:
            本方法不进行权限验证，调用方需要自行验证权限
            只能重排主线章节（没有父章节的章节）
        """
        chapters = []
        for index, chapter_id in enumerate(chapter_ids, start=1):
            chapter = self.get_chapter_by_id(chapter_id)
            if chapter and chapter.novel_id == novel_id and not chapter.parent_chapter_id:
                chapter.order_num = float(index)
                chapters.append(chapter)

        self.db.commit()

        for chapter in chapters:
            self.db.refresh(chapter)

        return chapters

    def get_chapter_navigation(
        self,
        chapter_id: int
    ) -> tuple[Optional[int], Optional[int]]:
        """
        获取章节的上下文导航信息

        参数:
            chapter_id: 章节 ID

        返回:
            (prev_chapter_id, next_chapter_id) 元组
        """
        chapter = self.get_chapter_by_id(chapter_id)
        if not chapter:
            return None, None

        chapters = self.list_chapters(chapter.novel_id, include_branches=False)

        current_index = None
        for i, ch in enumerate(chapters):
            if ch.id == chapter_id:
                current_index = i
                break

        if current_index is None:
            return None, None

        prev_chapter_id = chapters[current_index - 1].id if current_index > 0 else None
        next_chapter_id = chapters[current_index + 1].id if current_index < len(chapters) - 1 else None

        return prev_chapter_id, next_chapter_id
