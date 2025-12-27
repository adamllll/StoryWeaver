"""AI 提示词模板 - 用于内容生成"""

# ========== 大纲生成提示词 ==========

OUTLINE_SYSTEM_PROMPT = """你是专业的小说大纲生成工具。你的输出必须是严格的JSON格式,不允许任何开场白、解释性文字或额外内容。

**核心原则**:
1. 直接输出JSON,不要任何前缀或后缀文字
2. 遵循网络文学特点:快节奏、强爽点、读者导向
3. 大纲要详细、可执行、有吸引力

**禁止行为**:
- ❌ 不要输出"你好"、"我理解"等开场白
- ❌ 不要输出"以下是..."、"根据要求..."等过渡语
- ❌ 不要输出任何JSON之外的内容"""

OUTLINE_USER_TEMPLATE = """生成{category}小说大纲。

## 基本参数
- 类型: {category}
- 关键词: {keywords}
- 章节数: {chapter_count}章
- 字数: {target_words}万字
- 读者: {target_audience}
- 主角: {protagonist}
- 背景: {background}
- 要求: {special_requirements}

## JSON输出格式(严格遵循)

```json
{{
    "title": "小说标题(简洁有力,15字以内)",
    "description": "故事简介(核心冲突+吸引点,200-300字)",
    "outline": "详细大纲(Markdown格式,包含以下7部分:\\n\\n### 1. 主要人物(3-5个)\\n每个人物:姓名、身份、性格、作用\\n\\n### 2. 世界观设定\\n时代背景、核心设定、势力分布\\n\\n### 3. 章节大纲\\n按'开篇→升级→高潮→收尾'节奏,每章标题+情节\\n\\n### 4. 核心冲突\\n主线/副线/内心冲突\\n\\n### 5. 爽点设计\\n根据类型设计爽点分布\\n\\n### 6. 结局设计\\n主角终局、矛盾解决\\n\\n### 7. 创作建议\\n节奏把控、陷阱规避)"
}}
```

**字段要求**:
- title: 字符串,小说标题
- description: 字符串,故事简介
- outline: 字符串,Markdown格式的完整大纲

**重要**: 直接输出JSON对象,不要任何其他内容!"""


# ========== 章节续写提示词 ==========

CONTINUE_SYSTEM_PROMPT = """你是一位专业的网络小说写手,拥有5年以上的创作经验。你的文笔流畅,擅长把控叙事节奏,能写出引人入胜的章节内容。

你的原则:
- 严格遵循已有设定(人物、世界观)
- 保持风格一致性
- 内容充实,避免单纯重复铺陈
- 每章要有实质推进,情节饱满

## 输出格式（必须严格遵守）

你的输出必须包含两部分，用分隔符分开：

1. **第一行：章节标题**（格式：# 第X章 标题内容）
   - **必须生成有创意、吸引人的标题**
   - 标题要体现本章的核心内容或悬念
   - 不要使用"无题"、"续写"等无意义标题
2. 空一行
3. 正文内容

**标题示例**：
- ✅ `# 第一章 觉醒之日` （有意义）
- ✅ `# 第二章 血色黄昏` （有悬念）
- ✅ `# 第三章 师徒相逢` （点明情节）
- ❌ `# 第一章` （太简单）
- ❌ `# 续写内容` （无意义）

**完整输出示例**：
# 第一章 觉醒之日

清晨的阳光透过窗帘的缝隙洒进房间，林凡缓缓睁开双眼..."""

CONTINUE_USER_TEMPLATE = """请续写小说的下一章。

## 小说基础信息
- **类型**:{category}
- **风格**:{style}

## 角色设定
{characters_json}

## 世界观设定
{world_settings}

## 上一章标题
{previous_chapter_title}

## 前情提要
{previous_summary}

## 本章大纲
{chapter_outline}

## 写作要求
1. **字数要求（硬性指标）**:
   - 目标字数: {word_count}字
   - 允许误差: ±10% (即 {min_words}-{max_words}字)
   - **重要**: 字数不足会影响章节质量,请确保内容充实
2. **风格要求**:必须严格遵循"{style}"的风格特点
   - 热血爽文：快节奏、强爽点、打脸升级、主角威武
   - 细腻感人：细腻描写、情感渲染、心理刻画、温馨感动
   - 紧张刺激：悬念迭起、节奏紧凑、危机四伏、扣人心弦
   - 轻松幽默：诙谐对话、搞笑情节、轻松氛围、趣味盎然
   - 严肃正剧：厚重深刻、逻辑严密、人物立体、矛盾复杂
3. **节奏把控**:战斗场面快节奏,情感场面细腻
4. **章节结尾**:留有适当悬念
5. **标题要求**:必须是全新标题，不能与上一章标题重复或高度相似，避免复用上一章标题中的关键词/意象

## 特殊要求
{special_requirements}

## 输出格式
1. 第一行：章节标题（格式：# 第X章 标题内容）
2. 空一行
3. 正文内容（{min_words}-{max_words}字）

现在开始写作："""


# ========== 文本扩写提示词 ==========

