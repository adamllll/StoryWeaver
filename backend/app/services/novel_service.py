"""
小说服务 - 处理小说相关的业务逻辑

这个服务封装了所有小说相关的业务逻辑，遵循单一职责原则。
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload, selectinload
from datetime import datetime

from ..models.novel import Novel
from ..models.chapter import Chapter
from ..schemas.novel import NovelCreate, NovelUpdate


class NovelService:
    """小说服务类"""

    def __init__(self, db: Session):
        self.db = db

    def get_novel_by_id(
        self,
        novel_id: int,
        user_id: Optional[int] = None,
        load_relations: bool = False
    ) -> Optional[Novel]:
        """
        根据 ID 获取小说

        参数:
            novel_id: 小说 ID
            user_id: 用户 ID（用于权限验证）
            load_relations: 是否预加载关联数据

        返回:
            Novel 对象，如果不存在则返回 None
        """
        query = self.db.query(Novel).filter(Novel.id == novel_id)

        # 预加载关联数据（避免 N+1 查询）
        if load_relations:
            query = query.options(
                joinedload(Novel.author),
                selectinload(Novel.chapters),
                selectinload(Novel.characters),
            )

        novel = query.first()

        # 权限验证
        if novel and user_id:
            if novel.user_id != user_id and novel.status != "published":
                return None  # 非作者且未发布，无权访问

        return novel

    def create_novel(
        self,
        novel_data: NovelCreate,
        user_id: int
    ) -> Novel:
        """
        创建新小说

        参数:
            novel_data: 小说创建数据
            user_id: 用户 ID

        返回:
            创建的 Novel 对象
        """
        novel = Novel(
            user_id=user_id,
            title=novel_data.title,
            description=novel_data.description,
            outline=novel_data.outline,
            category=novel_data.category,
            cover_url=novel_data.cover_url,
            status="draft",
            cached_chapter_count=0,
            cached_word_count=0,
        )

        self.db.add(novel)
        self.db.commit()
        self.db.refresh(novel)

        return novel

    def update_novel(
        self,
        novel_id: int,
        novel_data: NovelUpdate,
        user_id: int
    ) -> Optional[Novel]:
        """
        更新小说

        参数:
            novel_id: 小说 ID
            novel_data: 更新数据
            user_id: 用户 ID

        返回:
            更新后的 Novel 对象，如果不存在或无权限则返回 None
        """
        novel = self.get_novel_by_id(novel_id, user_id)

        if not novel or novel.user_id != user_id:
            return None

        # 更新字段
        update_data = novel_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(novel, field, value)

        novel.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(novel)

        return novel

    def delete_novel(
        self,
        novel_id: int,
        user_id: int,
        soft_delete: bool = True
    ) -> bool:
        """
        删除小说

        参数:
            novel_id: 小说 ID
            user_id: 用户 ID
            soft_delete: 是否软删除

        返回:
            True 如果删除成功
        """
        novel = self.get_novel_by_id(novel_id, user_id)

        if not novel or novel.user_id != user_id:
            return False

        if soft_delete:
            # 软删除
            novel.deleted_at = datetime.utcnow()
            self.db.commit()
        else:
            # 硬删除
            self.db.delete(novel)
            self.db.commit()

        return True

    def update_cached_counts(self, novel_id: int) -> None:
        """
        更新小说的缓存计数（章节数和字数）

        参数:
            novel_id: 小说 ID
        """
        novel = self.db.query(Novel).filter(Novel.id == novel_id).first()

        if not novel:
            return

        # 计算章节数
        chapter_count = self.db.query(Chapter).filter(
            Chapter.novel_id == novel_id
        ).count()

        # 计算总字数
        chapters = self.db.query(Chapter).filter(
            Chapter.novel_id == novel_id
        ).all()

        word_count = sum(
            len(ch.content) if ch.content else 0
            for ch in chapters
        )

        # 更新缓存
        novel.cached_chapter_count = chapter_count
        novel.cached_word_count = word_count

        self.db.commit()

    def list_novels(
        self,
        user_id: Optional[int] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Novel], int]:
        """
        获取小说列表

        参数:
            user_id: 用户 ID（筛选特定用户的小说）
            category: 分类筛选
            status: 状态筛选
            page: 页码
            page_size: 每页数量

        返回:
            (小说列表, 总数) 元组
        """
        query = self.db.query(Novel).filter(Novel.deleted_at.is_(None))

        # 筛选条件
        if user_id:
            query = query.filter(Novel.user_id == user_id)

        if category:
            query = query.filter(Novel.category == category)

        if status:
            query = query.filter(Novel.status == status)

        # 获取总数
        total = query.count()

        # 预加载关联数据（避免 N+1 查询）
        offset = (page - 1) * page_size
        novels = (
            query
            .options(joinedload(Novel.author))
            .order_by(Novel.updated_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        return novels, total
