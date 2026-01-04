"""ChapterService 单元测试

本小姐的专业测试：全面覆盖 ChapterService 的所有功能！(￣▽￣)ノ
"""
import pytest
from sqlalchemy.orm import Session

from app.services.chapter_service import ChapterService
from app.schemas.chapter import ChapterCreate, ChapterUpdate
from app.models import Novel, Chapter


@pytest.mark.unit
class TestGetChapterById:
    """测试 get_chapter_by_id 方法"""

    def test_get_existing_chapter(self, db: Session, test_chapter: Chapter):
        """测试获取存在的章节"""
        service = ChapterService(db)
        chapter = service.get_chapter_by_id(test_chapter.id)

        assert chapter is not None
        assert chapter.id == test_chapter.id
        assert chapter.title == test_chapter.title

    def test_get_nonexistent_chapter(self, db: Session):
        """测试获取不存在的章节"""
        service = ChapterService(db)
        chapter = service.get_chapter_by_id(99999)

        assert chapter is None

    def test_get_chapter_with_relations(self, db: Session, test_chapter: Chapter):
        """测试预加载关联数据"""
        service = ChapterService(db)
        chapter = service.get_chapter_by_id(test_chapter.id, load_relations=True)

        assert chapter is not None
        # 验证关联数据已加载（不会触发额外查询）
        assert chapter.novel is not None
        assert chapter.novel.title == "测试小说"


@pytest.mark.unit
class TestListChapters:
    """测试 list_chapters 方法"""

    def test_list_chapters_basic(self, db: Session, test_novel: Novel):
        """测试列出小说的所有章节"""
        service = ChapterService(db)

        # 创建多个章节
        for i in range(3):
            chapter_data = ChapterCreate(
                title=f"第{i+1}章",
                content=f"这是第{i+1}章的内容"
            )
            service.create_chapter(test_novel.id, chapter_data)

        chapters = service.list_chapters(test_novel.id)

        assert len(chapters) == 3
        assert chapters[0].order_num < chapters[1].order_num < chapters[2].order_num

    def test_list_chapters_exclude_branches(self, db: Session, test_novel: Novel):
        """测试排除分支章节"""
        service = ChapterService(db)

        # 创建主线章节
        main_chapter_data = ChapterCreate(
            title="主线章节",
            content="主线内容"
        )
        main_chapter = service.create_chapter(test_novel.id, main_chapter_data)

        # 创建分支章节
        branch_chapter_data = ChapterCreate(
            title="分支章节",
            content="分支内容",
            parent_chapter_id=main_chapter.id
        )
        service.create_chapter(test_novel.id, branch_chapter_data)

        # 不包含分支
        chapters = service.list_chapters(test_novel.id, include_branches=False)
        assert len(chapters) == 1
        assert chapters[0].id == main_chapter.id

    def test_list_chapters_include_branches(self, db: Session, test_novel: Novel):
        """测试包含分支章节"""
        service = ChapterService(db)

        # 创建主线章节
        main_chapter_data = ChapterCreate(
            title="主线章节",
            content="主线内容"
        )
        main_chapter = service.create_chapter(test_novel.id, main_chapter_data)

        # 创建分支章节
        branch_chapter_data = ChapterCreate(
            title="分支章节",
            content="分支内容",
            parent_chapter_id=main_chapter.id
        )
        service.create_chapter(test_novel.id, branch_chapter_data)

        # 包含分支
        chapters = service.list_chapters(test_novel.id, include_branches=True)
        assert len(chapters) == 2


