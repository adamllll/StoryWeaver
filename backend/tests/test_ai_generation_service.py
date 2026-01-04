"""AI 内容生成服务单元测试

本小姐的专业测试：全面覆盖 AIGenerationService 的所有功能！(￣▽￣)ノ
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.orm import Session

from app.services.ai_generation_service import (
    AIGenerationService,
    html_to_text,
    build_context_excerpt,
    extract_title_and_content,
    is_generic_chapter_title,
    normalize_title,
    is_title_too_similar,
    resolve_chapter_number,
)
from app.schemas import AIUsage
from app.models import Novel, Chapter


# ============================================================================
# 工具函数测试
# ============================================================================

@pytest.mark.unit
class TestHTMLToText:
    """HTML 转文本功能测试"""

    def test_basic_html_conversion(self):
        """测试基本 HTML 转换"""
        html = "<p>这是一段文本</p>"
        result = html_to_text(html)
        assert result == "这是一段文本"

    def test_br_tag_conversion(self):
        """测试 <br> 标签转换为换行"""
        html = "第一行<br>第二行<br/>第三行"
        result = html_to_text(html)
        assert "第一行\n第二行\n第三行" in result

    def test_paragraph_spacing(self):
        """测试段落间距"""
        html = "<p>段落一</p><p>段落二</p>"
        result = html_to_text(html)
        assert "段落一\n\n段落二" in result

    def test_html_entities(self):
        """测试 HTML 实体转换"""
        html = "&lt;tag&gt; &amp; &nbsp;"
        result = html_to_text(html)
        assert "<tag> &" in result

    def test_empty_string(self):
        """测试空字符串"""
        assert html_to_text("") == ""
        assert html_to_text(None) == ""

    def test_remove_all_tags(self):
        """测试移除所有标签"""
        html = "<div><span>文本</span></div>"
        result = html_to_text(html)
        assert "<" not in result and ">" not in result
        assert "文本" in result


@pytest.mark.unit
class TestBuildContextExcerpt:
    """上下文摘要构建测试"""

    def test_short_text_unchanged(self):
        """测试短文本保持不变"""
        text = "这是一段短文本"
        result = build_context_excerpt(text, max_chars=1000)
        assert result == text

    def test_long_text_truncation(self):
        """测试长文本截断"""
        text = "这是测试内容。" * 1000
        result = build_context_excerpt(text, max_chars=100)
        assert len(result) <= 100

    def test_paragraph_extraction(self):
        """测试段落提取"""
        text = "段落一\n\n段落二\n\n段落三\n\n段落四\n\n段落五"
        result = build_context_excerpt(text, max_chars=5000, max_paragraphs=2)
        # 函数保留最后 N 段,这里应该保留最后2段
        assert "段落四" in result and "段落五" in result

    def test_html_text_conversion(self):
        """测试 HTML 文本自动转换"""
        html_text = "<p>段落一</p><p>段落二</p>"
        result = build_context_excerpt(html_text)
        assert "<p>" not in result
        assert "段落" in result

    def test_empty_text(self):
        """测试空文本"""
        assert build_context_excerpt("") == ""
        assert build_context_excerpt(None) == ""


@pytest.mark.unit
class TestExtractTitleAndContent:
    """标题和内容提取测试"""

    def test_markdown_title_extraction(self):
        """测试 Markdown 标题提取"""
        text = "# 第一章 开篇\n\n这是正文内容"
        title, content = extract_title_and_content(text)
        assert title == "第一章 开篇"
        assert content == "这是正文内容"

    def test_chinese_chapter_format(self):
        """测试中文章节格式"""
        text = "第一章：序幕\n\n正文开始了"
        title, content = extract_title_and_content(text)
        assert "第一章" in title
        assert content == "正文开始了"

    def test_no_title(self):
        """测试无明显标题情况 - 短首行被视为标题"""
        text = "这是一段没有标题的文本"
        title, content = extract_title_and_content(text)
        # 函数会将短首行(<=100字且不以句号结尾)视为标题
        assert title == "这是一段没有标题的文本"
        assert content == ""  # 只有一行,被识别为标题后内容为空

    def test_empty_string(self):
        """测试空字符串"""
        title, content = extract_title_and_content("")
        assert title == ""
        assert content == ""

    def test_multiple_hash_levels(self):
        """测试多级 Markdown 标题"""
        text = "### 第三级标题\n\n内容文本"
        title, content = extract_title_and_content(text)
        assert title == "第三级标题"
        assert content == "内容文本"


@pytest.mark.unit
class TestTitleValidation:
    """标题验证功能测试"""

    def test_generic_title_detection(self):
        """测试通用标题检测"""
        assert is_generic_chapter_title("续写内容") is True
        assert is_generic_chapter_title("章节标题") is True
        assert is_generic_chapter_title("第一章") is True
        assert is_generic_chapter_title("第五章 精彩开局") is False
        assert is_generic_chapter_title("") is True

    def test_normalize_title(self):
        """测试标题标准化"""
        assert normalize_title("# 第一章：开篇") == "开篇"
        assert normalize_title("第五章：风起云涌") == "风起云涌"
        assert normalize_title("第十章-决战") == "决战"

    def test_title_similarity(self):
        """测试标题相似度"""
        assert is_title_too_similar("第一章 开篇", "第二章 开篇") is True
        assert is_title_too_similar("风起云涌", "风起云涌") is True
        assert is_title_too_similar("决战天下", "和平盛世") is False
        assert is_title_too_similar("", "任何标题") is False


@pytest.mark.unit
class TestResolveChapterNumber:
    """章节编号解析测试"""

    def test_extract_arabic_number(self):
        """测试提取阿拉伯数字"""
        chapter = MagicMock()
        chapter.title = "第5章 标题"
        chapter.order_num = 1
        result = resolve_chapter_number(chapter, 10)
        assert result == 5

    def test_extract_chinese_number(self):
        """测试提取中文数字"""
        chapter = MagicMock()
        chapter.title = "第三章 标题"
        chapter.order_num = 1
        result = resolve_chapter_number(chapter, 10)
        assert result == 3

    def test_use_order_num(self):
        """测试使用 order_num"""
        chapter = MagicMock()
        chapter.title = "无编号标题"
        chapter.order_num = 8
        result = resolve_chapter_number(chapter, 10)
        assert result == 8

    def test_default_total_count(self):
        """测试默认使用总数加一"""
        result = resolve_chapter_number(None, 15)
        assert result == 16


# ============================================================================
# Service 类方法测试
# ============================================================================

@pytest.mark.unit
class TestGenerateOutline:
    """大纲生成功能测试"""

    @pytest.mark.asyncio
    async def test_generate_outline_success(self, mock_ai_service):
        """测试成功生成大纲"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            title, description, outline, usage = await service.generate_outline(
                category="玄幻",
                keywords="修仙,热血",
                chapter_count=10,
                target_words=5000
            )

        assert title == "测试小说标题"
        assert description == "这是一个测试小说的简介"
        assert "第一章" in outline
        assert isinstance(usage, AIUsage)

    @pytest.mark.asyncio
    async def test_generate_outline_with_optional_params(self, mock_ai_service):
        """测试带可选参数的大纲生成"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            title, description, outline, usage = await service.generate_outline(
                category="言情",
                keywords="都市,甜宠",
                chapter_count=20,
                target_words=10000,
                target_audience="女性读者",
                protagonist="林晓雪",
                background="现代都市",
                special_requirements="轻松幽默"
            )

        assert title is not None
        assert description is not None
        assert outline is not None


@pytest.mark.unit
class TestContinueChapter:
    """章节续写功能测试"""

    @pytest.mark.asyncio
    async def test_continue_chapter_basic(self, mock_ai_service, test_novel, test_chapter, db):
        """测试基本续写功能"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            content, title, word_count, usage = await service.continue_chapter(
                novel=test_novel,
                chapter=test_chapter,
                word_count=2000,
                db=db
            )

        assert len(content) > 0
        assert isinstance(word_count, int)
        assert isinstance(usage, AIUsage)

    @pytest.mark.asyncio
    async def test_continue_empty_chapter(self, mock_ai_service, test_novel, db):
        """测试空章节续写"""
        service = AIGenerationService()

        # 创建空章节
        empty_chapter = Chapter(
            novel_id=test_novel.id,
            title="空章节",
            content="",
            order_num=2
        )
        db.add(empty_chapter)
        db.commit()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            content, title, word_count, usage = await service.continue_chapter(
                novel=test_novel,
                chapter=empty_chapter,
                word_count=1000,
                db=db
            )

        assert content is not None


