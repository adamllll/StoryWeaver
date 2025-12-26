#!/usr/bin/env python3
"""
测试数据生成脚本 - 用于快速填充开发/测试环境数据
使用方法:
    python scripts/seed_test_data.py           # 生成测试数据
    python scripts/seed_test_data.py --clean   # 清空测试数据后重新生成
"""
import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.novel import Novel
from app.models.chapter import Chapter
from app.models.character import Character, WorldSetting
from app.utils.security import hash_password


# ============== 测试数据模板 ==============
TEST_USER = {
    "username": "test_user",
    "email": "test@example.com",
    "password": "test123",
    "bio": "测试账号 - 用于开发和测试",
}

TEST_NOVELS = [
    {
        "title": "【测试】仙侠奇缘录",
        "description": "一段跨越三界的修仙传奇",
        "category": "玄幻",
        "status": "published",  # 改为已发布，让发现页面能看到
        "is_interactive": False,
        "outline": """第一章：凡人觉醒 - 主角叶凡在古墓中获得神秘传承
第二章：踏入仙途 - 拜入青云宗，开始修炼之路
第三章：宗门大比 - 崭露头角，结识红颜知己
第四章：魔道来袭 - 保卫宗门，初显英雄本色
第五章：秘境探险 - 深入上古遗迹，获得法宝""",
        "chapters": [
            {
                "title": "第一章：凡人觉醒",
                "order_num": 1,
                "content": """月色如水，照在破败的古墓之上。

叶凡提着生锈的铁剑，小心翼翼地走在布满青苔的石阶上。十六年的困苦生活让他养成了谨慎的性格，即使是在这座传说中的妖魔之地，他也不愿轻易放弃寻找改变命运的机会。

"咔嚓——"

一声脆响，脚下的石板突然裂开。叶凡还没反应过来，整个人就坠入了无尽的黑暗之中。

不知过了多久，意识渐渐恢复。睁开眼睛，映入眼帘的是一座巨大的石室。石室中央，悬浮着一颗散发着淡蓝色光芒的晶石。

"有缘人......终于来了......"

苍老而威严的声音在脑海中响起。那晶石突然化作一道流光，没入叶凡眉心。

剧烈的疼痛袭来，叶凡感觉自己的身体像是被千刀万剐。但很快，疼痛转为舒畅，一股磅礴的力量在经脉中流转。

当他再次睁开眼睛时，世界已经变得不同。他能清晰地感受到空气中游离的灵气，能听到数十米外的虫鸣，甚至能看清黑暗中的每一粒尘埃。

"这就是......修仙者的力量？"

叶凡握紧拳头,眼中闪烁着前所未有的光芒。从今天开始,他的命运将彻底改写。""",
            },
            {
                "title": "第二章：踏入仙途",
                "order_num": 2,
                "content": """清晨的第一缕阳光穿透云海，洒在青云宗的山门之上。

"你就是那个在古墓中获得传承的凡人？"身穿青色道袍的执事长老上下打量着叶凡，眼中闪过一丝惊讶，"根骨不错，勉强能入外门。"

叶凡恭敬地行礼："多谢长老！"

他知道,能进入青云宗已经是天大的机缘。这座屹立了千年的仙门,是方圆万里内最强大的修仙宗门之一。

"带他去外门第三峰，安排基础修炼功法。"长老挥了挥手。

接下来的日子,叶凡如饥似渴地学习着一切。《青云心诀》、《基础剑法》、《灵气吐纳术》......每一本典籍都让他着迷。

三个月后的一天，正在打坐修炼的叶凡突然感觉到体内灵气疯狂涌动。

"轰——"

他成功突破了！从凡人境进入练气一层！

"这速度......比我当年还快！"远处观察的执事长老震惊了，"难道这小子真的是百年难遇的天才？"

而叶凡并不知道，他的快速进境已经引起了宗门高层的注意。一场改变他命运的宗门大比，即将到来。""",
            },
            {
                "title": "第三章：宗门大比（未完成）",
                "order_num": 3,
                "content": """演武场上人山人海。

今天是青云宗三年一度的宗门大比，所有外门弟子都可以参加。优胜者不仅能获得丰厚的奖励，更有机会晋升内门，得到更高级的传承。

"第十八场，叶凡对战王猛！"

随着裁判长老的声音落下......

（本章节内容未完成，可以使用AI续写功能继续创作）""",
            },
        ],
        "characters": [
            {
                "name": "叶凡",
                "role_type": "主角",
                "description": "孤儿出身，十六岁，根骨奇佳，获得上古传承，性格坚韧不拔，重情重义",
            },
            {
                "name": "林雪瑶",
                "role_type": "女主",
                "description": "青云宗内门天才，冰清玉洁，剑道天才，与叶凡在宗门大比中相识",
            },
            {
                "name": "张长老",
                "role_type": "配角",
                "description": "青云宗外门执事，表面严厉实则关心弟子，慧眼识珠发现叶凡天赋",
            },
        ],
        "world_settings": [
            {
                "setting_type": "修炼体系",
                "name": "修仙境界",
                "description": "练气期→筑基期→金丹期→元婴期→化神期→渡劫期→大乘期",
            },
            {
                "setting_type": "地理",
                "name": "青云宗",
                "description": "位于天元大陆东部，占据三十六座灵峰，是东域五大仙门之一",
            },
        ],
    },
    {
        "title": "【测试】末世求生日记",
        "description": "病毒爆发后的生存故事，含互动分支",
        "category": "科幻",
        "status": "draft",
        "is_interactive": True,
        "outline": """第一章：爆发日 - 病毒突然爆发，城市陷入混乱
第二章：艰难抉择 - 是留守还是逃离？【互动分支】
第三章：组建队伍 - 遇到幸存者，决定合作
第四章：物资争夺 - 与其他幸存者团队发生冲突""",
        "chapters": [
            {
                "title": "序章：最后的平静",
                "order_num": 1,
                "content": """2025年6月15日，星期日，晴。

"今天又是平凡的一天。"张晨在日记本上写下这句话。

作为一名普通的上班族，他从未想过自己的生活会有什么波澜。早上七点起床，去便利店买早餐，然后坐地铁去公司——这就是他的日常。

但今天有些不同。

地铁里的人似乎比平时少了很多。车厢角落里，一个戴着口罩的男人不停地咳嗽，引来周围乘客不安的目光。

"新闻说最近有流感爆发，大家小心点。"旁边的大妈小声嘀咕。

张晨没太在意，流感嘛，每年都有。他掏出手机，刷着社交媒体上的段子，直到......

"号外！市中心医院封锁！疑似新型传染病爆发！"

推送通知突然跳了出来。

张晨皱了皱眉，点开新闻。屏幕上，是一段模糊的视频：全副武装的医护人员在搬运担架，而担架上的人正在剧烈地抽搐......

地铁突然急刹车。

广播里传来紧急通知："各位乘客请注意，根据防疫部门要求，本次列车将在下一站清空车厢，所有乘客必须接受体温检测......"

张晨这才意识到，事情可能真的不对劲了。

他看向窗外，街道上已经开始出现混乱。人们争相涌入商店，超市门口排起了长队......

这不是流感。

这是......末日的序曲。""",
            },
            {
                "title": "第一章：选择",
                "order_num": 2,
                "content": """当张晨回到家时，电视里已经全是紧急新闻。

"请市民不要恐慌，留在家中，等待进一步通知......"

主持人的声音在颤抖。

手机响了,是室友小李打来的："张晨！我在超市，这里已经疯了！货架被抢空了！你赶紧来！"

挂断电话，张晨陷入了思考。

现在摆在他面前有几个选择......

（本章节为互动章节，后续内容根据玩家选择生成）""",
            },
        ],
        "characters": [
            {
                "name": "张晨",
                "role_type": "主角",
                "description": "28岁，IT程序员，理性冷静，擅长分析和计划",
            },
            {
                "name": "小李",
                "role_type": "配角",
                "description": "张晨的室友，性格冲动但讲义气，退伍军人",
            },
        ],
        "world_settings": [
            {
                "setting_type": "病毒设定",
                "name": "X病毒",
                "description": "感染后24小时内发病，症状包括高烧、暴躁、失去理智，感染者会攻击他人",
            },
        ],
    },
]