@pytest.mark.unit
class TestGetNextOrderNum:
    """测试 get_next_order_num 方法"""

    def test_get_next_order_num_empty(self, db: Session, test_novel: Novel):
        """测试空小说的下一个序号"""
        service = ChapterService(db)
        next_order = service.get_next_order_num(test_novel.id)

        assert next_order == 1.0

    def test_get_next_order_num_with_chapters(self, db: Session, test_novel: Novel):
        """测试有章节的小说的下一个序号"""
        service = ChapterService(db)

        # 创建3个章节
        for i in range(3):
            chapter_data = ChapterCreate(
                title=f"第{i+1}章",
                content=f"内容{i+1}"
            )
            service.create_chapter(test_novel.id, chapter_data)

        next_order = service.get_next_order_num(test_novel.id)
        assert next_order == 4.0


@pytest.mark.unit
class TestCreateChapter:
    """测试 create_chapter 方法"""

    def test_create_chapter_success(self, db: Session, test_novel: Novel):
        """测试成功创建章节"""
        service = ChapterService(db)
        chapter_data = ChapterCreate(
            title="测试章节",
            content="这是测试章节的内容"
        )

        chapter = service.create_chapter(test_novel.id, chapter_data)

        assert chapter.id is not None
        assert chapter.title == "测试章节"
        assert chapter.content == "这是测试章节的内容"
        assert chapter.novel_id == test_novel.id
        assert chapter.order_num == 1.0
        assert chapter.parent_chapter_id is None

    def test_create_chapter_auto_order(self, db: Session, test_novel: Novel):
        """测试自动计算章节序号"""
        service = ChapterService(db)

        # 创建第一章
        chapter1_data = ChapterCreate(title="第一章", content="内容1")
        chapter1 = service.create_chapter(test_novel.id, chapter1_data)
        assert chapter1.order_num == 1.0

        # 创建第二章
        chapter2_data = ChapterCreate(title="第二章", content="内容2")
        chapter2 = service.create_chapter(test_novel.id, chapter2_data)
        assert chapter2.order_num == 2.0

    def test_create_branch_chapter(self, db: Session, test_novel: Novel):
        """测试创建分支章节"""
        service = ChapterService(db)

        # 创建主线章节
        main_chapter_data = ChapterCreate(title="主线", content="主线内容")
        main_chapter = service.create_chapter(test_novel.id, main_chapter_data)

        # 创建分支章节
        branch_data = ChapterCreate(
            title="分支A",
            content="分支内容",
            parent_chapter_id=main_chapter.id,
            choice_text="选择A"
        )
        branch = service.create_chapter(test_novel.id, branch_data)

        assert branch.parent_chapter_id == main_chapter.id
        assert branch.choice_text == "选择A"
        assert branch.order_num == main_chapter.order_num + 0.1

    def test_create_multiple_branches(self, db: Session, test_novel: Novel):
        """测试创建多个分支章节"""
        service = ChapterService(db)

        # 创建主线章节
        main_chapter_data = ChapterCreate(title="主线", content="主线内容")
        main_chapter = service.create_chapter(test_novel.id, main_chapter_data)

        # 创建第一个分支
        branch1_data = ChapterCreate(
            title="分支A",
            content="分支A内容",
            parent_chapter_id=main_chapter.id,
            choice_text="选择A"
        )
        branch1 = service.create_chapter(test_novel.id, branch1_data)

        # 创建第二个分支
        branch2_data = ChapterCreate(
            title="分支B",
            content="分支B内容",
            parent_chapter_id=main_chapter.id,
            choice_text="选择B"
        )
        branch2 = service.create_chapter(test_novel.id, branch2_data)

        assert branch1.order_num == main_chapter.order_num + 0.1
        assert branch2.order_num == main_chapter.order_num + 0.2

    def test_create_chapter_with_invalid_parent(self, db: Session, test_novel: Novel):
        """测试使用无效的父章节ID创建章节"""
        service = ChapterService(db)

        chapter_data = ChapterCreate(
            title="分支章节",
            content="内容",
            parent_chapter_id=99999  # 不存在的父章节
        )

        with pytest.raises(ValueError, match="父章节不存在"):
            service.create_chapter(test_novel.id, chapter_data)