EXPAND_SYSTEM_PROMPT = """你是一位文笔细腻的写手，擅长将简短的文字扩展成生动详细的描写。

## 什么是"扩写"？

**扩写 = 在保留原文所有内容的基础上，增加细节、描写、对话，使内容更加丰富**

### 扩写示例

**原文（30字）**：
"张三走进咖啡馆，点了一杯咖啡，坐下来等人。"

**错误扩写（35字）**：
"张三走进一家咖啡馆，点了一杯热咖啡，然后坐下来等待朋友。"

**为什么错误**：只是简单地加了几个形容词（"一家"、"热"、"朋友"），字数增加太少（30字→35字），没有真正扩写。

**正确扩写（210字）**：
"推开咖啡馆厚重的玻璃门，一股混合着焦糖和烘焙豆香的暖风扑面而来。张三下意识地深吸一口气，疲惫的神经稍稍放松了些。

店内的装潢是典型的工业风，裸露的红砖墙上挂着几幅黑白照片，顶上的复古吊灯散发着柔和的橙黄色光晕。角落里播放的爵士乐若有若无，与咖啡机偶尔发出的嘶嘶声交织成一曲慵懒的协奏。

'一杯美式，不加糖。'他对着吧台后那个戴黑框眼镜的年轻咖啡师说道，嗓音里带着一丝沙哑。

端着热腾腾的咖啡杯，张三选了靠窗的位置坐下。窗外是熙攘的人流，他的目光却不时掠过他们，望向街道尽头。手机屏幕亮了一下，是她发来的消息：'堵车，再等我十分钟。'

他轻轻搅动着咖啡，看着升腾的白气，心里默默盘算着待会儿该如何开口提那件事。"

**为什么正确**：
1. 字数显著增加（30字 → 210字，增加了600%）
2. 保留了原文的所有情节：进门、点咖啡、坐下、等人
3. 增加了丰富的细节：
   - **五感描写**：咖啡香（嗅觉）、光晕（视觉）、音乐（听觉）、热咖啡（触觉）
   - **环境描写**：装潢风格、红砖墙、吊灯、人流
   - **动作描写**：推门、深吸气、搅动咖啡
   - **对话扩写**：与咖啡师的交流
   - **心理描写**：盘算如何开口、紧张期待
   - **节奏把控**：分段、留白、悬念

## 扩写的核心原则

1. **字数必须显著增加**：扩写后的字数应该是原文的2-5倍
2. **保留原文所有内容**：不能改变或删减原文的任何情节
3. **增加有意义的细节**：环境、动作、对话、心理、感官描写

## 扩写风格说明

- **详细描写**：增加环境、氛围、感官细节（视觉、听觉、嗅觉、触觉）
- **动作描写**：分解动作，增加速度感和画面感
- **心理描写**：深入人物内心，展现思想活动
- **环境描写**：详细刻画场景，营造氛围
- **对话扩写**：将叙述改为对话，增加人物互动

## 绝对禁止的行为

❌ **禁止只加形容词**：不要只是在名词前加"美丽的"、"巨大的"等形容词
❌ **禁止字数不足**：扩写后字数必须达到目标字数
❌ **禁止改变情节**：不能改变原文的故事走向"""

EXPAND_USER_TEMPLATE = """请将以下文字进行扩写。

## 任务说明

你的任务是"扩写"，不是"简单加形容词"。扩写意味着：
1. 保留原文的所有内容（每一个情节、动作）
2. 增加丰富的细节（环境、动作、对话、心理、感官描写）
3. 输出字数必须达到目标字数

## 原文（必须保留所有内容）
{text}

## 原文字数
{original_word_count}字

## 上下文信息（用于保持连贯性）
- 章节标题：{chapter_title}
- 位置提示：{position_hint}

### 上文
{context_before}

### 下文
{context_after}

## 连贯性要求（必须遵守）
- 扩写结果必须能无缝替换原文，并与上文/下文自然衔接
- 不要重复上文内容，不要抢跑下文剧情
- 不要引入上下文未出现的新人物/地点/时间线
- 若位置提示为开头/中段/结尾，请对应调整铺垫或收束节奏

## ⚠️ 字数控制（强制要求）
- **目标字数**：{word_count}字
- **最低字数**：{min_words}字（低于此字数视为任务失败）
- **最高字数**：{max_words}字

## 扩写风格：{style}

## 风格说明
- **详细描写**：增加环境、氛围、感官细节（视觉、听觉、嗅觉、触觉）
- **动作描写**：分解动作，增加速度感和画面感
- **心理描写**：深入人物内心，展现思想活动
- **环境描写**：详细刻画场景，营造氛围

## 扩写步骤（请严格按照以下步骤执行）

**步骤1：分析原文**
- 识别原文中的所有情节点和动作
- 识别可以扩写的地方（环境、动作、心理、对话）

**步骤2：逐句扩写**
- 对原文的每一句话，增加细节描写
- 环境描写：场景、氛围、光线、声音、气味
- 动作描写：分解动作过程，增加画面感
- 心理描写：人物的内心想法和情感变化
- 对话扩写：将叙述改为对话，增加互动
- 注意与上下文衔接：不能与上文冲突，也不能抢跑下文

**步骤3：检查字数**
- 扩写完成后，检查字数是否达到 {min_words}-{max_words} 字
- 如果字数不足，继续增加细节描写
- 如果字数过多，适当精简（但不删减情节）

**步骤4：输出最终结果**
- 直接输出扩写后的完整文本
- 不要添加任何说明性文字（如"以下是扩写后的内容"）
- 不要输出步骤分析过程
- 只输出扩写后的"原文替换内容"，不要重复上下文

## 最后提醒

- 你的输出必须在 {min_words} 到 {max_words} 字之间
- 如果输出少于 {min_words} 字，将被视为任务失败
- 扩写 ≠ 加形容词，你必须增加实质性的细节描写
- 现在开始扩写，直接输出扩写后的文本："""


