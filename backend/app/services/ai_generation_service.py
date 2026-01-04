"""AI 内容生成服务 - 业务逻辑层

本模块负责所有 AI 内容生成的业务逻辑，包括：
- 文本处理工具
- 上下文提取
- 内容验证
- 重试机制
- 业务规则
"""
import json
import logging
import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from ..models import Novel, Chapter
from ..schemas import AIUsage
from .ai_service import ai_service
from ..utils.prompts import (
    get_outline_prompt,
    get_continue_prompt,
    get_expand_prompt,
    get_character_prompt,
    get_format_optimize_prompt,
    get_rewrite_prompt,
)

logger = logging.getLogger(__name__)


# ============================================================================
# 文本处理工具
# ============================================================================

def html_to_text(value: str) -> str:
    """将 HTML 转为纯文本，保留段落结构"""
    if not value:
        return ""

    text = value
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p\s*>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</div\s*>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</h[1-6]\s*>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</li\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
    )
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def build_context_excerpt(raw_text: str, max_chars: int = 4000, max_paragraphs: int = 4) -> str:
    """从原文中提取连贯的上下文摘要"""
    clean_text = html_to_text(raw_text)
    if not clean_text:
        return ""

    if len(clean_text) <= max_chars:
        return clean_text

    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
    if paragraphs:
        excerpt = "\n\n".join(paragraphs[-max_paragraphs:])
    else:
        excerpt = clean_text

    if len(excerpt) > max_chars:
        excerpt = excerpt[-max_chars:]

    return excerpt.strip()


def extract_title_and_content(markdown_text: str) -> Tuple[str, str]:
    """从 Markdown 文本中提取标题和正文"""
    text = markdown_text.strip()
    if not text:
        return "", ""

    lines = text.split('\n')
    title = ""
    content_start = 0

    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue

        # 匹配 Markdown 标题
        md_match = re.match(r'^#+\s*(.+)', line_stripped)
        if md_match:
            title = md_match.group(1).strip()
            content_start = i + 1
            break

        # 匹配中文章节格式
        chapter_match = re.match(r'^第[一二三四五六七八九十百千\d]+[章节回]\s*[：:、]?\s*(.*)$', line_stripped)
        if chapter_match:
            title = line_stripped
            content_start = i + 1
            break

        # 检查是否为独立标题行
        is_short_enough = len(line_stripped) <= 100
        is_not_sentence_end = not line_stripped.endswith(('。', '！', '？', '；', '…', '"', '"'))

        if i == 0 and is_short_enough and is_not_sentence_end:
            title = line_stripped
            content_start = i + 1
            break

        break

    # 提取正文
    content_lines = lines[content_start:]
    while content_lines and not content_lines[0].strip():
        content_lines = content_lines[1:]
    content = '\n'.join(content_lines).strip()

    return title, content


def is_generic_chapter_title(title: str) -> bool:
    """判断章节标题是否过于通用"""
    if not title or not title.strip():
        return True

    cleaned_title = re.sub(r'^#+\s*', '', title.strip())
    cleaned_title = cleaned_title.rstrip("：:").strip()

    generic_titles = {"续写内容", "章节标题", "无题", "未命名章节"}
    if cleaned_title in generic_titles:
        return True

    if re.fullmatch(r"第[一二三四五六七八九十百千\d]+章", cleaned_title):
        return True

    return False


def normalize_title(title: str) -> str:
    """标准化标题用于相似度比较"""
    cleaned = re.sub(r"^#+\s*", "", title or "").strip()
    cleaned = re.sub(r"^第[一二三四五六七八九十百千\d]+章[:：\s-]*", "", cleaned)
    cleaned = re.sub(r"[\s\-—_·。！？：:，,、…\"'（）()【】\[\]《》<>]", "", cleaned)
    return cleaned.lower()


def is_title_too_similar(title: str, previous: str) -> bool:
    """检查标题是否与前一章过于相似"""
    if not title or not previous:
        return False

    norm_title = normalize_title(title)
    norm_prev = normalize_title(previous)
    if not norm_title or not norm_prev:
        return False

    if norm_title == norm_prev:
        return True

    if norm_prev in norm_title or norm_title in norm_prev:
        return True

    title_set = set(norm_title)
    prev_set = set(norm_prev)
    if not title_set or not prev_set:
        return False

    overlap = len(title_set & prev_set) / len(title_set | prev_set)
    return overlap >= 0.7


