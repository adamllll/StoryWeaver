"""测试自动生成第一章功能"""
import re

# 测试大纲提取功能
def test_extract_first_chapter():
    """测试从大纲中提取第一章"""

    # 测试用例 1：标准格式
    outline1 = """### 3. 章节大纲

## 第一章：觉醒之日
主角林凡在家族试炼中意外觉醒神秘力量，引发众人关注。

## 第二章：暗流涌动
家族长老对林凡的力量产生疑虑，开始调查其来源。

## 第三章：真相浮现
林凡发现自己拥有的是传说中的混沌体质。
"""

    # 测试用例 2：没有标记的大纲
    outline2 = """这是一个关于修仙的故事，主角在某一天突然觉醒了特殊能力..."""

    # 测试用例 3：带有"：" 的格式
    outline3 = """## 第一章:初入江湖
少年离家，踏上江湖之路。

## 第二章:奇遇
在山林中遇到神秘高人。
"""

    def extract_first_chapter(outline: str) -> tuple[str, str]:
        """提取第一章标题和大纲（与实际代码保持一致）"""
        pattern = r'(?:##\s*)?(?:第[一二三四五六七八九十\d]+章[：:：]?)\s*([^\n]+)'
        matches = list(re.finditer(pattern, outline, re.MULTILINE))

        if not matches:
            return "第一章", outline[:500]

        first_match = matches[0]
        title = first_match.group(1).strip()
        start_pos = first_match.end()

        if len(matches) > 1:
            end_pos = matches[1].start()
            chapter_outline = outline[start_pos:end_pos].strip()
        else:
            chapter_outline = outline[start_pos:].strip()

        if not chapter_outline:
            chapter_outline = outline[:500]

        return f"第一章：{title}", chapter_outline

    # 测试用例 1
    print("测试用例 1：标准格式")
    title1, content1 = extract_first_chapter(outline1)
    print(f"标题: {title1}")
    print(f"大纲: {content1}")
    print()

    # 测试用例 2
    print("测试用例 2：无章节标记")
    title2, content2 = extract_first_chapter(outline2)
    print(f"标题: {title2}")
    print(f"大纲: {content2}")
    print()

    # 测试用例 3
    print("测试用例 3：冒号格式")
    title3, content3 = extract_first_chapter(outline3)
    print(f"标题: {title3}")
    print(f"大纲: {content3}")
    print()


if __name__ == "__main__":
    test_extract_first_chapter()