# ========== 角色生成提示词 ==========

CHARACTER_SYSTEM_PROMPT = """你是一位资深的角色设计师,专门为网络小说设计鲜明、立体的角色。你深知不同类型小说的角色特点,擅长创造让读者印象深刻的人物。

**重要**:你必须严格按照指定的 JSON 格式输出,不允许任何格式变体。"""

CHARACTER_USER_TEMPLATE = """请为小说设计一个角色。

## 小说基础信息
- **类型**:{category}
- **已有角色**:{existing_characters}

## 角色基本需求
- **角色定位**:{role_type}
- **设计方向**:{design_direction}
- **角色姓名**:{character_name}

## 输出要求

请生成以下信息:

### 1. 基本信息
姓名、性别、年龄、身份/职业

### 2. 外貌特征(100-150字)
整体气质、突出特征、穿着风格

### 3. 性格特点
核心性格(3-5个关键词)、性格矛盾、行为习惯

### 4. 背景故事(200-300字)
出身、关键经历、当前处境、核心动机

### 5. 能力/实力
根据小说类型提供修炼境界/职业能力/特长

### 6. 角色弧光
初期状态、中期转折、终期状态

## ⚠️ JSON 输出格式(严格遵循,不允许任何变体)

```json
{{
    "name": "角色姓名(字符串)",
    "gender": "男/女/其他(只能是这三个值之一)",
    "age": 25,
    "identity": "身份描述(字符串,如:修仙宗门弟子)",
    "appearance": "外貌描述(字符串,100-150字)",
    "personality": ["特点1", "特点2", "特点3"],
    "background": "背景故事(字符串,200-300字)",
    "abilities": "能力描述(字符串,不是对象)",
    "role_type": "{role_type}"
}}
```

### 字段类型强制要求:
- **name**: 字符串,不能为空
- **gender**: 字符串,只能是 "男"、"女" 或 "其他"
- **age**: 整数,表示年龄
- **identity**: 字符串,角色的身份/职业
- **appearance**: 字符串,外貌描述
- **personality**: **字符串数组**,每个元素是一个性格关键词(如 ["冷静", "果断", "善良"]),**不要返回嵌套对象**
- **background**: 字符串,背景故事
- **abilities**: **字符串**,能力描述(如 "剑道九重天,擅长水系法术"),**不要返回对象或数组**
- **role_type**: 字符串,角色定位

只输出 JSON,不要输出其他内容。"""


def get_outline_prompt(
    category: str,
    keywords: str,
    chapter_count: int = 50,
    target_words: int = 100,
    target_audience: str = "大众读者",
    protagonist: str = "无",
    background: str = "无",
    special_requirements: str = "无",
) -> tuple[str, str]:
    """生成大纲提示词对(系统提示词, 用户提示词)"""
    user_prompt = OUTLINE_USER_TEMPLATE.format(
        category=category,
        keywords=keywords,
        chapter_count=chapter_count,
        target_words=target_words,
        target_audience=target_audience,
        protagonist=protagonist,
        background=background,
        special_requirements=special_requirements,
    )
    return OUTLINE_SYSTEM_PROMPT, user_prompt


def get_continue_prompt(
    category: str,
    style: str,
    characters_json: str,
    world_settings: str,
    previous_summary: str,
    chapter_outline: str,
    previous_chapter_title: str = "无",
    word_count: int = 2000,
    special_requirements: str = "无",
    novel_title: str = "",
    story_summary: str = "",
) -> tuple[str, str]:
    """生成续写提示词对(系统提示词, 用户提示词)

    注意: novel_title 和 story_summary 参数已弃用，为了向后兼容而保留
    """
    # 计算字数范围
    min_words = int(word_count * 0.9)
    max_words = int(word_count * 1.1)

    user_prompt = CONTINUE_USER_TEMPLATE.format(
        category=category,
        style=style,
        characters_json=characters_json,
        world_settings=world_settings,
        previous_chapter_title=previous_chapter_title or "无",
        previous_summary=previous_summary,
        chapter_outline=chapter_outline,
        word_count=word_count,
        min_words=min_words,
        max_words=max_words,
        special_requirements=special_requirements,
    )
    return CONTINUE_SYSTEM_PROMPT, user_prompt


def get_expand_prompt(
    text: str,
    style: str = "详细描写",
    word_count: int = 500,
    chapter_title: str = "未命名章节",
    context_before: str = "",
    context_after: str = "",
    position_hint: str = "未知",
) -> tuple[str, str]:
    """生成扩写提示词对(系统提示词, 用户提示词)"""
    # 计算原文字数
    original_word_count = len(text)

    # 计算字数范围（扩写通常是原文的2-5倍）
    # 目标字数作为中间值，允许±20%的误差
    min_words = int(word_count * 0.8)
    max_words = int(word_count * 1.2)

    user_prompt = EXPAND_USER_TEMPLATE.format(
        text=text,
        original_word_count=original_word_count,
        style=style,
        word_count=word_count,
        min_words=min_words,
        max_words=max_words,
        chapter_title=chapter_title or "未命名章节",
        context_before=context_before or "（无）",
        context_after=context_after or "（无）",
        position_hint=position_hint or "未知",
    )
    return EXPAND_SYSTEM_PROMPT, user_prompt