@pytest.mark.unit
class TestUpdateChapter:
    """测试 update_chapter 方法"""

    def test_update_chapter_success(self, db: Session, test_chapter: Chapter):
        """测试成功更新章节"""
        service = ChapterService(db)
        update_data = ChapterUpdate(
            title="更新后的标题",
            content="更新后的内容"
        )

        updated_chapter = service.update_chapter(test_chapter.id, update_data)

        assert updated_chapter is not None
        assert updated_chapter.title == "更新后的标题"
        assert updated_chapter.content == "更新后的内容"

    def test_update_nonexistent_chapter(self, db: Session):
        """测试更新不存在的章节"""
        service = ChapterService(db)
        update_data = ChapterUpdate(title="不存在")

        result = service.update_chapter(99999, update_data)

        assert result is None

    def test_update_partial_fields(self, db: Session, test_chapter: Chapter):
        """测试部分字段更新"""
        service = ChapterService(db)
        original_title = test_chapter.title
        update_data = ChapterUpdate(content="只更新内容")

        updated_chapter = service.update_chapter(test_chapter.id, update_data)

        assert updated_chapter is not None
        assert updated_chapter.title == original_title  # 标题未变
        assert updated_chapter.content == "只更新内容"


@pytest.mark.unit
class TestDeleteChapter:
    """测试 delete_chapter 方法"""

    def test_delete_chapter_success(self, db: Session, test_chapter: Chapter):
        """测试成功删除章节"""
        service = ChapterService(db)
        chapter_id = test_chapter.id

        success = service.delete_chapter(chapter_id)

        assert success is True
        # 验证章节已删除
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        assert chapter is None

    def test_delete_nonexistent_chapter(self, db: Session):
        """测试删除不存在的章节"""
        service = ChapterService(db)

        success = service.delete_chapter(99999)

        assert success is False

    def test_delete_chapter_with_branches(self, db: Session, test_novel: Novel):
        """测试删除有分支的章节（级联删除）"""
        service = ChapterService(db)

        # 创建主线章节
        main_chapter_data = ChapterCreate(title="主线", content="主线内容")
        main_chapter = service.create_chapter(test_novel.id, main_chapter_data)

        # 创建分支章节
        branch_data = ChapterCreate(
            title="分支",
            content="分支内容",
            parent_chapter_id=main_chapter.id
        )
        branch = service.create_chapter(test_novel.id, branch_data)

        # 删除主线章节
        success = service.delete_chapter(main_chapter.id)

        assert success is True
        # 验证主线章节已删除
        assert db.query(Chapter).filter(Chapter.id == main_chapter.id).first() is None
        # 验证分支章节也被级联删除
        assert db.query(Chapter).filter(Chapter.id == branch.id).first() is None


