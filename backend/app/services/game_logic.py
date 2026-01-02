"""
游戏核心逻辑 - 判定系统

包含：
1. D100 投骰判定系统
2. 状态管理工具函数
3. 选择验证函数
"""

import random
from typing import Tuple, Dict, Any, Optional


def roll_dice(
    success_rate: float,
    difficulty: str = "普通",
    player_state: Optional[Dict[str, Any]] = None,
    relevant_attribute: Optional[str] = None
) -> Tuple[int, bool]:
    """
    D100 投骰判定系统（支持属性加成）

    参数：
        success_rate: 基础成功率（0.0-1.0）
        difficulty: 难度等级（"简单", "普通", "困难", "极限"）
        player_state: 玩家状态字典（可选）
        relevant_attribute: 相关属性名称（可选，如"根骨"、"智力"）

    返回：
        (roll_value, success): 投骰值（1-100）和是否成功

    判定逻辑：
        1. 计算属性加成（如果提供）
        2. 根据难度调整成功率
        3. 投D100（1-100随机数）
        4. 特殊判定：
           - 1-5：大成功（Critical Success），无论目标多低
           - 96-100：大失败（Critical Failure），无论目标多高
        5. 普通判定：roll_value <= target 则成功

    属性加成规则：
        - 基准值：50（无加成）
        - 每点属性提供0.5%加成
        - 例如：根骨70 → +10%成功率，根骨30 → -10%成功率

    示例：
        >>> roll_dice(0.7, "简单")
        (45, True)  # 投出45，目标84（0.7 * 1.2 * 100），成功

        >>> roll_dice(0.5, "普通", {"关键属性": {"根骨": 70}}, "根骨")
        (55, True)  # 基础50% + 属性加成10% = 60%，投出55，成功
    """
    # 难度调整系数
    difficulty_multipliers = {
        "简单": 1.2,    # +20% 成功率
        "普通": 1.0,    # 无调整
        "困难": 0.8,    # -20% 成功率
        "极限": 0.6     # -40% 成功率
    }

    # 获取难度系数（默认为普通）
    multiplier = difficulty_multipliers.get(difficulty, 1.0)

    # 计算属性加成
    attribute_bonus = 0.0
    if player_state and relevant_attribute:
        key_attributes = player_state.get("关键属性", {})
        if isinstance(key_attributes, dict) and relevant_attribute in key_attributes:
            attribute_value = key_attributes[relevant_attribute]
            # 每点属性提供0.5%加成，基准值50
            attribute_bonus = (attribute_value - 50) * 0.005

    # 计算调整后的成功率
    # 先加属性加成，再乘以难度系数，最后限制在5%-95%之间
    adjusted_rate = success_rate + attribute_bonus
    adjusted_rate = adjusted_rate * multiplier
    adjusted_rate = max(0.05, min(adjusted_rate, 0.95))

    # 投D100
    roll = random.randint(1, 100)
    target = int(adjusted_rate * 100)

    # 大成功/大失败判定
    if roll <= 5:
        return roll, True  # 大成功（无论目标多低）
    elif roll >= 96:
        return roll, False  # 大失败（无论目标多高）
    else:
        return roll, roll <= target


def check_state_requirements(
    player_state: Dict[str, Any],
    requirements: Optional[Dict[str, str]]
) -> Tuple[bool, Optional[str]]:
    """
    检查玩家状态是否满足选项的前置条件

    参数：
        player_state: 玩家当前状态
        requirements: 前置条件字典，格式如 {"生命值": ">= 80", "物品": "包含 疗伤丹"}

    返回：
        (满足条件, 失败原因): (True, None) 或 (False, "生命值不足80")

    示例：
        >>> state = {"生命值": 100, "灵力": 50}
        >>> check_state_requirements(state, {"生命值": ">= 80"})
        (True, None)

        >>> check_state_requirements(state, {"灵力": ">= 100"})
        (False, "灵力不足100")
    """
    if not requirements:
        return True, None

    for key, condition in requirements.items():
        if key not in player_state:
            return False, f"缺少属性：{key}"

        value = player_state[key]

        # 确保 condition 是字符串类型
        if not isinstance(condition, str):
            continue

        # 解析条件
        if ">=" in condition:
            threshold = int(condition.split(">=")[1].strip())
            if value < threshold:
                return False, f"{key}不足{threshold}（当前{value}）"

        elif "<=" in condition:
            threshold = int(condition.split("<=")[1].strip())
            if value > threshold:
                return False, f"{key}过高{threshold}（当前{value}）"

        elif ">" in condition:
            threshold = int(condition.split(">")[1].strip())
            if value <= threshold:
                return False, f"{key}必须大于{threshold}（当前{value}）"

        elif "<" in condition:
            threshold = int(condition.split("<")[1].strip())
            if value >= threshold:
                return False, f"{key}必须小于{threshold}（当前{value}）"

        elif "==" in condition:
            expected = condition.split("==")[1].strip()
            if str(value) != expected:
                return False, f"{key}必须为{expected}（当前{value}）"

        elif "包含" in condition:
            # 检查物品是否包含某个道具
            item_name = condition.split("包含")[1].strip()
            if key == "物品":
                items = [item["name"] for item in value]
                if item_name not in items:
                    return False, f"缺少道具：{item_name}"

    return True, None


