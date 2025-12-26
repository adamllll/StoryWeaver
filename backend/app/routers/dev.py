"""开发调试路由 - 仅在 DEBUG 模式下可用"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models.user import User
from ..models.novel import Novel
from ..models.chapter import Chapter
from ..models.character import Character, WorldSetting
from ..utils.security import hash_password

router = APIRouter(prefix="/dev", tags=["开发调试"])


# 测试数据模板（与seed_test_data.py保持一致）
TEST_USER = {
    "username": "test_user",
    "email": "test@example.com",
    "password": "test123",
    "bio": "测试账号 - 用于开发和测试",
}

TEST_NOVELS_DATA = [
    {
        "title": "【测试】仙侠奇缘录",
        "description": "一段跨越三界的修仙传奇",
        "category": "玄幻",
        "outline": """第一章：凡人觉醒 - 主角叶凡在古墓中获得神秘传承
第二章：踏入仙途 - 拜入青云宗，开始修炼之路
第三章：宗门大比 - 崭露头角，结识红颜知己
第四章：魔道来袭 - 保卫宗门，初显英雄本色
第五章：秘境探险 - 深入上古遗迹，获得法宝""",
        "chapters_count": 3,
        "characters_count": 3,
    },
    {
        "title": "【测试】末世求生日记",
        "description": "病毒爆发后的生存故事，含互动分支",
        "category": "科幻",
        "is_interactive": True,
        "chapters_count": 2,
        "characters_count": 2,
    },
]


def check_debug_mode():
    """检查是否在DEBUG模式下，非DEBUG模式抛出403错误"""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="此端点仅在 DEBUG 模式下可用",
        )


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_test_data(
    clean: bool = False,
    db: Session = Depends(get_db),
    _: None = Depends(check_debug_mode),
):
    """
    快速生成测试数据（仅限DEBUG模式）

    参数:
        clean: 是否先清空现有测试数据（默认False）

    返回:
        生成的数据统计信息
    """
    try:
        # 清空现有测试数据
        if clean:
            test_novels = db.query(Novel).filter(Novel.title.like("【测试】%")).all()
            for novel in test_novels:
                db.delete(novel)

            test_user = db.query(User).filter(User.username == TEST_USER["username"]).first()
            if test_user:
                db.delete(test_user)

            db.commit()

        # 创建测试用户
        user = db.query(User).filter(User.username == TEST_USER["username"]).first()
        if not user:
            user = User(
                username=TEST_USER["username"],
                email=TEST_USER["email"],
                password_hash=hash_password(TEST_USER["password"]),
                bio=TEST_USER["bio"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 创建测试小说（简化版，只创建基础数据）
        novels_created = []
        for novel_data in TEST_NOVELS_DATA:
            existing = db.query(Novel).filter(
                Novel.user_id == user.id,
                Novel.title == novel_data["title"]
            ).first()

            if not existing:
                novel = Novel(
                    user_id=user.id,
                    title=novel_data["title"],
                    description=novel_data["description"],
                    outline=novel_data.get("outline"),
                    category=novel_data["category"],
                    is_interactive=novel_data.get("is_interactive", False),
                )
                db.add(novel)
                db.flush()

                # 添加一个示例章节
                chapter = Chapter(
                    novel_id=novel.id,
                    title="第一章（示例）",
                    content="这是一个测试章节，内容足够长以便测试AI续写功能。" * 20,
                    order_num=1,
                )
                db.add(chapter)

                novels_created.append(novel.title)

        db.commit()

        return {
            "success": True,
            "message": "测试数据生成成功",
            "data": {
                "user": {
                    "username": user.username,
                    "password": TEST_USER["password"],
                    "email": user.email,
                },
                "novels_created": novels_created,
                "total_novels": len(novels_created),
            },
            "note": "建议使用 scripts/seed_test_data.py 生成完整测试数据",
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成测试数据失败: {str(e)}",
        )


@router.delete("/clean", status_code=status.HTTP_200_OK)
async def clean_test_data(
    db: Session = Depends(get_db),
    _: None = Depends(check_debug_mode),
):
    """
    清空所有测试数据（仅限DEBUG模式）

    返回:
        清理统计信息
    """
    try:
        # 删除所有【测试】标记的小说
        test_novels = db.query(Novel).filter(Novel.title.like("【测试】%")).all()
        novels_deleted = len(test_novels)

        for novel in test_novels:
            db.delete(novel)

        # 删除测试用户
        test_user = db.query(User).filter(User.username == TEST_USER["username"]).first()
        user_deleted = bool(test_user)

        if test_user:
            db.delete(test_user)

        db.commit()

        return {
            "success": True,
            "message": "测试数据清理完成",
            "data": {
                "novels_deleted": novels_deleted,
                "user_deleted": user_deleted,
            },
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"清理测试数据失败: {str(e)}",
        )


@router.get("/status")
async def dev_status(_: None = Depends(check_debug_mode)):
    """
    查看开发环境状态（仅限DEBUG模式）
    """
    return {
        "debug_mode": settings.DEBUG,
        "database": settings.DATABASE_URL,
        "ai_configured": bool(settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY),
        "endpoints": {
            "seed": "POST /api/dev/seed?clean=false",
            "clean": "DELETE /api/dev/clean",
            "status": "GET /api/dev/status",
        },
    }