@pytest.mark.unit
class TestReorderChapters:
    """测试 reorder_chapters 方法"""

    def test_reorder_chapters_success(self, db: Session, test_novel: Novel):
        """测试成功重排章节顺序"""
        service = ChapterService(db)

        # 创建3个章节
        chapters = []
        for i in range(3):
            chapter_data = ChapterCreate(
                title=f"第{i+1}章",
                content=f"内容{i+1}"
            )
            chapter = service.create_chapter(test_novel.id, chapter_data)
            chapters.append(chapter)

        # 重排顺序：3, 1, 2
        new_order = [chapters[2].id, chapters[0].id, chapters[1].id]
        reordered = service.reorder_chapters(test_novel.id, new_order)

        assert len(reordered) == 3
        assert reordered[0].id == chapters[2].id
        assert reordered[0].order_num == 1.0
        assert reordered[1].id == chapters[0].id
        assert reordered[1].order_num == 2.0
        assert reordered[2].id == chapters[1].id
        assert reordered[2].order_num == 3.0

    def test_reorder_chapters_ignore_branches(self, db: Session, test_novel: Novel):
        """测试重排时忽略分支章节"""
        service = ChapterService(db)

        # 创建主线章节
        main_chapter_data = ChapterCreate(title="主线", content="主线内容")
        main_chapter = service.create_chapter(test_novel.id, main_chapter_data)

        # 创建分支章节
        branch_data = ChapterCreate(
            title="分支",
            content="分支内容",
            parent_chapter_id=main_chapter.id
        )
        branch = service.create_chapter(test_novel.id, branch_data)

        # 尝试重排（包含分支章节ID）
        new_order = [branch.id, main_chapter.id]
        reordered = service.reorder_chapters(test_novel.id, new_order)

        # 只有主线章节被重排，分支章节被忽略
        assert len(reordered) == 1
        assert reordered[0].id == main_chapter.id

    def test_reorder_chapters_invalid_novel(self, db: Session, test_novel: Novel):
        """测试重排不属于该小说的章节"""
        service = ChapterService(db)

        # 创建章节
        chapter_data = ChapterCreate(title="章节", content="内容")
        chapter = service.create_chapter(test_novel.id, chapter_data)

        # 尝试用错误的 novel_id 重排
        reordered = service.reorder_chapters(99999, [chapter.id])

        # 不应重排任何章节
        assert len(reordered) == 0


@pytest.mark.unit
class TestGetChapterNavigation:
    """测试 get_chapter_navigation 方法"""

    def test_get_navigation_middle_chapter(self, db: Session, test_novel: Novel):
        """测试获取中间章节的导航"""
        service = ChapterService(db)

        # 创建3个章节
        chapters = []
        for i in range(3):
            chapter_data = ChapterCreate(
                title=f"第{i+1}章",
                content=f"内容{i+1}"
            )
            chapter = service.create_chapter(test_novel.id, chapter_data)
            chapters.append(chapter)

        # 获取第二章的导航
        prev_id, next_id = service.get_chapter_navigation(chapters[1].id)

        assert prev_id == chapters[0].id
        assert next_id == chapters[2].id

    def test_get_navigation_first_chapter(self, db: Session, test_novel: Novel):
        """测试获取第一章的导航"""
        service = ChapterService(db)

        # 创建2个章节
        chapters = []
        for i in range(2):
            chapter_data = ChapterCreate(
                title=f"第{i+1}章",
                content=f"内容{i+1}"
            )
            chapter = service.create_chapter(test_novel.id, chapter_data)
            chapters.append(chapter)

        # 获取第一章的导航
        prev_id, next_id = service.get_chapter_navigation(chapters[0].id)

        assert prev_id is None  # 第一章没有上一章
        assert next_id == chapters[1].id

    def test_get_navigation_last_chapter(self, db: Session, test_novel: Novel):
        """测试获取最后一章的导航"""
        service = ChapterService(db)

        # 创建2个章节
        chapters = []
        for i in range(2):
            chapter_data = ChapterCreate(
                title=f"第{i+1}章",
                content=f"内容{i+1}"
            )
            chapter = service.create_chapter(test_novel.id, chapter_data)
            chapters.append(chapter)

        # 获取最后一章的导航
        prev_id, next_id = service.get_chapter_navigation(chapters[1].id)

        assert prev_id == chapters[0].id
        assert next_id is None  # 最后一章没有下一章

    def test_get_navigation_nonexistent_chapter(self, db: Session):
        """测试获取不存在章节的导航"""
        service = ChapterService(db)

        prev_id, next_id = service.get_chapter_navigation(99999)

        assert prev_id is None
        assert next_id is None

    def test_get_navigation_single_chapter(self, db: Session, test_novel: Novel):
        """测试只有一个章节时的导航"""
        service = ChapterService(db)

        chapter_data = ChapterCreate(title="唯一章节", content="内容")
        chapter = service.create_chapter(test_novel.id, chapter_data)

        prev_id, next_id = service.get_chapter_navigation(chapter.id)

        assert prev_id is None
        assert next_id is None
