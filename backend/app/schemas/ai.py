"""AI 功能数据模式 - API 请求/响应验证"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal


class AIUsage(BaseModel):
    """令牌使用信息"""

    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


# ========== 大纲生成 ==========


class OutlineRequest(BaseModel):
    """AI 大纲生成请求模式"""

    category: Literal["玄幻", "言情", "科幻", "悬疑", "历史", "都市", "其他"]
    keywords: str = Field(..., min_length=2, max_length=200)
    chapter_count: int = Field(default=50, ge=10, le=200)
    target_words: int = Field(default=100, ge=10, le=500)  # 单位：万字
    target_audience: Optional[str] = Field(None, max_length=50)
    protagonist: Optional[str] = Field(None, max_length=500)
    background: Optional[str] = Field(None, max_length=500)
    special_requirements: Optional[str] = Field(None, max_length=500)


class OutlineResponse(BaseModel):
    """AI 大纲生成响应模式"""

    title: str = Field(..., description="AI生成的小说标题")
    description: str = Field(..., description="AI生成的故事简介")
    outline: str = Field(..., description="完整的小说大纲(Markdown格式)")
    usage: AIUsage


# ========== 章节续写 ==========


class ContinueRequest(BaseModel):
    """AI 章节续写请求模式"""

    novel_id: int
    chapter_id: Optional[int] = None  # 续写的基础章节
    chapter_outline: Optional[str] = Field(
        None,
        max_length=2000,
        description="章节大纲（可选）。如果不提供，AI 将根据小说整体大纲和前文内容自动生成"
    )
    word_count: int = Field(default=2000, ge=500, le=5000)
    style: Optional[Literal["热血爽文", "细腻感人", "紧张刺激", "轻松幽默", "严肃正剧"]] = Field(
        None,
        description="续写风格（可选）。如果不指定，将根据小说类型自动推断"
    )
    special_requirements: Optional[str] = Field(None, max_length=500)
    cursor_position: Optional[int] = Field(
        None,
        ge=0,
        description="光标在章节内容中的位置（字符偏移量）。如果提供，将从此位置开始续写；否则从章节末尾续写"
    )
    mode: Optional[Literal["continue", "generate_chapter"]] = Field(
        "continue",
        description="生成模式：continue (续写) 或 generate_chapter (生成整章)"
    )


class ContinueResponse(BaseModel):
    """AI 章节续写响应模式"""

    content: str
    title: str = Field(default="", description="从生成内容中提取的章节标题（如果有）")
    word_count: int
    usage: AIUsage


# ========== 文本扩写 ==========


class ExpandRequest(BaseModel):
    """AI 文本扩写请求模式"""

    text: str = Field(..., min_length=5, max_length=1000)
    style: Literal["详细描写", "动作描写", "心理描写", "环境描写"] = "详细描写"
    word_count: int = Field(default=500, ge=100, le=2000)
    chapter_title: Optional[str] = Field(None, max_length=200, description="章节标题")
    context_before: Optional[str] = Field(None, max_length=4000, description="选中文本上文")
    context_after: Optional[str] = Field(None, max_length=4000, description="选中文本下文")
    position_hint: Optional[str] = Field(None, max_length=120, description="选中文本在全文中的位置提示")


class ExpandResponse(BaseModel):
    """AI 文本扩写响应模式"""

    expanded_text: str
    word_count: int
    usage: AIUsage
    warning: Optional[str] = Field(default=None, description="扩写未达目标时的提示信息")


# ========== 角色生成 ==========


class CharacterRequest(BaseModel):
    """AI 角色生成请求模式"""

    novel_id: int
    role_type: Literal["主角", "女主", "反派", "配角", "导师"]
    design_direction: Optional[str] = Field(None, max_length=200)
    character_name: Optional[str] = Field(None, max_length=50)


class GeneratedCharacter(BaseModel):
    """生成的角色信息"""

    name: str
    gender: str
    age: int
    identity: str
    appearance: str
    personality: List[str]
    background: str
    abilities: str
    role_type: str


class CharacterResponse(BaseModel):
    """AI 角色生成响应模式"""

    character: GeneratedCharacter
    usage: AIUsage


# ========== 格式优化 ==========


class FormatOptimizeRequest(BaseModel):
    """AI 格式优化请求模式（单章）"""

    chapter_id: int = Field(..., description="要优化的章节ID")
    optimization_focus: Optional[str] = Field(
        "全面优化",
        max_length=200,
        description="优化重点，如：修正错别字、优化对话格式、调整段落长度等"
    )


class FormatOptimizeResponse(BaseModel):
    """AI 格式优化响应模式（单章）"""

    optimized_content: str = Field(..., description="优化后的章节内容")
    original_word_count: int = Field(..., description="原文字数")
    optimized_word_count: int = Field(..., description="优化后字数")
    usage: AIUsage


class FormatOptimizeBatchRequest(BaseModel):
    """AI 批量格式优化请求模式"""

    novel_id: int = Field(..., description="小说ID")
    chapter_ids: List[int] = Field(..., min_items=1, max_items=20, description="要优化的章节ID列表（最多20章）")
    optimization_focus: Optional[str] = Field(
        "全面优化",
        max_length=200,
        description="优化重点"
    )


class OptimizedChapterResult(BaseModel):
    """单个章节的优化结果"""

    chapter_id: int
    chapter_title: str
    success: bool
    optimized_content: Optional[str] = None
    original_word_count: Optional[int] = None
    optimized_word_count: Optional[int] = None
    error_message: Optional[str] = None


class FormatOptimizeBatchResponse(BaseModel):
    """AI 批量格式优化响应模式"""

    results: List[OptimizedChapterResult] = Field(..., description="每章的优化结果")
    success_count: int = Field(..., description="成功优化的章节数")
    failed_count: int = Field(..., description="失败的章节数")
    total_usage: AIUsage = Field(..., description="总Token使用量")


# ========== 文本重写 ==========


class RewriteRequest(BaseModel):
    """AI 重写请求模式"""

    novel_id: int = Field(..., description="小说ID（用于获取上下文）")
    chapter_id: Optional[int] = Field(None, description="章节ID（可选，用于获取上下文）")
    original_text: str = Field(..., min_length=10, max_length=2000, description="要重写的原文")
    rewrite_style: Literal["保持原意", "增强感染力", "简化表达", "改变视角", "增加对话", "增加描写"] = Field(
        "保持原意",
        description="重写风格"
    )
    special_requirements: Optional[str] = Field(None, max_length=500, description="特殊要求")


class RewriteResponse(BaseModel):
    """AI 重写响应模式"""

    rewritten_text: str = Field(..., description="重写后的文本")
    original_word_count: int = Field(..., description="原文字数")
    rewritten_word_count: int = Field(..., description="重写后字数")
    usage: AIUsage
    warning: Optional[str] = Field(default=None, description="重写未达目标时的提示信息")


# ========== 冒险游戏：开局生成 ==========


class OpeningGenerationRequest(BaseModel):
    """AI 开局生成请求模式"""

    category: Literal["玄幻", "言情", "科幻", "悬疑", "都市", "其他"] = Field(..., description="小说类型")
    keywords: List[str] = Field(..., min_items=1, max_items=5, description="关键词列表（1-5个）")
    protagonist_name: str = Field(..., min_length=1, max_length=100, description="主角姓名")
    protagonist_gender: Literal["male", "female", "other"] = Field(..., description="主角性别")
    protagonist_personality: Optional[str] = Field(None, max_length=200, description="主角性格（可选）")


class ChoiceOption(BaseModel):
    """选项结构"""

    index: int = Field(..., ge=0, description="选项索引")
    text: str = Field(..., min_length=5, max_length=100, description="选项文本")
    inner_monologue: str = Field(..., min_length=10, max_length=200, description="内心独白")
    success_rate: float = Field(..., ge=0.0, le=1.0, description="基础成功率（0-1）")
    difficulty: Literal["简单", "普通", "困难", "极限"] = Field(..., description="难度等级")
    potential_reward: str = Field(..., min_length=5, max_length=100, description="潜在收益")
    potential_risk: str = Field(..., min_length=5, max_length=100, description="潜在风险")
    state_requirements: Optional[dict] = Field(None, description="前置条件（开局为 null）")


class OpeningGenerationResponse(BaseModel):
    """AI 开局生成响应模式"""

    background: str = Field(..., min_length=100, description="故事背景（200-300字）")
    initial_scene: str = Field(..., min_length=300, description="初始场景（500-800字）")
    choices: List[ChoiceOption] = Field(..., min_items=2, max_items=4, description="开局选项（2-4个）")
    usage: AIUsage


# ========== 冒险游戏：故事节点生成 ==========


class StoryNodeGenerationRequest(BaseModel):
    """AI 故事节点生成请求模式"""

    category: Literal["玄幻", "言情", "科幻", "悬疑", "都市", "其他"] = Field(..., description="小说类型")
    keywords: List[str] = Field(..., description="关键词列表")
    protagonist_name: str = Field(..., description="主角姓名")
    protagonist_gender: Literal["male", "female", "other"] = Field(..., description="主角性别")
    protagonist_personality: str = Field(..., description="主角性格")
    story_summary: str = Field(..., max_length=3000, description="前文概要（最多3000字）")
    choice_text: str = Field(..., description="玩家选择的文本")
    success: bool = Field(..., description="判定是否成功")
    roll_value: int = Field(..., ge=1, le=100, description="投骰值（1-100）")
    target: int = Field(..., ge=0, le=100, description="目标值（0-100）")
    success_rate: float = Field(..., ge=0.0, le=1.0, description="成功率（0-1）")
    player_state: dict = Field(..., description="玩家当前状态")


class StoryNodeGenerationResponse(BaseModel):
    """AI 故事节点生成响应模式"""

    content: str = Field(..., min_length=500, description="本章内容（800-1500字）")
    state_changes: dict = Field(..., description="状态变化")
    choices: List[ChoiceOption] = Field(..., min_items=2, max_items=4, description="新的选项（2-4个）")
    usage: AIUsage
