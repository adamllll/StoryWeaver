"""AI路由 - AI内容生成相关端点"""
import json
import logging
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import ValidationError

from ..database import get_db
from ..middleware import ai_rate_limiter
from ..models import Novel, Chapter, Character, User
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
    AIUsage,  # 新增：用于重试机制中累计 token 使用量
    # 冒险游戏相关
    OpeningGenerationRequest,
    OpeningGenerationResponse,
    ChoiceOption,
    StoryNodeGenerationRequest,
    StoryNodeGenerationResponse,
)
from ..services import ai_service
from ..utils.auth import get_current_user
from ..utils.prompts import (
    get_outline_prompt,
    get_continue_prompt,
    get_expand_prompt,
    get_character_prompt,
    get_format_optimize_prompt,
    get_rewrite_prompt,
    get_opening_prompt,
    get_story_node_prompt,
)

router = APIRouter(prefix="/ai", tags=["AI生成"])
logger = logging.getLogger(__name__)


def extract_title_and_content(markdown_text: str) -> tuple[str, str]:
    """
    从Markdown文本中提取第一个标题和正文

    支持多种标题格式：
    1. Markdown 格式：# 标题 或 ## 标题
    2. 中文章节格式：第X章 标题
    3. 纯标题行：第一个非空行且较短（<50字）

    示例:
    输入: "# 第一章：开端\n\n正文内容..."
    输出: ("第一章：开端", "正文内容...")

    参数:
        markdown_text: Markdown格式的文本

    返回:
        (标题, 正文) 元组，如果没有标题则标题为空字符串
    """
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

        # 1. 匹配 Markdown 标题 (# 或 ## 开头的行)
        md_match = re.match(r'^#+\s*(.+)', line_stripped)
        if md_match:
            title = md_match.group(1).strip()
            content_start = i + 1
            break

        # 2. 匹配中文章节格式：第X章、第X节、第X回 等
        chapter_match = re.match(r'^第.+?[章节回][\s：:]*(.*)$', line_stripped)
        if chapter_match:
            title = line_stripped
            content_start = i + 1
            break

        # 3. 第一个非空行且较短（可能是标题）
        if i == 0 and len(line_stripped) < 50 and not line_stripped.endswith(('。', '！', '？', '…', '"', '"')):
            title = line_stripped
            content_start = i + 1
            break

        # 如果第一个非空行很长或以标点结尾，说明没有标题
        break

    # 提取正文
    content = '\n'.join(lines[content_start:]).strip()
    return title, content


def extract_scene_from_chapter(chapter: Chapter) -> str:
    """
    从章节中提取场景描述（智能提取策略）

    策略：
    1. 清理 HTML 标签（如果有）
    2. 提取章节标题、大纲和最新内容
    3. 如果章节内容为空，返回标题和大纲
    4. 如果章节内容 <= 1000 字符，返回全部
    5. 如果章节内容 > 1000 字符，返回最后 1000 字符
    6. 优化截断位置，尽量从完整句子开始

    参数:
        chapter: 章节对象

    返回:
        场景描述字符串（包含标题、大纲、内容）
    """
    import re

    def clean_html_tags(text: str) -> str:
        """清理 HTML 标签，保留纯文本"""
        if not text:
            return ""

        # 移除 HTML 标签
        text = re.sub(r'<[^>]+>', '', text)

        # 移除多余的空白字符
        text = re.sub(r'\s+', ' ', text)

        # 移除首尾空白
        text = text.strip()

        return text

    # 构建场景描述的基础部分
    scene_parts = []

    # 1. 添加章节标题
    scene_parts.append(f"【章节】：{chapter.title}")

    # 2. 添加章节大纲（如果有）
    if chapter.outline and chapter.outline.strip():
        # 清理大纲中的 HTML 标签
        clean_outline = clean_html_tags(chapter.outline)
        scene_parts.append(f"【大纲】：{clean_outline}")
    else:
        scene_parts.append("【大纲】：无")

    # 3. 添加最新情节
    scene_parts.append("【最新情节】：")

    if not chapter.content or len(chapter.content.strip()) == 0:
        # 边界情况1：章节内容为空
        scene_parts.append("（章节尚未开始，请根据标题和大纲生成分支选项）")
    else:
        # 清理 HTML 标签
        content = clean_html_tags(chapter.content)

        if len(content) <= 1000:
            # 边界情况2：内容较短，直接返回
            scene_parts.append(content)
        else:
            # 正常情况：提取最后 1000 字符
            scene = content[-1000:]

            # 优化：如果截断位置在句子中间，尝试从最近的句号开始
            sentence_markers = ['。', '！', '？', '."', '!"', '?"', '\n\n']
            for marker in sentence_markers:
                marker_pos = scene.find(marker)
                if 0 < marker_pos < 200:  # 在前 200 字符内找到句号
                    scene = scene[marker_pos + len(marker):].lstrip()
                    break

            # 确保长度在有效范围内
            if len(scene) < 50:
                # 如果优化后太短，回退到原始截取
                scene = content[-1000:]

            scene_parts.append(scene)

    # 组合所有部分
    return "\n".join(scene_parts)


