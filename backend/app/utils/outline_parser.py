"""大纲解析工具 - 从大纲中提取角色等信息"""
import re
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


def extract_characters_from_outline(outline: str) -> List[Dict[str, str]]:
    """
    从Markdown格式的大纲中提取角色信息

    解析逻辑：
    1. 查找 "### 1. 主要人物" 或类似的章节
    2. 提取每个角色的姓名、身份、性格、作用

    参数:
        outline: Markdown格式的大纲文本

    返回格式:
    [
        {"name": "林凡", "role_type": "主角", "description": "身份: 修仙者, 性格: 冷静果断"},
        {"name": "云梦瑶", "role_type": "女主角", "description": "..."}
    ]
    """
    if not outline:
        return []

    characters = []

    # 正则匹配 "### X. 主要人物" 或 "## 主要人物" 部分
    character_section_match = re.search(
        r'###?\s*\d*\.?\s*主要人物.*?\n(.*?)(?=###?\s*\d|$)',
        outline,
        re.DOTALL | re.IGNORECASE
    )

    if not character_section_match:
        logger.info("大纲中未找到'主要人物'章节")
        return []

    character_text = character_section_match.group(1)

    # 按行解析角色信息
    lines = character_text.split('\n')
    current_char: Dict[str, str] = {}

    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # 匹配 "姓名：xxx" 或 "- 姓名：xxx" 或 "1. 姓名：xxx" 格式
        # 更宽松的匹配模式
        name_match = re.match(
            r'^[\d\-\*•·]?\s*[【\[]?([^：:【\]]{1,20})[】\]]?[：:]\s*(.+)',
            line
        )
        if name_match:
            # 保存之前的角色
            if current_char and 'name' in current_char:
                characters.append(current_char)

            # 开始新角色
            raw_name = name_match.group(1).strip()
            description = name_match.group(2).strip()

            # 清理名字，提取角色类型提示
            clean_name, role_hint = _clean_character_name(raw_name)

            # 过滤掉不是角色名的行（如"身份"、"性格"等）
            skip_keywords = ['身份', '性格', '作用', '背景', '能力', '特点', '关系']
            if any(kw in clean_name for kw in skip_keywords):
                continue

            # 确定角色类型：优先使用括号提示，否则从描述推断
            role_type = _normalize_role_type(role_hint, description)

            current_char = {
                "name": clean_name,
                "role_type": role_type,
                "description": description[:500]  # 限制长度
            }
        elif current_char and 'name' in current_char:
            # 追加描述（如果当前有角色）
            if current_char.get("description"):
                current_char["description"] += " " + line
            else:
                current_char["description"] = line

    # 保存最后一个角色
    if current_char and 'name' in current_char:
        characters.append(current_char)

    logger.info(f"从大纲中提取了 {len(characters)} 个角色: {[c['name'] for c in characters]}")
    return characters


def _clean_character_name(raw_name: str) -> tuple[str, str | None]:
    """
    清理原始角色名，提取纯净名字和角色类型

    处理多种AI生成的格式：
    - "**苏清 (女主)**" -> ("苏清", "女主")
    - "萧绝（男主）" -> ("萧绝", "男主")
    - "【林凡】" -> ("林凡", None)
    - "苏小宝 (萌宝)" -> ("苏小宝", "萌宝")

    参数:
        raw_name: 原始角色名字符串

    返回:
        (清理后的名字, 角色类型提示) 元组
    """
    # 移除 Markdown 粗体符号 **
    name = raw_name.strip()
    name = re.sub(r'^\*+|\*+$', '', name).strip()

    # 提取括号中的角色类型 (女主)、（主角）、[反派]
    role_match = re.search(r'[\(（\[]([^)）\]]+)[\)）\]]$', name)
    role_type = None
    if role_match:
        role_type = role_match.group(1).strip()
        name = name[:role_match.start()].strip()

    # 移除首尾的【】或其他装饰符号
    name = re.sub(r'^[【\[]+|[】\]]+$', '', name).strip()

    return name, role_type


def _normalize_role_type(role_hint: str | None, description: str) -> str:
    """
    标准化角色类型

    优先使用名字中的括号提示，其次从描述推断

    参数:
        role_hint: 从名字括号中提取的角色类型提示（如"女主"、"反派"）
        description: 角色描述文本

    返回:
        标准化的角色类型（主角、女主、反派、配角、导师）
    """
    if role_hint:
        hint_lower = role_hint.lower()
        # 主角系列
        if any(kw in hint_lower for kw in ["主角", "男主", "主人公"]):
            return "主角"
        # 女主系列
        if any(kw in hint_lower for kw in ["女主", "女一"]):
            return "女主"
        # 反派系列
        if any(kw in hint_lower for kw in ["反派", "boss", "敌人"]):
            return "反派"
        # 萌宝/孩子
        if any(kw in hint_lower for kw in ["萌宝", "孩子", "宝宝"]):
            return "配角"
        # 男二/女二
        if any(kw in hint_lower for kw in ["男二", "女二", "二号"]):
            return "配角"
        # 导师系列
        if any(kw in hint_lower for kw in ["导师", "师父", "师傅"]):
            return "导师"
        # 其他都是配角
        return "配角"

    # 从描述中推断（保留原有逻辑作为备用）
    return _infer_role_type(description)


def _infer_role_type(description: str) -> str:
    """
    从描述中推断角色类型

    参数:
        description: 角色描述文本

    返回:
        角色类型字符串（主角、女主角、反派、配角等）
    """
    description_lower = description.lower()

    # 检查主角关键词
    if any(kw in description for kw in ["主角", "主人公", "男主"]):
        return "主角"

    # 检查女主角关键词
    if any(kw in description for kw in ["女主", "女主角", "女一号"]):
        return "女主角"

    # 检查反派关键词
    if any(kw in description for kw in ["反派", "敌人", "对手", "boss", "BOSS", "大反派"]):
        return "反派"

    # 检查导师关键词
    if any(kw in description for kw in ["导师", "师父", "师傅", "老师", "前辈"]):
        return "导师"

    # 默认为配角
    return "配角"