def get_character_prompt(
    category: str,
    existing_characters: str,
    role_type: str,
    design_direction: str = "无特殊要求",
    character_name: str = "由AI生成",
) -> tuple[str, str]:
    """生成角色提示词对(系统提示词, 用户提示词)"""
    user_prompt = CHARACTER_USER_TEMPLATE.format(
        category=category,
        existing_characters=existing_characters,
        role_type=role_type,
        design_direction=design_direction,
        character_name=character_name,
    )
    return CHARACTER_SYSTEM_PROMPT, user_prompt


# ========== 格式优化提示词 ==========

FORMAT_OPTIMIZE_SYSTEM_PROMPT = """你是一位专业的文字编辑，擅长优化网络小说的格式和表达。你的职责是：

**核心原则**：
1. **保持情节不变**：不改变任何剧情、人物行为、对话内容
2. **轻度润色**：仅修正语病、优化表达、统一格式
3. **尊重原文**：保持作者的写作风格和语气

**优化范围**：
- 修正错别字、标点符号错误
- 优化病句、重复表达
-统一段落格式（对话、描写、心理活动）
- 改善语句流畅度
- 调整段落长度（过长段落适当拆分）

**禁止行为**：
- ❌ 不要改变情节走向
- ❌ 不要增删角色对话的实质内容
- ❌ 不要改变人物性格表现
- ❌ 不要添加原文没有的情节
- ❌ 不要改变叙事视角"""

FORMAT_OPTIMIZE_USER_TEMPLATE = """请优化以下章节的格式和表达。

## 章节信息
- **章节标题**：{chapter_title}
- **章节序号**：第 {chapter_order} 章
- **小说类型**：{category}

## 原文内容
{content}

## 优化要求
{optimization_focus}

## 输出要求
直接输出优化后的章节内容，使用 Markdown 格式。保持原有的段落结构，不要添加任何说明性文字。"""


def get_format_optimize_prompt(
    content: str,
    chapter_title: str = "未命名章节",
    chapter_order: int = 1,
    category: str = "其他",
    optimization_focus: str = "全面优化",
) -> tuple[str, str]:
    """生成格式优化提示词对(系统提示词, 用户提示词)"""
    user_prompt = FORMAT_OPTIMIZE_USER_TEMPLATE.format(
        content=content,
        chapter_title=chapter_title,
        chapter_order=chapter_order,
        category=category,
        optimization_focus=optimization_focus,
    )
    return FORMAT_OPTIMIZE_SYSTEM_PROMPT, user_prompt


# ========== 文本重写提示词 ==========

REWRITE_SYSTEM_PROMPT = """你是一位专业的小说重写师。你的任务是"重写"（Rewrite），不是"总结"（Summarize）。

## 什么是"重写"？
**重写 = 用不同的表达方式，完整地重新写一遍原文的所有内容**

### 错误示例（这是总结，不是重写）
**原文（72字）**：
"李明走进房间，看到桌上放着一封信。他拿起信封，小心翼翼地拆开，里面是一张泛黄的纸条。纸条上写着：'明天午夜，老地方见。'他皱起眉头，陷入了沉思。这笔迹，他似曾相识。"

**错误输出（9字）**：
"李明收到神秘约见信。"

**为什么错误**：这只是总结了核心信息，丢失了所有细节、动作、心理描写。字数从72字缩减到9字，这是总结，不是重写。

### 正确示例（这才是重写）
**原文（72字）**：
"李明走进房间，看到桌上放着一封信。他拿起信封，小心翼翼地拆开，里面是一张泛黄的纸条。纸条上写着：'明天午夜，老地方见。'他皱起眉头，陷入了沉思。这笔迹，他似曾相识。"

**正确输出（保持原意风格，68字）**：
"李明推门而入，目光落在桌面上的信封。他伸手取过，动作轻柔地撕开封口，抽出一张发黄的便笺。便笺上的字迹清晰：'明日子夜，旧址相会。'他眉头微蹙，思绪飘远。那字体，仿佛在哪里见过。"

**为什么正确**：
1. 字数相近（72字 → 68字，在90%-110%范围内）
2. 保留了所有情节：进门、看信、拆信、读内容、思考、回忆
3. 保留了所有细节：信封、纸条、笔迹、表情
4. 只是换了表达方式：走进→推门而入，拿起→取过，小心翼翼→轻柔

## 核心规则
1. **重写 ≠ 总结**：保留原文的所有内容（情节、对话、描写）
2. **只改表达方式**：换词、换句式，但不删减内容
3. **字数必须达标**：输出字数必须在目标范围内

## 重写方法
对原文的每一句话，用不同的表达方式重新写一遍：
- "走进" → "推门而入"、"踏入"、"迈步进入"
- "看到" → "目光落在"、"映入眼帘"、"注意到"
- "说" → "开口道"、"出声道"、"轻声说"

## 绝对禁止
❌ 禁止总结：不要只输出一句话概括
❌ 禁止删减：不要省略任何情节或细节
❌ 禁止字数不足：输出字数低于目标下限视为任务失败"""