@pytest.mark.unit
class TestExpandText:
    """文本扩写功能测试"""

    @pytest.mark.asyncio
    async def test_expand_text_success(self, mock_ai_service):
        """测试成功扩写文本"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            expanded_text, word_count, usage = await service.expand_text(
                text="他走进房间",
                style="详细描写",
                word_count=500
            )

        assert len(expanded_text) > 0
        assert isinstance(word_count, int)
        assert isinstance(usage, AIUsage)

    @pytest.mark.asyncio
    async def test_expand_with_context(self, mock_ai_service):
        """测试带上下文的扩写"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            expanded_text, word_count, usage = await service.expand_text(
                text="他做出了决定",
                style="心理描写",
                word_count=300,
                chapter_title="第五章 抉择",
                context_before="前文讲述了主角的困境",
                context_after="后文将展开行动",
                position_hint="章节中部"
            )

        assert expanded_text is not None


@pytest.mark.unit
class TestGenerateCharacter:
    """角色生成功能测试"""

    @pytest.mark.asyncio
    async def test_generate_character_success(self, mock_ai_service, test_novel):
        """测试成功生成角色"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            character_data, usage = await service.generate_character(
                novel=test_novel,
                role_type="主角"
            )

        assert character_data["name"] == "测试角色"
        assert character_data["role_type"] == "主角"
        assert isinstance(character_data["personality"], list)
        assert isinstance(usage, AIUsage)

    @pytest.mark.asyncio
    async def test_generate_character_with_requirements(self, mock_ai_service, test_novel):
        """测试带要求的角色生成"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            character_data, usage = await service.generate_character(
                novel=test_novel,
                role_type="反派",
                design_direction="狡诈阴险,实力强大",
                character_name="魔主"
            )

        assert character_data["name"] is not None
        assert isinstance(usage, AIUsage)