# ============== 核心函数 ==============
def clean_test_data(db: Session) -> None:
    """清空所有带【测试】标记的数据"""
    print("正在清理测试数据...")

    # 查找所有测试小说
    test_novels = db.query(Novel).filter(Novel.title.like("【测试】%")).all()
    for novel in test_novels:
        print(f"  删除小说: {novel.title}")
        db.delete(novel)

    # 删除测试用户（会级联删除其小说）
    test_user = db.query(User).filter(User.username == TEST_USER["username"]).first()
    if test_user:
        print(f"  删除用户: {test_user.username}")
        db.delete(test_user)

    db.commit()
    print("测试数据清理完成！\n")


def create_test_user(db: Session) -> User:
    """创建测试用户（幂等操作）"""
    user = db.query(User).filter(User.username == TEST_USER["username"]).first()

    if user:
        print(f"用户 '{user.username}' 已存在，跳过创建")
        return user

    user = User(
        username=TEST_USER["username"],
        email=TEST_USER["email"],
        password_hash=hash_password(TEST_USER["password"]),
        bio=TEST_USER["bio"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"创建用户: {user.username} (ID: {user.id})")
    print(f"  邮箱: {user.email}")
    print(f"  密码: {TEST_USER['password']}")
    return user


def seed_novel(db: Session, user_id: int, novel_data: dict) -> Novel:
    """创建单个小说及其关联数据"""
    # 创建小说
    novel = Novel(
        user_id=user_id,
        title=novel_data["title"],
        description=novel_data["description"],
        outline=novel_data["outline"],
        category=novel_data["category"],
        status=novel_data["status"],
        is_interactive=novel_data["is_interactive"],
    )
    db.add(novel)
    db.flush()  # 获取 novel.id

    print(f"\n创建小说: {novel.title} (ID: {novel.id})")
    print(f"  类型: {novel.category}")
    print(f"  互动: {'是' if novel.is_interactive else '否'}")

    # 创建章节
    for chapter_data in novel_data["chapters"]:
        chapter = Chapter(
            novel_id=novel.id,
            title=chapter_data["title"],
            content=chapter_data["content"],
            order_num=chapter_data["order_num"],
        )
        db.add(chapter)
        print(f"  + 章节: {chapter.title} ({len(chapter.content)} 字)")

    # 创建角色
    for char_data in novel_data["characters"]:
        character = Character(
            novel_id=novel.id,
            name=char_data["name"],
            role_type=char_data["role_type"],
            description=char_data["description"],
        )
        db.add(character)
        print(f"  + 角色: {char_data['name']} ({char_data['role_type']})")

    # 创建世界观设定
    for ws_data in novel_data.get("world_settings", []):
        world_setting = WorldSetting(
            novel_id=novel.id,
            setting_type=ws_data["setting_type"],
            name=ws_data["name"],
            description=ws_data["description"],
        )
        db.add(world_setting)
        print(f"  + 世界观: {ws_data['name']}")

    return novel


def seed_all(db: Session) -> None:
    """生成所有测试数据"""
    print("=" * 50)
    print("开始生成测试数据")
    print("=" * 50 + "\n")

    # 创建用户
    user = create_test_user(db)

    # 创建小说
    for novel_data in TEST_NOVELS:
        seed_novel(db, user.id, novel_data)

    db.commit()

    print("\n" + "=" * 50)
    print("测试数据生成完成！")
    print("=" * 50)
    print(f"\n登录信息:")
    print(f"  用户名: {TEST_USER['username']}")
    print(f"  密码: {TEST_USER['password']}")
    print(f"  邮箱: {TEST_USER['email']}")
    print(f"\n已生成 {len(TEST_NOVELS)} 个测试小说，请登录后查看。")


# ============== 主函数 ==============
def main():
    """主函数"""
    # 解析命令行参数
    should_clean = "--clean" in sys.argv

    db = SessionLocal()
    try:
        if should_clean:
            clean_test_data(db)

        seed_all(db)

    except Exception as e:
        db.rollback()
        print(f"\n错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