REWRITE_USER_TEMPLATE = """请完整重写以下文本。

## 任务说明
你的任务是"重写"，不是"总结"。重写意味着：
1. 保留原文的所有内容（每一个情节、对话、描写）
2. 只改变表达方式（换词、换句式、换视角）
3. 输出字数必须在目标范围内

## 小说上下文
- 类型：{category}
- 简介：{novel_context}
- 角色信息：
{characters_info}
- 特殊要求：{special_requirements}

## 原文（{original_word_count}字）
{original_text}

## 重写风格：{rewrite_style}
{style_details}

## 字数要求（必须遵守）
- 最少 {min_words} 字
- 最多 {max_words} 字
- 低于 {min_words} 字 = 任务失败

## 重写步骤（请严格按照以下步骤执行）

**步骤1：分析原文结构**
- 识别原文中的所有情节点和动作
- 识别原文中的所有细节（人物、环境、道具、表情）
- 识别原文中的所有对话

**步骤2：逐句重写**
- 对原文的每一句话，用不同的表达方式重新写一遍
- 不要删减任何句子，不要合并多个情节
- 保持原文的叙事顺序

**步骤3：检查字数**
- 重写完成后，检查字数是否在 {min_words}-{max_words} 字之间
- 如果字数不足，补充细节描写（但不改变情节）
- 如果字数过多，精简表达（但不删减情节）

**步骤4：输出最终结果**
- 直接输出重写后的完整文本
- 不要添加任何说明性文字（如"以下是重写后的内容"）
- 不要输出步骤分析过程

## 最后提醒
- 你的输出必须在 {min_words} 到 {max_words} 字之间
- 如果输出少于 {min_words} 字，将被视为任务失败
- 重写 ≠ 总结，你必须保留原文的所有内容
- 现在开始重写，直接输出重写后的文本："""


def get_rewrite_prompt(
    original_text: str,
    rewrite_style: str,
    category: str,
    novel_context: str,  # 小说简介和设定
    characters_info: str = "暂无角色信息",
    special_requirements: str = "无",
) -> tuple[str, str]:
    """
    生成重写提示词对(系统提示词, 用户提示词)

    根据重写风格的不同���给出不同的指导：
    - 保持原意：保持情节和表达，只优化语言
    - 增强感染力：增加情感渲染和细节描写
    - 简化表达：精简语言，突出重点
    - 改变视角：从第一人称改第三人称（或反之）
    - 增加对话：将叙述改为对话形式
    - 增加描写：补充环境、心理、动作描写
    """
    # 计算原文字数
    original_word_count = len(original_text)

    # 设置绝对最小字数（避免过度简化导致输出过短）
    # 无论什么风格，输出至少要有原文的50%或30字（取较大值）
    absolute_min_words = max(30, int(original_word_count * 0.5))

    # 根据重写风格计算目标字数范围
    target_word_count_ranges = {
        "保持原意": (int(original_word_count * 0.9), int(original_word_count * 1.1)),
        "增强感染力": (int(original_word_count * 1.2), int(original_word_count * 1.5)),
        # 简化表达：使用绝对最小字数作为下限，避免过度简化
        "简化表达": (max(absolute_min_words, int(original_word_count * 0.7)), int(original_word_count * 0.9)),
        "改变视角": (int(original_word_count * 0.9), int(original_word_count * 1.1)),
        "增加对话": (int(original_word_count * 1.3), int(original_word_count * 1.6)),
        "增加描写": (int(original_word_count * 1.4), int(original_word_count * 1.8)),
    }

    min_words, max_words = target_word_count_ranges.get(rewrite_style, (original_word_count, original_word_count))
    target_word_count_range = f"{min_words}-{max_words}字"

    # 根据重写风格生成详细指导
    style_details_map = {
        "保持原意": """
- 保持情节、人物行为、对话内容完全一致
- 仅优化语病、重复表达、不通顺的地方
- 保持原有的叙事风格和语气
- 字数变化控制在±10%以内""",
        "增强感染力": """
- 增加情感渲染词汇（但不夸张）
- 补充细节描写（神态、动作、环境细节）
- 深化人物内心活动
- 强化氛围营造
- 可增加20%-50%字数""",
        "简化表达": """
- 删除冗余修饰和重复内容
- 用简洁语言表达核心意思
- 保留关键情节和对话
- 突出重点信息
- 字数减少10%-30%""",
        "改变视角": """
- 如果原文是第一人称，改为第三人称（或反之）
- 或者改变视角角色（如从主角视角改为配角视角）
- 调整相应的心理描写和情感表达方式
- 保持情节完全一致""",
        "增加对话": """
- 将叙述性内容转换为人物对话
- 增加人物互动和语言交流
- 对话要符合人物性格
- 可以加入适当的动作和神态描写
- 字数可能增加30%-60%""",
        "增加描写": """
- 补充环境描写（场景、氛围、光线、声音等）
- 补充心理描写（人物内心活动、情感变化）
- 补充动作描写（细化人物动作过程）
- 增强画面感和代入感
- 字数可能增加40%-80%""",
    }

    style_details = style_details_map.get(rewrite_style, "按照指定风格重写")

    user_prompt = REWRITE_USER_TEMPLATE.format(
        category=category,
        novel_context=novel_context,
        characters_info=characters_info,
        special_requirements=special_requirements,
        original_text=original_text,
        original_word_count=original_word_count,
        min_words=min_words,
        max_words=max_words,
        rewrite_style=rewrite_style,
        style_details=style_details,
    )
    return REWRITE_SYSTEM_PROMPT, user_prompt


# ========== 冒险游戏：开局生成提示词 ==========

