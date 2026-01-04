"""NovelService 单元测试

本小姐的专业测试：全面覆盖 NovelService 的所有功能！(￣▽￣)ノ
"""
import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.novel_service import NovelService
from app.schemas.novel import NovelCreate, NovelUpdate
from app.models import Novel, User


@pytest.mark.unit
class TestGetNovelById:
    """测试 get_novel_by_id 方法"""

    def test_get_existing_novel(self, db: Session, test_novel: Novel):
        """测试获取存在的小说"""
        service = NovelService(db)
        novel = service.get_novel_by_id(test_novel.id)

        assert novel is not None
        assert novel.id == test_novel.id
        assert novel.title == test_novel.title

    def test_get_nonexistent_novel(self, db: Session):
        """测试获取不存在的小说"""
        service = NovelService(db)
        novel = service.get_novel_by_id(99999)

        assert novel is None

    def test_get_novel_with_relations(self, db: Session, test_novel: Novel, test_user: User):
        """测试预加载关联数据"""
        service = NovelService(db)
        novel = service.get_novel_by_id(test_novel.id, load_relations=True)

        assert novel is not None
        # 验证关联数据已加载（不会触发额外查询）
        assert novel.author is not None
        assert novel.author.username == test_user.username  # 使用实际的测试用户名


@pytest.mark.unit
class TestCreateNovel:
    """测试 create_novel 方法"""

    def test_create_novel_success(self, db: Session, test_user: User):
        """测试成功创建小说"""
        service = NovelService(db)
        novel_data = NovelCreate(
            title="测试小说",
            description="这是一个测试小说",
            category="玄幻",
            outline="第一章：开篇\n第二章：发展"
        )

        novel = service.create_novel(novel_data, test_user.id)

        assert novel.id is not None
        assert novel.title == "测试小说"
        assert novel.description == "这是一个测试小说"
        assert novel.category == "玄幻"
        assert novel.user_id == test_user.id
        assert novel.status == "draft"
        assert novel.cached_chapter_count == 0
        assert novel.cached_word_count == 0

    def test_create_novel_minimal_data(self, db: Session, test_user: User):
        """测试使用最少数据创建小说"""
        service = NovelService(db)
        novel_data = NovelCreate(
            title="最小测试",
            category="言情"
        )

        novel = service.create_novel(novel_data, test_user.id)

        assert novel.id is not None
        assert novel.title == "最小测试"
        assert novel.description is None
        assert novel.outline is None


@pytest.mark.unit
class TestUpdateNovel:
    """测试 update_novel 方法"""

    def test_update_novel_success(self, db: Session, test_novel: Novel):
        """测试成功更新小说"""
        service = NovelService(db)
        update_data = NovelUpdate(
            title="更新后的标题",
            description="更新后的描述"
        )

        updated_novel = service.update_novel(test_novel.id, update_data)

        assert updated_novel is not None
        assert updated_novel.title == "更新后的标题"
        assert updated_novel.description == "更新后的描述"
        assert updated_novel.category == test_novel.category  # 未更新的字段保持不变

    def test_update_nonexistent_novel(self, db: Session):
        """测试更新不存在的小说"""
        service = NovelService(db)
        update_data = NovelUpdate(title="不存在")

        result = service.update_novel(99999, update_data)

        assert result is None

    def test_update_partial_fields(self, db: Session, test_novel: Novel):
        """测试部分字段更新"""
        service = NovelService(db)
        original_title = test_novel.title
        update_data = NovelUpdate(description="只更新描述")

        updated_novel = service.update_novel(test_novel.id, update_data)

        assert updated_novel is not None
        assert updated_novel.title == original_title  # 标题未变
        assert updated_novel.description == "只更新描述"


@pytest.mark.unit
class TestDeleteNovel:
    """测试 delete_novel 方法"""

    def test_soft_delete_novel(self, db: Session, test_novel: Novel):
        """测试软删除小说"""
        service = NovelService(db)

        success = service.delete_novel(test_novel.id, soft_delete=True)

        assert success is True
        # 验证软删除：记录仍存在但有 deleted_at
        novel = db.query(Novel).filter(Novel.id == test_novel.id).first()
        assert novel is not None
        assert novel.deleted_at is not None

    def test_hard_delete_novel(self, db: Session, test_novel: Novel):
        """测试硬删除小说"""
        service = NovelService(db)
        novel_id = test_novel.id

        success = service.delete_novel(novel_id, soft_delete=False)

        assert success is True
        # 验证硬删除：记录不存在
        novel = db.query(Novel).filter(Novel.id == novel_id).first()
        assert novel is None

    def test_delete_nonexistent_novel(self, db: Session):
        """测试删除不存在的小说"""
        service = NovelService(db)

        success = service.delete_novel(99999, soft_delete=False)

        assert success is False