def resolve_chapter_number(chapter: Optional[Chapter], total_count: int) -> int:
    """从章节信息推断章节编号"""
    if chapter:
        # 从标题提取阿拉伯数字
        title_match = re.search(r"第\s*(\d+)\s*章", chapter.title or "")
        if title_match:
            return int(title_match.group(1))

        # 从标题提取中文数字
        cn_num_map = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
                      "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
        cn_match = re.search(r"第\s*([一二三四五六七八九十百千]+)\s*章", chapter.title or "")
        if cn_match:
            cn_str = cn_match.group(1)
            if cn_str in cn_num_map:
                return cn_num_map[cn_str]
            elif cn_str.startswith("十"):
                if len(cn_str) == 1:
                    return 10
                elif cn_str[1:] in cn_num_map:
                    return 10 + cn_num_map[cn_str[1:]]
            elif cn_str.endswith("十"):
                if cn_str[:-1] in cn_num_map:
                    return cn_num_map[cn_str[:-1]] * 10

        # 使用 order_num
        if isinstance(chapter.order_num, (int, float)) and chapter.order_num > 0:
            return int(chapter.order_num)

    return total_count + 1


# ============================================================================
# AI 生成服务类
# ============================================================================

class AIGenerationService:
    """AI 内容生成服务"""

    async def generate_outline(
        self,
        category: str,
        keywords: str,
        chapter_count: int,
        target_words: int,
        target_audience: Optional[str] = None,
        protagonist: Optional[str] = None,
        background: Optional[str] = None,
        special_requirements: Optional[str] = None,
    ) -> Tuple[str, str, str, AIUsage]:
        """生成小说大纲

        Returns:
            (title, description, outline, usage)
        """
        system_prompt, user_prompt = get_outline_prompt(
            category=category,
            keywords=keywords,
            chapter_count=chapter_count,
            target_words=target_words,
            target_audience=target_audience or "大众读者",
            protagonist=protagonist or "无",
            background=background or "无",
            special_requirements=special_requirements or "无",
        )

        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        title = result.get("title", "未命名小说").strip()
        description = result.get("description", "暂无简介").strip()

        raw_outline = result.get("outline", "")
        if isinstance(raw_outline, list):
            outline = "\n".join(str(item) for item in raw_outline).strip()
        else:
            outline = str(raw_outline).strip()

        # 清理 Markdown 代码块标记
        outline = re.sub(r"^```markdown\s*", "", outline)
        outline = re.sub(r"^```\s*", "", outline)
        outline = re.sub(r"\s*```$", "", outline)

        if not outline:
            raise ValueError("AI 生成了空大纲")

        return title, description, outline, usage

    async def continue_chapter(
        self,
        novel: Novel,
        chapter: Optional[Chapter],
        word_count: int,
        mode: str = "continue",
        chapter_outline: Optional[str] = None,
        style: Optional[str] = None,
        special_requirements: Optional[str] = None,
        cursor_position: Optional[int] = None,
        db: Session = None,
    ) -> Tuple[str, str, int, AIUsage]:
        """续写章节

        Returns:
            (content, title, word_count, usage)
        """
        # 提取前文上下文
        previous_summary = ""
        previous_title = ""

        if chapter:
            previous_title = chapter.title or ""
            if chapter.content:
                if cursor_position is not None and cursor_position > 0:
                    content_before_cursor = chapter.content[:cursor_position]
                    previous_summary = build_context_excerpt(content_before_cursor)
                else:
                    previous_summary = build_context_excerpt(chapter.content)
            else:
                # 新章节为空，使用上一章内容
                prev_chapter = db.query(Chapter).filter(
                    Chapter.novel_id == novel.id,
                    Chapter.order_num < chapter.order_num,
                ).order_by(Chapter.order_num.desc()).first()
                if prev_chapter and prev_chapter.content:
                    previous_title = prev_chapter.title or previous_title
                    previous_summary = build_context_excerpt(prev_chapter.content)

            if previous_summary:
                extracted_title, extracted_body = extract_title_and_content(previous_summary)
                if extracted_body:
                    previous_summary = extracted_body
                if not previous_title and extracted_title:
                    previous_title = extracted_title

        # 构建角色信息
        characters_list = [
            {"name": char.name, "role": char.role_type, "description": char.description}
            for char in novel.characters[:5]
        ]
        characters_json = json.dumps(characters_list, ensure_ascii=False, indent=2) if characters_list else "暂无角色设定"

        # 构建世界观设定
        world_settings = "暂无世界观设定"
        if novel.world_settings:
            settings_parts = []
            for ws in novel.world_settings[:5]:
                settings_parts.append(f"- {ws.setting_type}: {ws.name} - {ws.description or '无描述'}")
            if settings_parts:
                world_settings = "\n".join(settings_parts)

        # 推断风格
        if not style:
            style_map = {
                "玄幻": "热血爽文",
                "言情": "细腻感人",
                "科幻": "紧张刺激",
                "悬疑": "紧张刺激",
                "历史": "严肃正剧",
                "都市": "轻松幽默",
                "其他": "热血爽文",
            }
            style = style_map.get(novel.category, "热血爽文")

        # 处理章节大纲
        if not chapter_outline:
            if novel.outline:
                chapter_outline = f"根据小说整体大纲继续创作：\n{novel.outline[:2000]}"
            else:
                chapter_outline = "根据前文内容和小说设定，自由发挥创作下一章节"

        # 计算章节编号
        main_chapter_count = db.query(Chapter).filter(
            Chapter.novel_id == novel.id,
            Chapter.parent_chapter_id == None
        ).count()
        chapter_number = resolve_chapter_number(chapter, main_chapter_count)

        # 生成提示词
        system_prompt, user_prompt = get_continue_prompt(
            category=novel.category,
            style=style,
            characters_json=characters_json,
            world_settings=world_settings,
            previous_summary=previous_summary or "这是小说的开篇",
            chapter_outline=chapter_outline,
            previous_chapter_title=previous_title or "无",
            word_count=word_count,
            special_requirements=special_requirements or "无",
            mode=mode,
            chapter_number=chapter_number,
        )

        min_words = int(word_count * 0.9)
        max_words = int(word_count * 1.1)

        # 重试机制
        MAX_RETRIES = 3
        best_body = ""
        total_usage = None

        for attempt in range(MAX_RETRIES):
            current_user_prompt = user_prompt

            raw_response, usage = await ai_service.generate(
                system_prompt=system_prompt,
                user_prompt=current_user_prompt,
                max_tokens=word_count * 3,
                temperature=0.7,
                task="continue",
            )

            if total_usage is None:
                total_usage = usage
            else:
                total_usage = AIUsage(
                    prompt_tokens=total_usage.prompt_tokens + usage.prompt_tokens,
                    completion_tokens=total_usage.completion_tokens + usage.completion_tokens,
                    total_tokens=total_usage.total_tokens + usage.total_tokens,
                )

            generated_content = raw_response.strip() if raw_response else ""
            if not generated_content:
                continue

            generated_title, generated_body = extract_title_and_content(generated_content)
            if not generated_body:
                generated_body = generated_content

            if mode == "continue" and not generated_title:
                generated_body = generated_content

            generated_word_count = len(generated_body)
            if generated_word_count > len(best_body):
                best_body = generated_body

            if generated_word_count < min_words:
                continue

            # 仅在生成整章模式下检查标题
            if mode == "generate_chapter":
                if is_generic_chapter_title(generated_title):
                    continue
                if previous_title and is_title_too_similar(generated_title, previous_title):
                    continue

            return generated_body, generated_title, generated_word_count, total_usage

        # 标题补救
        if mode == "generate_chapter" and best_body and len(best_body) >= min_words:
            title_system_prompt = "你是一位擅长起章节标题的小说编辑。"
            title_user_prompt = (
                f"根据以下章节正文生成一个简洁有创意的标题。\n"
                f"要求：10-15字以内，不要包含\"第{chapter_number}章\"，不要添加任何说明。\n\n"
                f"正文：\n{best_body[:1500]}"
            )

            title_response, title_usage = await ai_service.generate(
                system_prompt=title_system_prompt,
                user_prompt=title_user_prompt,
                max_tokens=80,
                temperature=0.7,
                task="continue",
            )

            total_usage = AIUsage(
                prompt_tokens=total_usage.prompt_tokens + title_usage.prompt_tokens,
                completion_tokens=total_usage.completion_tokens + title_usage.completion_tokens,
                total_tokens=total_usage.total_tokens + title_usage.total_tokens,
            )

            fallback_title = (title_response or "").strip().splitlines()[0] if title_response else ""
            fallback_title = re.sub(r"^第[一二三四五六七八九十百千\d]+章[:：\s]*", "", fallback_title).strip()

            if not fallback_title or is_title_too_similar(fallback_title, previous_title or ""):
                fallback_candidates = ["新的转折", "暗流涌动", "风暴前夜", "迷局加深", "裂隙初现", "危机逼近"]
                fallback_title = fallback_candidates[chapter_number % len(fallback_candidates)]

            generated_title = f"第{chapter_number}章 {fallback_title}"
            return best_body, generated_title, len(best_body), total_usage

        raise ValueError(f"AI 续写失败（已重试 {MAX_RETRIES} 次）")

    async def expand_text(
        self,
        text: str,
        style: str,
        word_count: int,
        chapter_title: Optional[str] = None,
        context_before: Optional[str] = None,
        context_after: Optional[str] = None,
        position_hint: Optional[str] = None,
    ) -> Tuple[str, int, AIUsage]:
        """扩写文本

        Returns:
            (expanded_text, word_count, usage)
        """
        system_prompt, user_prompt = get_expand_prompt(
            text=text,
            style=style,
            word_count=word_count,
            chapter_title=chapter_title or "未命名章节",
            context_before=context_before or "",
            context_after=context_after or "",
            position_hint=position_hint or "未知",
        )

        min_words = int(word_count * 0.8)
        max_words = int(word_count * 1.2)
        MAX_RETRIES = min(8, max(3, int(min_words / 80)))

        total_usage = None
        best_text = ""
        best_word_count = 0

        for attempt in range(MAX_RETRIES):
            prompt_chars = len(system_prompt) + len(user_prompt)
            max_tokens = min(4096, max(2048, int(max_words * 8), int(prompt_chars * 2)))

            content, usage = await ai_service.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens,
                temperature=0.7,
                task="expand",
            )

            if total_usage is None:
                total_usage = usage
            else:
                total_usage = AIUsage(
                    prompt_tokens=total_usage.prompt_tokens + usage.prompt_tokens,
                    completion_tokens=total_usage.completion_tokens + usage.completion_tokens,
                    total_tokens=total_usage.total_tokens + usage.total_tokens,
                )

            expanded_text = content.strip() if content else ""
            expanded_word_count = len(expanded_text)

            if expanded_word_count > best_word_count:
                best_text = expanded_text
                best_word_count = expanded_word_count

            if expanded_word_count >= min_words:
                return expanded_text, expanded_word_count, total_usage

        if best_text:
            return best_text, best_word_count, total_usage

        raise ValueError(f"AI 扩写失败（已重试 {MAX_RETRIES} 次）")

    async def generate_character(
        self,
        novel: Novel,
        role_type: str,
        design_direction: Optional[str] = None,
        character_name: Optional[str] = None,
    ) -> Tuple[dict, AIUsage]:
        """生成角色

        Returns:
            (character_data, usage)
        """
        existing_characters = ", ".join([char.name for char in novel.characters]) if novel.characters else "暂无"

        system_prompt, user_prompt = get_character_prompt(
            category=novel.category,
            existing_characters=existing_characters,
            role_type=role_type,
            design_direction=design_direction or "无特殊要求",
            character_name=character_name or "由AI生成",
        )

        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        # 数据类型转换
        def ensure_list(value, field_name: str) -> list:
            if isinstance(value, list):
                return value
            if isinstance(value, str):
                return [v.strip() for v in value.split(",") if v.strip()]
            return []

        def ensure_string(value, field_name: str, default: str = "") -> str:
            if isinstance(value, str):
                return value
            if value is None:
                return default
            if isinstance(value, dict):
                parts = [f"{k}: {v}" for k, v in value.items() if v]
                return ", ".join(parts) if parts else default
            if isinstance(value, list):
                return ", ".join(str(item) for item in value if item)
            return str(value) if value else default

        character_data = {
            "name": result.get("name") or character_name or "未命名角色",
            "gender": result.get("gender", "未知"),
            "age": result.get("age", 20),
            "identity": result.get("identity", "未知身份"),
            "appearance": result.get("appearance", "普通外貌"),
            "personality": ensure_list(result.get("personality", []), "personality"),
            "background": result.get("background", "背景不详"),
            "abilities": ensure_string(result.get("abilities", ""), "abilities", "无特殊能力"),
            "role_type": role_type,
        }

        return character_data, usage

    async def format_optimize(
        self,
        content: str,
        chapter_title: str,
        chapter_order: float,
        category: str,
        optimization_focus: Optional[str] = None,
    ) -> Tuple[str, AIUsage]:
        """格式优化

        Returns:
            (optimized_content, usage)
        """
        system_prompt, user_prompt = get_format_optimize_prompt(
            content=content,
            chapter_title=chapter_title,
            chapter_order=chapter_order,
            category=category,
            optimization_focus=optimization_focus or "全面优化",
        )

        optimized_content, usage = await ai_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=len(content) * 2,
            temperature=0.5,
            task="expand",
        )

        optimized_content = optimized_content.strip()
        if not optimized_content:
            raise ValueError("AI 生成了空内容")

        return optimized_content, usage

    async def rewrite_text(
        self,
        original_text: str,
        rewrite_style: str,
        novel: Novel,
        special_requirements: Optional[str] = None,
    ) -> Tuple[str, AIUsage]:
        """重写文本

        Returns:
            (rewritten_text, usage)
        """
        novel_context = f"{novel.title}\n{novel.description or '暂无简介'}"

        characters_info = "暂无角色信息"
        if novel.characters:
            characters_list = []
            for char in novel.characters[:5]:
                characters_list.append(
                    f"- {char.name}（{char.role_type}）：{char.description or '暂无描述'}"
                )
            characters_info = "\n".join(characters_list)

        system_prompt, user_prompt = get_rewrite_prompt(
            original_text=original_text,
            rewrite_style=rewrite_style,
            category=novel.category,
            novel_context=novel_context,
            characters_info=characters_info,
            special_requirements=special_requirements or "无",
        )

        original_word_count = len(original_text)
        target_word_count_ranges = {
            "保持原意": (int(original_word_count * 0.9), int(original_word_count * 1.1)),
            "增强感染力": (int(original_word_count * 1.2), int(original_word_count * 1.5)),
            "简化表达": (int(original_word_count * 0.7), int(original_word_count * 0.9)),
            "改变视角": (int(original_word_count * 0.9), int(original_word_count * 1.1)),
            "增加对话": (int(original_word_count * 1.3), int(original_word_count * 1.6)),
            "增加描写": (int(original_word_count * 1.4), int(original_word_count * 1.8)),
        }
        min_words, max_words = target_word_count_ranges.get(
            rewrite_style,
            (original_word_count, original_word_count)
        )

        validation_thresholds = {
            "保持原意": 0.8,
            "增强感染力": 1.0,
            "简化表达": 0.5,
            "改变视角": 0.8,
            "增加对话": 1.0,
            "增加描写": 1.0,
        }
        threshold = validation_thresholds.get(rewrite_style, 0.8)
        validation_min = max(int(original_word_count * threshold), 30)

        MAX_RETRIES = 3
        total_usage = None
        best_text = ""
        best_word_count = 0

        for attempt in range(MAX_RETRIES):
            prompt_chars = len(system_prompt) + len(user_prompt)
            max_tokens = min(4096, max(2048, int(max_words * 8), int(prompt_chars * 2)))

            raw_response, usage = await ai_service.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens,
                temperature=0.7,
                task="rewrite",
            )

            if total_usage is None:
                total_usage = usage
            else:
                total_usage = AIUsage(
                    prompt_tokens=total_usage.prompt_tokens + usage.prompt_tokens,
                    completion_tokens=total_usage.completion_tokens + usage.completion_tokens,
                    total_tokens=total_usage.total_tokens + usage.total_tokens,
                )

            rewritten_text = raw_response.strip()
            rewritten_word_count = len(rewritten_text)

            if rewritten_word_count > best_word_count:
                best_text = rewritten_text
                best_word_count = rewritten_word_count

            if rewritten_text and rewritten_word_count >= validation_min:
                return rewritten_text, total_usage

        if best_text:
            return best_text, total_usage

        raise ValueError(f"AI 重写失败（已重试 {MAX_RETRIES} 次）")


# 单例实例
ai_generation_service = AIGenerationService()