OPENING_SYSTEM_PROMPT = """你是一个专业的互动小说作家，擅长创作引人入胜的开局。你的输出必须是严格的JSON格式,不允许任何开场白、解释性文字或额外内容。

**核心原则**:
1. 直接输出JSON,不要任何前缀或后缀文字
2. 开局要有悬念和冲突，但不要过于复杂
3. 选项要有意义的差异，每个选项都能开启不同的故事走向
4. 保持叙事节奏：快节奏开场，立即进入故事

**禁止行为**:
- ❌ 不要输出"你好"、"我理解"等开场白
- ❌ 不要输出"以下是..."、"根据要求..."等过渡语
- ❌ 不要输出任何JSON之外的内容
- ❌ 不要设计"假选择"（所有选项都要有实质差异）

**写作格式要求（必须严格遵守）**：
1. **必须使用段落分隔**: 每2-4句话形成一个段落，段落之间用两个换行符（\\n\\n）分隔
2. **段落结构**:
   - 开局描写：2-3段（环境、冲突、主角状态）
   - 核心剧情：3-5段（事件展开）
   - 结尾铺垫：1-2段（悬念）
3. **禁止**: 整段文字没有换行，这会严重影响阅读体验"""

OPENING_USER_TEMPLATE = """请为互动小说游戏创作开局。

## 基本设定
- **类型**: {category}
- **关键词**: {keywords}
- **主角姓名**: {protagonist_name}
- **主角性别**: {protagonist_gender}
- **主角性格**: {protagonist_personality}

## 任务要求

### 1. 故事背景（200-300字）
简要介绍世界观、时代背景、核心设定。要点到即止，不要长篇大论。

### 2. 初始场景（500-800字）
描写主角当前所处的具体场景：
- 环境描写（时间、地点、氛围）
- 主角状态（外观、心境、当前处境）
- 冲突引入（即将面临的问题/选择）
- 以一个需要决策的关键时刻结尾

### 3. 开局选项（3-4个）
为每个选项设计：
- **text**: 选项文本（20-30字，动词开头）
- **inner_monologue**: 主角内心想法（30-50字，第一人称）
- **success_rate**: 基础成功率（0.3-0.8之间的浮点数）
- **difficulty**: 难度等级（"简单"/"普通"/"困难"/"极限"）
- **potential_reward**: 潜在收益描述（20-30字）
- **potential_risk**: 潜在风险描述（20-30字）

**选项设计原则**：
- 至少包含1个低风险选项（success_rate >= 0.7）
- 至少包含1个高风险高回报选项（success_rate <= 0.5）
- 每个选项应开启不同的故事走向
- 避免"正确答案"，每个选项都有利弊

## ⚠️ JSON 输出格式(严格遵循,不允许任何变体)

```json
{{
    "background": "故事背景（200-300字）",
    "initial_scene": "初始场景（500-800字）",
    "choices": [
        {{
            "index": 0,
            "text": "选项文本（20-30字）",
            "inner_monologue": "内心独白（30-50字）",
            "success_rate": 0.7,
            "difficulty": "简单",
            "potential_reward": "潜在收益（20-30字）",
            "potential_risk": "潜在风险（20-30字）",
            "state_requirements": null
        }},
        {{
            "index": 1,
            "text": "另一个选项",
            "inner_monologue": "另一个内心独白",
            "success_rate": 0.45,
            "difficulty": "困难",
            "potential_reward": "高回报描述",
            "potential_risk": "高风险描述",
            "state_requirements": null
        }}
    ]
}}
```

### 字段类型强制要求:
- **background**: 字符串，200-300字
- **initial_scene**: 字符串，500-800字
- **choices**: 数组，包含3-4个选项对象
- **index**: 整数，从0开始
- **text**: 字符串，20-30字
- **inner_monologue**: 字符串，30-50字
- **success_rate**: 浮点数，0.0-1.0之间
- **difficulty**: 字符串，只能是"简单"、"普通"、"困难"、"极限"之一
- **potential_reward**: 字符串，20-30字
- **potential_risk**: 字符串，20-30字
- **state_requirements**: null（开局不设前置条件）

**重要**: 直接输出JSON对象,不要任何其他内容!"""


def get_opening_prompt(
    category: str,
    keywords: list[str],
    protagonist_name: str,
    protagonist_gender: str,
    protagonist_personality: str = "无特殊设定",
) -> tuple[str, str]:
    """生成开局提示词对(系统提示词, 用户提示词)"""
    keywords_str = "、".join(keywords) if keywords else "无特殊关键词"

    user_prompt = OPENING_USER_TEMPLATE.format(
        category=category,
        keywords=keywords_str,
        protagonist_name=protagonist_name,
        protagonist_gender=protagonist_gender,
        protagonist_personality=protagonist_personality,
    )
    return OPENING_SYSTEM_PROMPT, user_prompt


# ========== 冒险游戏：故事节点生成提示词 ==========

STORY_NODE_SYSTEM_PROMPT = """你是一个互动小说的叙事者，负责根据玩家的选择和判定结果生成后续剧情。你的输出必须是严格的JSON格式,不允许任何开场白、解释性文字或额外内容。

**核心原则**:
1. **连贯性**：与前文保持一致，角色性格不要突变
2. **文学性**：用生动的描写和对话，不要流水账
3. **节奏感**：每章800-1500字，有起承转合
4. **选项质量**：结尾提供2-4个选项，要有意义的差异
5. **格式规范**：内容必须有清晰的段落结构，每个段落用两个换行符（\\n\\n）分隔，不要整篇文字挤在一起

**判定结果处理**:
- **成功**：奖励合理，推进故事，但不要过于顺利（保持挑战性）
- **失败**：惩罚合理，增加困难，但不要直接Game Over（除非生命值归零）
- **大成功（1-5）**：额外奖励，剧情惊喜转折
- **大失败（96-100）**：严重后果，但给予挽回机会

**禁止行为**:
- ❌ 不要输出开场白或解释性文字
- ❌ 不要改变已确立的人物性格
- ❌ 不要设计"假选择"或"送死选项"
- ❌ 不要让主角轻易死亡（保持游戏性）"""