def apply_state_changes(
    player_state: Dict[str, Any],
    state_delta: Dict[str, Any]
) -> Dict[str, Any]:
    """
    应用状态变化到玩家状态（支持嵌套属性更新）

    参数：
        player_state: 当前玩家状态
        state_delta: 状态变化，格式如：
            {
                "生命值": -20,
                "灵力": -30,
                "关键属性.根骨": +5,  # 嵌套属性更新
                "关系网.师父.favor": +10,  # 嵌套属性更新
                "物品+": [{"name": "疗伤丹", "count": 1}],
                "故事事件+": ["击败妖兽"]
            }

    返回：
        更新后的玩家状态（新字典）

    注意：
        - 以 "+" 结尾的键表示追加操作（如物品+、故事事件+）
        - 包含 "." 的键表示嵌套属性更新（如"关键属性.根骨"）
        - 其他键表示数值加减操作
        - 会自动处理最大值限制（如生命值不超过最大生命值）
    """
    # 深拷贝状态，避免修改原始数据
    import copy
    new_state = copy.deepcopy(player_state)

    for key, value in state_delta.items():
        # 追加操作（如物品+、故事事件+、关系网+）
        if key.endswith("+"):
            base_key = key[:-1]

            # 如果字段不存在，根据 value 类型智能初始化
            if base_key not in new_state:
                # 检查是否为关系网类型（列表中包含带 role 字段的字典）
                if isinstance(value, list) and value and isinstance(value[0], dict) and "role" in value[0]:
                    new_state[base_key] = {}  # 关系网类型，初始化为字典
                else:
                    new_state[base_key] = []  # 其他类型，初始化为列表

            # 根据现有数据类型处理追加操作
            if isinstance(new_state[base_key], dict):
                # 字典类型（如关系网）：使用 role 作为 key 合并
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            role = item.get("role", f"unknown_{len(new_state[base_key])}")
                            new_state[base_key][role] = item
                elif isinstance(value, dict):
                    # 直接合并字典
                    new_state[base_key].update(value)
            elif isinstance(new_state[base_key], list):
                # 列表类型（如物品、故事事件）：追加
                if isinstance(value, list):
                    new_state[base_key].extend(value)
                else:
                    new_state[base_key].append(value)

        # 嵌套属性更新（如"关键属性.根骨": +5）
        elif "." in key:
            keys = key.split(".")
            current = new_state

            # 导航到嵌套属性的父级
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]

            # 更新最后一级属性
            last_key = keys[-1]
            if last_key in current and isinstance(current[last_key], (int, float)):
                current[last_key] += value
            else:
                current[last_key] = value

        # 数值加减操作
        elif key in new_state:
            if isinstance(new_state[key], (int, float)):
                new_state[key] += value

                # 处理最大值限制
                max_key = f"最大{key}"
                if max_key in new_state:
                    new_state[key] = min(new_state[key], new_state[max_key])

                # 生命值不能低于0
                if key == "生命值":
                    new_state[key] = max(new_state[key], 0)

    return new_state


def create_initial_state(
    category: str,
    protagonist_name: str,
    protagonist_personality: Optional[str] = None
) -> Dict[str, Any]:
    """
    创建初始玩家状态

    根据小说类型（玄幻/言情/科幻等）创建合适的初始状态

    参数：
        category: 小说类型
        protagonist_name: 主角名字
        protagonist_personality: 主角性格

    返回：
        初始玩家状态字典
    """
    # 基础状态（所有类型通用）
    base_state = {
        "生命值": 100,
        "最大生命值": 100,
        "物品": [],
        "故事事件": [],
        "关系网": {}
    }

    # 根据类型添加特殊属性
    if category == "玄幻":
        base_state.update({
            "灵力": 100,
            "最大灵力": 100,
            "关键属性": {
                "根骨": 50,
                "悟性": 50,
                "气运": 50
            }
        })

    elif category == "科幻":
        base_state.update({
            "能量": 100,
            "最大能量": 100,
            "关键属性": {
                "智力": 50,
                "反应": 50,
                "技术": 50
            }
        })

    elif category == "言情":
        base_state.update({
            "魅力": 50,
            "关键属性": {
                "气质": 50,
                "才华": 50,
                "运气": 50
            }
        })

    elif category == "悬疑":
        base_state.update({
            "理智": 100,
            "最大理智": 100,
            "关键属性": {
                "观察": 50,
                "推理": 50,
                "直觉": 50
            }
        })

    else:  # 都市、其他类型
        base_state.update({
            "精力": 100,
            "最大精力": 100,
            "关键属性": {
                "体力": 50,
                "智慧": 50,
                "魅力": 50
            }
        })

    return base_state


def is_game_over(player_state: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    检查游戏是否结束

    参数：
        player_state: 玩家当前状态

    返回：
        (是否结束, 结束原因): (True, "生命值归零") 或 (False, None)
    """
    # 生命值归零
    if "生命值" in player_state and player_state["生命值"] <= 0:
        return True, "生命值归零"

    # 理智值归零（悬疑类型）
    if "理智" in player_state and player_state["理智"] <= 0:
        return True, "理智崩溃"

    return False, None


# ========== 调试工具函数 ==========

def format_roll_result(roll_value: int, target: int, success: bool) -> str:
    """
    格式化判定结果为可读字符串

    示例：
        >>> format_roll_result(45, 70, True)
        "🎲 投骰：45 / 目标：70 ✅ 成功！"
    """
    emoji = "✅" if success else "❌"
    result_text = "成功！" if success else "失败..."

    # 大成功/大失败特殊提示
    if roll_value <= 5:
        result_text = "大成功！🎉"
    elif roll_value >= 96:
        result_text = "大失败！💀"

    return f"🎲 投骰：{roll_value} / 目标：{target} {emoji} {result_text}"