@pytest.mark.unit
class TestFormatOptimize:
    """格式优化功能测试"""

    @pytest.mark.asyncio
    async def test_format_optimize_success(self, mock_ai_service):
        """测试成功格式优化"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            optimized_content, usage = await service.format_optimize(
                content="这是需要优化的内容",
                chapter_title="第一章",
                chapter_order=1.0,
                category="玄幻"
            )

        assert len(optimized_content) > 0
        assert isinstance(usage, AIUsage)

    @pytest.mark.asyncio
    async def test_format_optimize_with_focus(self, mock_ai_service):
        """测试带优化重点的格式优化"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            optimized_content, usage = await service.format_optimize(
                content="原始内容",
                chapter_title="第二章",
                chapter_order=2.0,
                category="言情",
                optimization_focus="对话优化"
            )

        assert optimized_content is not None


@pytest.mark.unit
class TestRewriteText:
    """文本重写功能测试"""

    @pytest.mark.asyncio
    async def test_rewrite_text_success(self, mock_ai_service, test_novel):
        """测试成功重写文本"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            rewritten_text, usage = await service.rewrite_text(
                original_text="原始文本内容",
                rewrite_style="保持原意",
                novel=test_novel
            )

        assert len(rewritten_text) > 0
        assert isinstance(usage, AIUsage)

    @pytest.mark.asyncio
    async def test_rewrite_with_requirements(self, mock_ai_service, test_novel):
        """测试带要求的重写"""
        service = AIGenerationService()

        with patch('app.services.ai_generation_service.ai_service', mock_ai_service):
            rewritten_text, usage = await service.rewrite_text(
                original_text="原文",
                rewrite_style="增强感染力",
                novel=test_novel,
                special_requirements="增加情感描写"
            )

        assert rewritten_text is not None