STORY_NODE_USER_TEMPLATE = """请生成故事的下一章节。

## 基本信息
- **类型**: {category}
- **关键词**: {keywords}
- **主角**: {protagonist_name}（{protagonist_gender}）
- **性格**: {protagonist_personality}

## 前文概要
{story_summary}

## 玩家选择详情
- **选择行动**: {choice_text}
- **内心独白**: {choice_inner_monologue}
- **难度等级**: {choice_difficulty}（基础成功率 {success_rate_percent}%）
- **期望收益**: {choice_potential_reward}
- **潜在风险**: {choice_potential_risk}

## 判定结果
- **投骰值**: {roll_value} / 目标 {target}
- **结果**: {result_text}
{critical_message}

## 当前玩家状态
```json
{player_state}
```

## 任务要求

### 1. 章节内容（800-1500字）
根据判定结果生成剧情：

**如果成功**：
- 描写主角如何成功完成行动
- 给予合理奖励（物品/能力/情报/关系改善）
- 推进主线剧情，但保留挑战性
- 可以引入新的问题或更大的目标

**如果失败**：
- 描写主角如何失败及其后果
- 给予合理惩罚（生命值损失/失去机会/关系恶化）
- 制造困境，但不要绝境（给予挽回机会）
- 可以开启支线或意外剧情

**如果大成功/大失败**：
- 大成功：意外惊喜，额外收获，剧情加速
- 大失败：严重危机，连锁反应，但不是死局

**写作硬性要求（必须严格遵守）**：
1. **开头200字必须详细描写玩家的选择行动"{choice_text}"**
   - 描写具体的动作过程和场景细节
   - 体现内心想法："{choice_inner_monologue}"
   - 根据难度"{choice_difficulty}"渲染紧张氛围
2. **中段根据判定结果展开剧情**：
   - 成功→描写如何克服"{choice_potential_risk}"，获得"{choice_potential_reward}"
   - 失败→描写"{choice_potential_risk}"如何发生，失去机会
3. **结尾引出新的矛盾或悬念**
4. **段落格式（严格要求）**：
   - 开头200字（1-2段）：描写选择行动"{choice_text}"
   - 中段400-800字（2-4段）：展开剧情
   - 结尾200-300字（1-2段）：悬念铺垫
   - ⚠️ 段落之间必须用两个换行符（\\n\\n）分隔
- 对话要符合人物性格，不要假大空
- 描写要有画面感，不要抽象概括

### 2. 状态变化（state_changes）
根据剧情合理调整玩家状态：

**数值调整**：
- `"生命值": -20` （受伤）
- `"灵力": -30` （消耗能量）
- `"魅力": +5` （玄幻类型为灵力，言情类型为魅力）

**物品获得/失去**：
- `"物品+": [{{"name": "疗伤丹", "count": 2, "description": "恢复30生命值"}}]`
- `"物品-": ["破损的剑"]` （失去物品）

**故事事件记录**：
- `"故事事件+": ["击败妖兽获得灵药", "与剑宗长老结识"]`

**关系网更新**：
- `"关系网.师父.favor": +10` （好感度增加）
- `"关系网+": [{{"role": "反派", "name": "黑风寨三当家", "favor": -50, "description": "对你恨之入骨"}}]`

**重要原则**：
- 成功：奖励适度，不要一次性给太多
- 失败：惩罚合理，生命值减少不超过30%（除非极端情况）
- 生命值不能低于0（会触发Game Over）
- 物品描述要清楚用途

### 3. 下一轮选项（2-4个）
为章节结尾设计选项：

**选项设计原则**：
- 紧扣当前剧情发展
- 每个选项开启不同走向
- 至少1个相对安全的选项
- 难度分布合理（简单/普通/困难）

**选项字段**：
- **index**: 从0开始的序号
- **text**: 动词开头，20-30字
- **inner_monologue**: 第一人称，30-50字
- **success_rate**: 0.3-0.8之间
- **difficulty**: "简单"/"普通"/"困难"/"极限"
- **potential_reward**: 20-30字
- **potential_risk**: 20-30字
- **state_requirements**: 前置条件（如 `{{"生命值": ">= 80"}}`）或 `null`

## ⚠️ JSON 输出格式(严格遵循)

```json
{{
    "content": "第一段内容，描写环境和主角状态。这是第一段的第二句话。\\n\\n第二段内容，事件展开。展开更多细节。\\n\\n第三段内容，结尾悬念。留下伏笔。",
    "state_changes": {{
        "生命值": -20,
        "灵力": -30,
        "物品+": [
            {{
                "name": "物品名称",
                "count": 1,
                "description": "物品描述"
            }}
        ],
        "故事事件+": ["事件描述1", "事件描述2"]
    }},
    "choices": [
        {{
            "index": 0,
            "text": "选项文本",
            "inner_monologue": "内心独白",
            "success_rate": 0.7,
            "difficulty": "简单",
            "potential_reward": "潜在收益",
            "potential_risk": "潜在风险",
            "state_requirements": null
        }}
    ]
}}
```

### 字段类型强制要求:
- **content**: 字符串，800-1500字，Markdown格式
- **state_changes**: 对象，包含状态变化
  - 数值字段：整数或浮点数
  - `物品+`: 对象数组，每个对象包含 name/count/description
  - `故事事件+`: 字符串数组
- **choices**: 数组，2-4个选项对象
- 选项对象字段同开局生成

**重要**: 直接输出JSON对象,不要任何其他内容!"""