@router.post("/outline", response_model=OutlineResponse)
async def generate_outline(
    request: OutlineRequest,
    current_user: User = Depends(get_current_user),
):
    """
    使用AI生成小说大纲

    参数:
        request: 大纲生成参数 (category, keywords, chapter_count, target_words, ...)
        current_user: 当前登录用户

    返回:
        生成的大纲(包含标题、简介和大纲正文)及Token使用信息
    """
    # 速率限制检查
    ai_rate_limiter.check(current_user.id)

    system_prompt, user_prompt = get_outline_prompt(
        category=request.category,
        keywords=request.keywords,
        chapter_count=request.chapter_count,
        target_words=request.target_words,
        target_audience=request.target_audience or "大众读者",
        protagonist=request.protagonist or "无",
        background=request.background or "无",
        special_requirements=request.special_requirements or "无",
    )

    try:
        # 大纲生成现在返回 JSON 格式: {title, description, outline}
        logger.info(f"AI 大纲生成开始: user_id={current_user.id}, category={request.category}")
        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        logger.info(f"AI 大纲生成完成: tokens={usage.total_tokens}")

        # 提取JSON字段
        title = result.get("title", "未命名小说").strip()
        description = result.get("description", "暂无简介").strip()
        outline = result.get("outline", "").strip()

        # 如果大纲为空,返回错误
        if not outline:
            logger.warning(f"AI 大纲生成为空: user_id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 生成了空大纲,请重试或调整提示词",
            )

        return OutlineResponse(
            title=title,
            description=description,
            outline=outline,
            usage=usage,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 大纲生成失败: {str(e)}", extra={"category": request.category})
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
    """
    使用AI续写章节内容

    参数:
        request: 续写参数 (novel_id, chapter_id, chapter_outline, word_count, ...)
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        生成的续写内容及字数统计
    """
    # 速率限制检查
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

    # 获取前文内容作为摘要
    previous_summary = ""
    if request.chapter_id:
        chapter = db.query(Chapter).filter(
            Chapter.id == request.chapter_id,
            Chapter.novel_id == request.novel_id,
        ).first()
        if chapter:
            # 取最后2000字符作为前情提要
            previous_summary = chapter.content[-2000:] if chapter.content else ""

    # 获取角色信息 JSON
    characters_list = [
        {"name": char.name, "role": char.role_type, "description": char.description}
        for char in novel.characters[:5]  # 限制为5个主要角色
    ]
    characters_json = json.dumps(characters_list, ensure_ascii=False, indent=2) if characters_list else "暂无角色设定"

    # 获取世界观设定（novel.world_settings 是列表）
    world_settings = "暂无世界观设定"
    if novel.world_settings:
        settings_parts = []
        for ws in novel.world_settings[:5]:  # 限制为5个设定
            settings_parts.append(f"- {ws.setting_type}: {ws.name} - {ws.description or '无描述'}")
        if settings_parts:
            world_settings = "\n".join(settings_parts)

    # 推断风格（根据类型）- 仅在用户未指定风格时使用
    if request.style:
        # 用户指定了风格，直接使用
        style = request.style
        logger.info(f"使用用户指定的风格: {style}")
    else:
        # 自动推断风格
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
        logger.info(f"根据小说类型 {novel.category} 自动推断风格: {style}")

    # 处理章节大纲：如果用户没有提供，使用小说整体大纲
    chapter_outline = request.chapter_outline
    if not chapter_outline:
        # 使用小说的整体大纲作为章节大纲
        if novel.outline:
            chapter_outline = f"根据小说整体大纲继续创作：\n{novel.outline[:500]}"
        else:
            chapter_outline = "根据前文内容和小说设定，自由发挥创作下一章节"

    system_prompt, user_prompt = get_continue_prompt(
        category=novel.category,
        style=style,
        characters_json=characters_json,
        world_settings=world_settings,
        previous_summary=previous_summary or "这是小说的开篇",
        chapter_outline=chapter_outline,
        word_count=request.word_count,
        special_requirements=request.special_requirements or "无",
    )

    try:
        logger.info(f"AI 续写开始: novel_id={request.novel_id}, user_id={current_user.id}")
        content, usage = await ai_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=request.word_count * 2,
            temperature=0.7,
        )

        generated_content = content.strip() if content else ""

        # 如果生成内容为空，返回错误提示
        if not generated_content:
            logger.warning(f"AI 续写生成空内容: novel_id={request.novel_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 生成了空内容，请重试或调整提示词",
            )

        # 从生成内容中提取标题（如果有）
        generated_title, generated_body = extract_title_and_content(generated_content)
        if generated_title:
            logger.info(f"从生成内容中提取到标题: {generated_title}")

        logger.info(f"AI 续写完成: word_count={len(generated_body)}, tokens={usage.total_tokens}")

        return ContinueResponse(
            content=generated_body,
            title=generated_title,
            word_count=len(generated_body),
            usage=usage,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 续写失败: {str(e)}", extra={"novel_id": request.novel_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )


@router.post("/expand", response_model=ExpandResponse)
async def expand_text(
    request: ExpandRequest,
    current_user: User = Depends(get_current_user),
):
    """
    将简短文本扩写为更详细的版本

    参数:
        request: 扩写参数 (text, style, word_count)
        current_user: 当前登录用户

    返回:
        扩写后的文本内容及字数统计
    """
    # 速率限制检查
    ai_rate_limiter.check(current_user.id)

    system_prompt, user_prompt = get_expand_prompt(
        text=request.text,
        style=request.style,
        word_count=request.word_count,
    )

    try:
        logger.info(f"AI 扩写开始: user_id={current_user.id}, style={request.style}")
        content, usage = await ai_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=request.word_count * 2,
            temperature=0.7,
        )

        expanded_text = content.strip() if content else ""

        # 如果生成内容为空，返回错误提示
        if not expanded_text:
            logger.warning(f"AI 扩写生成空内容: user_id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 生成了空内容，请重试或调整提示词",
            )

        logger.info(f"AI 扩写完成: word_count={len(expanded_text)}, tokens={usage.total_tokens}")

        return ExpandResponse(
            expanded_text=expanded_text,
            word_count=len(expanded_text),
            usage=usage,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 扩写失败: {str(e)}", extra={"style": request.style})
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
    """
    使用AI生成角色设定

    参数:
        request: 角色生成参数 (novel_id, role_type, design_direction, character_name)
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        生成的角色设定
    """
    # 速率限制检查
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

    # 获取已有角色列表
    existing_characters = ", ".join([char.name for char in novel.characters]) if novel.characters else "暂无"

    system_prompt, user_prompt = get_character_prompt(
        category=novel.category,
        existing_characters=existing_characters,
        role_type=request.role_type,
        design_direction=request.design_direction or "无特殊要求",
        character_name=request.character_name or "由AI生成",
    )

    try:
        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        logger.info(f"AI 角色生成完成: novel_id={request.novel_id}, user_id={current_user.id}")

        # 简化的数据处理：仅处理最基本的类型兼容
        # 如果 AI 仍然返回错误格式，让 Pydantic 验证捕获并报错
        def ensure_list(value, field_name: str) -> list:
            """确保值是列表，否则尝试转换"""
            if isinstance(value, list):
                return value
            if isinstance(value, str):
                return [v.strip() for v in value.split(",") if v.strip()]
            logger.warning(f"字段 {field_name} 格式异常: {type(value)}, 使用空列表")
            return []

        def ensure_string(value, field_name: str, default: str = "") -> str:
            """确保值是字符串，否则尝试转换"""
            if isinstance(value, str):
                return value
            if isinstance(value, (dict, list)):
                logger.warning(f"字段 {field_name} 格式异常: {type(value)}, 转换为字符串")
                return str(value)
            return default

        character = GeneratedCharacter(
            name=result.get("name") or request.character_name or "未命名角色",
            gender=result.get("gender", "未知"),
            age=result.get("age", 20),
            identity=result.get("identity", "未知身份"),
            appearance=result.get("appearance", "普通外貌"),
            personality=ensure_list(result.get("personality", []), "personality"),
            background=result.get("background", "背景不详"),
            abilities=ensure_string(result.get("abilities", ""), "abilities", "无特殊能力"),
            role_type=request.role_type,
        )

        return CharacterResponse(
            character=character,
            usage=usage,
        )

    except ValidationError as e:
        logger.error(f"AI 返回数据验证失败: {e.errors()}", extra={"result": str(result)[:500] if 'result' in dir() else None})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 返回格式错误: {e.errors()}",
        )
    except Exception as e:
        logger.error(f"AI 角色生成失败: {str(e)}", extra={"novel_id": request.novel_id})
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
    """
    使用AI优化单个章节的格式和表达

    参数:
        request: 格式优化参数 (chapter_id, optimization_focus)
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        优化后的章节内容及字数统计
    """
    # 速率限制检查
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

    # 生成提示词
    system_prompt, user_prompt = get_format_optimize_prompt(
        content=chapter.content,
        chapter_title=chapter.title,
        chapter_order=chapter.order_num,
        category=novel.category,
        optimization_focus=request.optimization_focus or "全面优化",
    )

    try:
        logger.info(f"AI 格式优化开始: chapter_id={request.chapter_id}, user_id={current_user.id}")

        # 调用 AI 服务
        optimized_content, usage = await ai_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=len(chapter.content) * 2,  # 预留足够空间
            temperature=0.3,  # 较低温度，保持稳定性
            task="expand",  # 复用 expand 任务的模型配置
        )

        optimized_content = optimized_content.strip()

        # 如果生成内容为空，返回错误
        if not optimized_content:
            logger.warning(f"AI 格式优化生成空内容: chapter_id={request.chapter_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 生成了空内容，请重试",
            )

        logger.info(
            f"AI 格式优化完成: chapter_id={request.chapter_id}, "
            f"original={len(chapter.content)}, optimized={len(optimized_content)}, "
            f"tokens={usage.total_tokens}"
        )

        return FormatOptimizeResponse(
            optimized_content=optimized_content,
            original_word_count=len(chapter.content),
            optimized_word_count=len(optimized_content),
            usage=usage,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 格式优化失败: {str(e)}", extra={"chapter_id": request.chapter_id})
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
    """
    批量优化多个章节的格式和表达

    参数:
        request: 批量优化参数 (novel_id, chapter_ids, optimization_focus)
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        每个章节的优化结果及总体统计
    """
    # 速率限制检查（批量操作按单次请求计费）
    ai_rate_limiter.check(current_user.id)

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

    logger.info(
        f"AI 批量格式优化开始: novel_id={request.novel_id}, "
        f"chapter_count={len(chapters)}, user_id={current_user.id}"
    )

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

        # 生成提示词
        system_prompt, user_prompt = get_format_optimize_prompt(
            content=chapter.content,
            chapter_title=chapter.title,
            chapter_order=chapter.order_num,
            category=novel.category,
            optimization_focus=request.optimization_focus or "全面优化",
        )

        try:
            # 调用 AI 服务
            optimized_content, usage = await ai_service.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=len(chapter.content) * 2,
                temperature=0.3,
                task="expand",
            )

            optimized_content = optimized_content.strip()

            if not optimized_content:
                raise Exception("AI 生成了空内容")

            # 累计 Token 使用量
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

            logger.info(f"章节 {chapter.id} 优化成功")

        except Exception as e:
            logger.error(f"章节 {chapter.id} 优化失败: {str(e)}")
            results.append(OptimizedChapterResult(
                chapter_id=chapter.id,
                chapter_title=chapter.title,
                success=False,
                error_message=str(e),
            ))
            failed_count += 1

    logger.info(
        f"AI 批量格式优化完成: novel_id={request.novel_id}, "
        f"success={success_count}, failed={failed_count}, total_tokens={total_tokens}"
    )

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
    """
    使用AI重写指定文本

    功能说明：
    - 根据用户选择的风格重写原文
    - 保持故事连贯性和人物设定
    - 支持多种重写风格：保持原意、增强感染力、简化表达、改变视角、增加对话、增加描写

    参数:
        request: 重写参数 (novel_id, chapter_id, original_text, rewrite_style, special_requirements)
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        重写后的文本及字数对比
    """
    # 速率限制检查
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

    # 构建小说上下文信息
    novel_context = f"{novel.title}\n{novel.description or '暂无简介'}"

    # 获取角色信息
    characters_info = "暂无角色信息"
    if novel.characters:
        characters_list = []
        for char in novel.characters[:5]:  # 限制为5个主要角色
            characters_list.append(
                f"- {char.name}（{char.role_type}）：{char.description or '暂无描述'}"
            )
        characters_info = "\n".join(characters_list)

    # 生成提示词
    system_prompt, user_prompt = get_rewrite_prompt(
        original_text=request.original_text,
        rewrite_style=request.rewrite_style,
        category=novel.category,
        novel_context=novel_context,
        characters_info=characters_info,
        special_requirements=request.special_requirements or "无",
    )

    # 计算目标字数范围（用于验证）
    original_word_count = len(request.original_text)
    target_word_count_ranges = {
        "保持原意": (int(original_word_count * 0.9), int(original_word_count * 1.1)),
        "增强感染力": (int(original_word_count * 1.2), int(original_word_count * 1.5)),
        "简化表达": (int(original_word_count * 0.7), int(original_word_count * 0.9)),
        "改变视角": (int(original_word_count * 0.9), int(original_word_count * 1.1)),
        "增加对话": (int(original_word_count * 1.3), int(original_word_count * 1.6)),
        "增加描写": (int(original_word_count * 1.4), int(original_word_count * 1.8)),
    }
    min_words, max_words = target_word_count_ranges.get(
        request.rewrite_style,
        (original_word_count, original_word_count)
    )

    # 设置验证阈值：至少达到目标下限的90%，且不低于30字
    # 这样可以避免 Gemini 模型输出过短的内容
    validation_min = max(int(min_words * 0.9), 30)

    # 重试机制配置
    MAX_RETRIES = 3
    last_error = None
    total_usage = None

    for attempt in range(MAX_RETRIES):
        try:
            logger.info(
                f"AI 重写尝试 {attempt + 1}/{MAX_RETRIES}: novel_id={request.novel_id}, "
                f"user_id={current_user.id}, style={request.rewrite_style}, "
                f"original_length={original_word_count}, target_range={min_words}-{max_words}"
            )

            # 调用 AI 服务
            rewritten_text, usage = await ai_service.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=original_word_count * 3,  # 预留足够空间（某些风格可能大幅扩写）
                temperature=0.7,  # 中等温度，保持创意性
                task="expand",  # 复用 expand 任务的模型配置
            )

            rewritten_text = rewritten_text.strip()
            rewritten_word_count = len(rewritten_text)

            # 累计 token 使用量
            if total_usage is None:
                total_usage = usage
            else:
                total_usage = AIUsage(
                    prompt_tokens=total_usage.prompt_tokens + usage.prompt_tokens,
                    completion_tokens=total_usage.completion_tokens + usage.completion_tokens,
                    total_tokens=total_usage.total_tokens + usage.total_tokens,
                )

            # 验证：检查是否为空
            if not rewritten_text:
                last_error = "AI 生成了空内容"
                logger.warning(
                    f"重写尝试 {attempt + 1} 失败: {last_error}, novel_id={request.novel_id}"
                )
                continue

            # 验证：检查字数是否符合要求
            if rewritten_word_count < validation_min:
                last_error = f"输出字数 {rewritten_word_count} 低于最低要求 {validation_min}（目标范围 {min_words}-{max_words}）"
                logger.warning(
                    f"重写尝试 {attempt + 1} 失败: {last_error}, novel_id={request.novel_id}"
                )
                continue

            # 验证通过
            logger.info(
                f"AI 重写成功: novel_id={request.novel_id}, "
                f"original={original_word_count}, rewritten={rewritten_word_count}, "
                f"attempts={attempt + 1}, total_tokens={total_usage.total_tokens}"
            )

            return RewriteResponse(
                rewritten_text=rewritten_text,
                original_word_count=original_word_count,
                rewritten_word_count=rewritten_word_count,
                usage=total_usage,
            )

        except HTTPException:
            raise
        except Exception as e:
            last_error = str(e)
            logger.error(
                f"重写尝试 {attempt + 1} 异常: {last_error}, novel_id={request.novel_id}"
            )
            if attempt == MAX_RETRIES - 1:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"AI重写失败: {last_error}",
                )

    # 所有重试都失败
    logger.error(
        f"AI 重写最终失败: novel_id={request.novel_id}, "
        f"attempts={MAX_RETRIES}, last_error={last_error}"
    )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"AI 重写失败（已重试 {MAX_RETRIES} 次）: {last_error}",
    )