@pytest.mark.unit
class TestUpdateCachedCounts:
    """测试 update_cached_counts 方法"""

    def test_update_counts_with_chapters(self, db: Session, test_novel: Novel, test_chapter):
        """测试更新有章节的小说计数"""
        service = NovelService(db)

        service.update_cached_counts(test_novel.id)

        # 刷新对象以获取最新数据
        db.refresh(test_novel)
        assert test_novel.cached_chapter_count == 1
        assert test_novel.cached_word_count > 0

    def test_update_counts_no_chapters(self, db: Session, test_novel: Novel):
        """测试更新无章节的小说计数"""
        service = NovelService(db)

        service.update_cached_counts(test_novel.id)

        db.refresh(test_novel)
        assert test_novel.cached_chapter_count == 0
        assert test_novel.cached_word_count == 0

    def test_update_counts_nonexistent_novel(self, db: Session):
        """测试更新不存在的小说计数（不应报错）"""
        service = NovelService(db)

        # 不应抛出异常
        service.update_cached_counts(99999)


@pytest.mark.unit
class TestListNovels:
    """测试 list_novels 方法"""

    def test_list_all_novels(self, db: Session, test_user: User):
        """测试列出所有小说"""
        service = NovelService(db)

        # 查询初始数量
        _, initial_total = service.list_novels(page=1, page_size=100)

        # 创建多个小说
        for i in range(5):
            novel_data = NovelCreate(
                title=f"小说{i}",
                category="玄幻",
                status="published"
            )
            service.create_novel(novel_data, test_user.id)

        novels, total = service.list_novels(page=1, page_size=10)

        # 验证增量而不是绝对数量
        assert total == initial_total + 5
        assert len(novels) >= 5  # 至少包含新创建的 5 个

    def test_list_novels_pagination(self, db: Session, test_user: User):
        """测试分页功能"""
        service = NovelService(db)

        # 查询初始数量
        _, initial_total = service.list_novels(page=1, page_size=100)

        # 创建15个小说
        for i in range(15):
            novel_data = NovelCreate(
                title=f"小说{i}",
                category="玄幻",
                status="published"
            )
            service.create_novel(novel_data, test_user.id)

        # 第一页
        novels_page1, total = service.list_novels(page=1, page_size=10)
        assert total == initial_total + 15
        assert len(novels_page1) == 10

        # 第二页
        novels_page2, total = service.list_novels(page=2, page_size=10)
        assert total == initial_total + 15
        assert len(novels_page2) >= 5  # 至少包含新创建的 5 个

    def test_list_novels_by_user(self, db: Session, test_user: User):
        """测试按用户筛选"""
        service = NovelService(db)

        # 创建小说
        novel_data = NovelCreate(
            title="用户小说",
            category="玄幻",
            status="published"
        )
        service.create_novel(novel_data, test_user.id)

        novels, total = service.list_novels(user_id=test_user.id)

        assert total >= 1
        assert all(n.user_id == test_user.id for n in novels)

    def test_list_novels_by_category(self, db: Session, test_user: User):
        """测试按分类筛选"""
        service = NovelService(db)

        # 创建不同分类的小说
        for category in ["玄幻", "言情", "科幻"]:
            novel_data = NovelCreate(
                title=f"{category}小说",
                category=category,
                status="published"
            )
            service.create_novel(novel_data, test_user.id)

        novels, total = service.list_novels(category="玄幻")

        assert total >= 1
        assert all(n.category == "玄幻" for n in novels)

    def test_list_novels_by_status(self, db: Session, test_user: User):
        """测试按状态筛选"""
        service = NovelService(db)

        # 创建不同状态的小说
        for status in ["draft", "published"]:
            novel_data = NovelCreate(
                title=f"{status}小说",
                category="玄幻",
                status=status
            )
            novel = service.create_novel(novel_data, test_user.id)
            # 手动设置状态（因为 create_novel 默认是 draft）
            if status == "published":
                update_data = NovelUpdate(status="published")
                service.update_novel(novel.id, update_data)

        novels, total = service.list_novels(status="published")

        assert total >= 1
        assert all(n.status == "published" for n in novels)

    def test_list_novels_excludes_deleted(self, db: Session, test_user: User):
        """测试排除已删除的小说"""
        service = NovelService(db)

        # 创建并删除一个小说
        novel_data = NovelCreate(
            title="待删除小说",
            category="玄幻",
            status="published"
        )
        novel = service.create_novel(novel_data, test_user.id)
        service.delete_novel(novel.id, soft_delete=True)

        # 列出小说
        novels, total = service.list_novels()

        # 已删除的小说不应出现在列表中
        assert not any(n.id == novel.id for n in novels)