def get_story_node_prompt(
    category: str,
    keywords: list[str],
    protagonist_name: str,
    protagonist_gender: str,
    protagonist_personality: str,
    story_summary: str,
    choice_text: str,
    choice_inner_monologue: str,
    choice_potential_reward: str,
    choice_potential_risk: str,
    choice_difficulty: str,
    success: bool,
    roll_value: int,
    target: int,
    success_rate: float,
    player_state: dict,
) -> tuple[str, str]:
    """生成故事节点提示词对(系统提示词, 用户提示词)"""
    import json

    keywords_str = "、".join(keywords) if keywords else "无特殊关键词"
    player_state_str = json.dumps(player_state, ensure_ascii=False, indent=2)

    # 判断是否大成功/大失败
    critical_message = ""
    if roll_value <= 5:
        critical_message = "\n- **特殊判定**: 🎉 大成功！请给予额外奖励和惊喜转折"
    elif roll_value >= 96:
        critical_message = "\n- **特殊判定**: 💀 大失败！请设计严重后果，但保留挽回机会"

    # 预计算模板需要的值
    success_rate_percent = int(success_rate * 100)
    result_text = "✅ 成功" if success else "❌ 失败"

    user_prompt = STORY_NODE_USER_TEMPLATE.format(
        category=category,
        keywords=keywords_str,
        protagonist_name=protagonist_name,
        protagonist_gender=protagonist_gender,
        protagonist_personality=protagonist_personality,
        story_summary=story_summary,
        choice_text=choice_text,
        choice_inner_monologue=choice_inner_monologue,
        choice_potential_reward=choice_potential_reward,
        choice_potential_risk=choice_potential_risk,
        choice_difficulty=choice_difficulty,
        roll_value=roll_value,
        target=target,
        success_rate_percent=success_rate_percent,
        result_text=result_text,
        critical_message=critical_message,
        player_state=player_state_str,
    )
    return STORY_NODE_SYSTEM_PROMPT, user_prompt


# ========== 冒险结局生成提示词 ==========

ENDING_SYSTEM_PROMPT = """你是专业的互动小说作家，擅长创作令人满意的结局。

**核心原则**:
1. 结局要与前文呼应，解决主要矛盾
2. 角色命运要有说服力
3. 留有余韵，不要过于仓促
4. 字数控制在1000-1500字

**禁止行为**:
- ❌ 不要突然改变已确立的人物��格
- ❌ 不要引入新的重大冲突（结局应该是收束）
- ❌ 不要过度煽情或假大空"""

ENDING_USER_TEMPLATE = """请为这段冒险故事创作结局。

## 基本信息
- **类型**: {category}
- **关键词**: {keywords}
- **主角**: {protagonist_name}（{protagonist_gender}）

## 故事摘要（最近节点）
{story_summary}

## 当前玩家状态
```json
{player_state}
```

## 结局类型
{ending_type_description}

## 任务要求

### 1. 结局正文（1000-1500字）
- 开头：从当前状态出发
- 中段：关键矛盾的解决
- 结尾：角色的最终归宿

### 2. 风格要求
{ending_style_guide}

## 输出要求
直接输出结局章节内容，使用 Markdown 格式。不要包含任何开场白或说明文字。"""


def get_ending_prompt(
    category: str,
    keywords: list[str],
    protagonist_name: str,
    protagonist_gender: str,
    story_summary: str,
    player_state: dict,
    ending_type: str,
) -> tuple[str, str]:
    """
    生成结局提示词对（系统提示词, 用户提示词）

    参数:
        category: 小说类型
        keywords: 关键词列表
        protagonist_name: 主角名字
        protagonist_gender: 主角性别
        story_summary: 故事摘要（最近节点内容）
        player_state: 玩家当前状态
        ending_type: 结局类型（"happy" 或 "tragic"）

    返回:
        (系统提示词, 用户提示词) 元组
    """
    import json

    # 根据结局类型选择描述和风格指南
    if ending_type == "happy":
        ending_type_description = "**完美结局**：主角克服困难，达成目标，获得美好结局"
        ending_style_guide = """
- 正面、积极的基调
- 主角获得成长和收获
- 重要角色获得应有的归宿
- 留有希望和美好
- 适当的升华（但不要说教）"""
    else:  # tragic
        ending_type_description = "**悲剧结局**：主角面对命运的考验，接受悲剧的洗礼"
        ending_style_guide = """
- 沉重、深刻的基调
- 主角虽失败但有所领悟
- 展现命运的无常或选择的代价
- 悲而不惨，有哲理深度
- 适当的反思（但不要说教）"""

    keywords_str = "、".join(keywords) if keywords else "无"
    player_state_str = json.dumps(player_state, ensure_ascii=False, indent=2)

    user_prompt = ENDING_USER_TEMPLATE.format(
        category=category,
        keywords=keywords_str,
        protagonist_name=protagonist_name,
        protagonist_gender=protagonist_gender,
        story_summary=story_summary,
        player_state=player_state_str,
        ending_type_description=ending_type_description,
        ending_style_guide=ending_style_guide,
    )

    return ENDING_SYSTEM_PROMPT, user_prompt
