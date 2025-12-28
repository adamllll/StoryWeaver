import sys
import os

# 将 backend 目录加入 python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.utils.prompts import get_story_node_prompt

try:
    print("Testing get_story_node_prompt format...")
    system_prompt, user_prompt = get_story_node_prompt(
        category="玄幻",
        keywords=["剑道", "复仇"],
        protagonist_name="叶凡",
        protagonist_gender="男",
        protagonist_personality="坚毅",
        story_summary="前情提要...",
        choice_text="拔剑攻击",
        choice_inner_monologue="拼了！",
        choice_potential_reward="获得神器",
        choice_potential_risk="重伤",
        choice_difficulty="困难",
        success=True,
        roll_value=20,
        target=50,
        success_rate=0.5,
        player_state={"生命值": 100, "物品": []}
    )
    print("SUCCESS: Prompt formatting works correctly.")
except Exception as e:
    print(f"ERROR: Prompt formatting failed: {str(e)}")
    import traceback
    traceback.print_exc()
