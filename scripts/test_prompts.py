#!/usr/bin/env python3
"""
测试新的重写和扩写Prompt

使用方法：
    python test_prompts.py

这个脚本会打印出新的Prompt内容，方便你检查和测试。
"""

import sys
import os

# 添加 backend 目录到 Python 路径
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(repo_root, "backend"))

from app.utils.prompts import get_rewrite_prompt, get_expand_prompt


def print_section(title: str):
    """打印分隔线"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def test_rewrite_prompt():
    """测试重写Prompt"""
    print_section("测试重写Prompt")

    # 测试用例1：短文本重写（保持原意）
    original_text = (
        "李明走进房间，看到桌上放着一封信。他拿起信封，小心翼翼地拆开，"
        "里面是一张泛黄的纸条。纸条上写着：'明天午夜，老地方见。'"
        "他皱起眉头，陷入了沉思。这笔迹，他似曾相识。"
    )

    print(f"原文字数：{len(original_text)}字")
    print(f"原文内容：\n{original_text}\n")

    system_prompt, user_prompt = get_rewrite_prompt(
        original_text=original_text,
        rewrite_style='保持原意',
        category='悬疑',
        novel_context='一个关于神秘信件的悬疑故事',
        characters_info='李明：主角，侦探',
        special_requirements='无'
    )

    print("--- System Prompt（前1000字符）---")
    print(system_prompt[:1000])
    print("\n... (省略部分内容) ...\n")

    print("--- User Prompt ---")
    print(user_prompt)


def test_expand_prompt():
    """测试扩写Prompt"""
    print_section("测试扩写Prompt")

    # 测试用例：短文本扩写
    expand_text = "张三走进咖啡馆，点了一杯咖啡，坐下来等人。"

    print(f"原文字数：{len(expand_text)}字")
    print(f"原文内容：\n{expand_text}\n")

    system_prompt, user_prompt = get_expand_prompt(
        text=expand_text,
        style='详细描写',
        word_count=150
    )

    print("--- System Prompt（前1000字符）---")
    print(system_prompt[:1000])
    print("\n... (省略部分内容) ...\n")

    print("--- User Prompt ---")
    print(user_prompt)


def main():
    """主函数"""
    print("\n" + "=" * 80)
    print("  StoryWeaver - 重写和扩写Prompt测试")
    print("=" * 80)

    try:
        test_rewrite_prompt()
        test_expand_prompt()

        print_section("测试完成")
        print("✓ Prompt生成成功！")
        print("\n下一步：")
        print("1. 启动后端服务：cd backend && uvicorn app.main:app --reload")
        print("2. 在前端测试重写和扩写功能")
        print("3. 检查输出字数是否在目标范围内")
        print("4. 检查输出内容是否保留了原文的所有情节\n")

    except Exception as e:
        print(f"\n❌ 错误：{e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