# ========== 冒险游戏：AI生成端点 ==========


@router.post("/generate-opening", response_model=OpeningGenerationResponse)
async def generate_adventure_opening(
    request: OpeningGenerationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    为冒险游戏生成开局

    生成内容：
    - 故事背景（200-300字）
    - 初始场景（500-800字）
    - 3-4个开局选项

    参数:
        request: 开局生成参数 (category, keywords, protagonist_name, etc.)
        current_user: 当前登录用户

    返回:
        生成的开局内容和选项
    """
    # 速率限制检查
    ai_rate_limiter.check(current_user.id)

    system_prompt, user_prompt = get_opening_prompt(
        category=request.category,
        keywords=request.keywords,
        protagonist_name=request.protagonist_name,
        protagonist_gender=request.protagonist_gender,
        protagonist_personality=request.protagonist_personality or "无特殊设定",
    )

    try:
        logger.info(
            f"AI 开局生成开始: user_id={current_user.id}, category={request.category}, "
            f"protagonist={request.protagonist_name}"
        )

        # 调用 AI 服务，期望返回 JSON 格式
        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,  # 较高温度，增加创意性
        )

        logger.info(f"AI 开局生成完成: tokens={usage.total_tokens}")

        # 提取 JSON 字段
        background = result.get("background", "").strip()
        initial_scene = result.get("initial_scene", "").strip()
        choices_data = result.get("choices", [])

        # 验证必要字段
        if not background or not initial_scene or not choices_data:
            logger.warning(f"AI 开局生成缺少必要字段: user_id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 生成了不完整的开局，请重试",
            )

        # 转换选项为 ChoiceOption 对象
        choices = []
        for i, choice_data in enumerate(choices_data):
            try:
                choices.append(ChoiceOption(
                    index=choice_data.get("index", i),
                    text=choice_data["text"],
                    inner_monologue=choice_data["inner_monologue"],
                    success_rate=float(choice_data["success_rate"]),
                    difficulty=choice_data["difficulty"],
                    potential_reward=choice_data["potential_reward"],
                    potential_risk=choice_data["potential_risk"],
                    state_requirements=choice_data.get("state_requirements"),
                ))
            except (KeyError, ValueError, ValidationError) as e:
                logger.warning(f"选项 {i} 验证失败: {e}, 跳过此选项")
                continue

        if not choices:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 未生成有效的选项",
            )

        return OpeningGenerationResponse(
            background=background,
            initial_scene=initial_scene,
            choices=choices,
            usage=usage,
        )

    except ValidationError as e:
        logger.error(f"AI 返回数据验证失败: {e.errors()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 返回格式错误: {e.errors()}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 开局生成失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )


@router.post("/generate-story-node", response_model=StoryNodeGenerationResponse)
async def generate_story_node(
    request: StoryNodeGenerationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    根据玩家选择和判定结果生成故事节点

    生成内容：
    - 本章内容（800-1500字）
    - 状态变化
    - 2-4个新的选项

    参数:
        request: 故事节点生成参数 (包含前文、选择、判定结果、玩家状态等)
        current_user: 当前登录用户

    返回:
        生成的故事节点内容、状态变化和新选项
    """
    # 速率限制检查
    ai_rate_limiter.check(current_user.id)

    system_prompt, user_prompt = get_story_node_prompt(
        category=request.category,
        keywords=request.keywords,
        protagonist_name=request.protagonist_name,
        protagonist_gender=request.protagonist_gender,
        protagonist_personality=request.protagonist_personality,
        story_summary=request.story_summary,
        choice_text=request.choice_text,
        choice_inner_monologue=getattr(request, 'choice_inner_monologue', ""),
        choice_potential_reward=getattr(request, 'choice_potential_reward', "未知"),
        choice_potential_risk=getattr(request, 'choice_potential_risk', "未知"),
        choice_difficulty=getattr(request, 'choice_difficulty', "普通"),
        success=request.success,
        roll_value=request.roll_value,
        target=request.target,
        success_rate=request.success_rate,
        player_state=request.player_state,
    )

    try:
        logger.info(
            f"AI 故事节点生成开始: user_id={current_user.id}, "
            f"choice='{request.choice_text[:30]}...', success={request.success}"
        )

        # 调用 AI 服务，期望返回 JSON 格式
        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,  # 中等温度，保持连贯性
            max_tokens=3000,  # 足够容纳800-1500字内容
        )

        logger.info(f"AI 故事节点生成完成: tokens={usage.total_tokens}")

        # 提取 JSON 字段
        content = result.get("content", "").strip()
        state_changes = result.get("state_changes", {})
        choices_data = result.get("choices", [])

        # 验证必要字段
        if not content or not choices_data:
            logger.warning(f"AI 故事节点生成缺少必要字段: user_id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 生成了不完整的故事节点，请重试",
            )

        # 转换选项为 ChoiceOption 对象
        choices = []
        for i, choice_data in enumerate(choices_data):
            try:
                choices.append(ChoiceOption(
                    index=choice_data.get("index", i),
                    text=choice_data["text"],
                    inner_monologue=choice_data["inner_monologue"],
                    success_rate=float(choice_data["success_rate"]),
                    difficulty=choice_data["difficulty"],
                    potential_reward=choice_data["potential_reward"],
                    potential_risk=choice_data["potential_risk"],
                    state_requirements=choice_data.get("state_requirements"),
                ))
            except (KeyError, ValueError, ValidationError) as e:
                logger.warning(f"选项 {i} 验证失败: {e}, 跳过此选项")
                continue

        if not choices:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI 未生成有效的选项",
            )

        return StoryNodeGenerationResponse(
            content=content,
            state_changes=state_changes,
            choices=choices,
            usage=usage,
        )

    except ValidationError as e:
        logger.error(f"AI 返回数据验证失败: {e.errors()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 返回格式错误: {e.errors()}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI 故事节点生成失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI生成失败: {str(e)}",
        )
