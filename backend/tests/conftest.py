"""简化的测试配置和fixtures"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.utils.security import hash_password
from app.utils.auth import create_token
from app.services.ai_service import ai_service
from app.schemas import AIUsage
from app.models.user import User
from app.models.novel import Novel
from app.models.chapter import Chapter
from app.models.character import Character
from app.models.adventure import Adventure, StoryNode, PlayerChoice, AIConversation
from app.routers import (
    auth_router,
    novels_router,
    chapters_router,
    ai_router,
    characters_router,
    reading_progress_router,
    adventures_router,
    conversations_router,
    admin_router
)


# 使用内存SQLite数据库，使用StaticPool确保所有连接使用同一个数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建所有表
Base.metadata.create_all(bind=engine)


def override_get_db():
    """覆盖数据库依赖"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def test_app():
    """创建测试应用"""
    app = FastAPI()
    app.include_router(auth_router, prefix="/api")
    app.include_router(novels_router, prefix="/api")
    app.include_router(chapters_router, prefix="/api")
    app.include_router(ai_router, prefix="/api")
    app.include_router(characters_router, prefix="/api")
    app.include_router(reading_progress_router, prefix="/api")
    app.include_router(adventures_router, prefix="/api")
    app.include_router(conversations_router, prefix="/api")
    app.include_router(admin_router, prefix="/api")
    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture(scope="module")
def client(test_app):
    """创建测试客户端"""
    return TestClient(test_app)


@pytest.fixture(scope="function")
def db():
    """创建数据库会话"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_user(db):
    """创建测试用户"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"testuser_{unique_id}",
        email=f"test_{unique_id}@example.com",
        password_hash=hash_password("Password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user2(db):
    """创建第二个测试用户"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"testuser2_{unique_id}",
        email=f"test2_{unique_id}@example.com",
        password_hash=hash_password("Password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user):
    """生成认证令牌"""
    return create_token(test_user.id)


@pytest.fixture
def auth_headers(auth_token):
    """生成认证请求头"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def test_novel(db, test_user):
    """创建测试小说"""
    novel = Novel(
        user_id=test_user.id,
        title="测试小说",
        description="这是一个测试小说",
        category="玄幻",
        status="draft"
    )
    db.add(novel)
    db.commit()
    db.refresh(novel)
    return novel


@pytest.fixture
def published_novel(db, test_user):
    """创建已发布的测试小说"""
    novel = Novel(
        user_id=test_user.id,
        title="已发布小说",
        description="这是一个已发布的小说",
        category="言情",
        status="published"
    )
    db.add(novel)
    db.commit()
    db.refresh(novel)
    return novel


@pytest.fixture
def test_chapter(db, test_novel):
    """创建测试章节"""
    chapter = Chapter(
        novel_id=test_novel.id,
        title="第一章",
        content="这是第一章的内容",
        order_num=1
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter


@pytest.fixture
def test_character(db, test_novel):
    """创建测试角色"""
    character = Character(
        novel_id=test_novel.id,
        name="主角",
        role_type="主角",
        description="修仙者，英俊潇洒，勇敢正直，出身平凡但修炼天赋极高"
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return character


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """自动重置速率限制器（本小姐的重要修复！）"""
    from app.middleware.rate_limit import ai_rate_limiter
    from app.utils.rate_limit import limiter as slowapi_limiter

    # 重置 AI 速率限制器
    ai_rate_limiter.requests.clear()

    # 重置 slowapi 速率限制器（本小姐的重要修复：防止 429 错误！）
    try:
        # slowapi 使用内部存储,清除它的限制记录
        slowapi_limiter._storage.storage.clear()
    except:
        pass  # 如果存储结构不同,忽略错误

    yield

    # 测试后也清理
    ai_rate_limiter.requests.clear()
    try:
        slowapi_limiter._storage.storage.clear()
    except:
        pass


@pytest.fixture
def mock_ai_service(monkeypatch):
    """Mock AI服务"""
    def build_long_text(target_length: int) -> str:
        sentence = "这是测试内容。"
        repeat = max(1, int(target_length / len(sentence)) + 2)
        return sentence * repeat

    def extract_target_length(prompt: str) -> int:
        import re

        match = re.search(r"目标字数[:：]\s*(\d+)", prompt)
        if match:
            return int(match.group(1))

        match = re.search(r"最低字数[:：]\s*(\d+)", prompt)
        if match:
            return int(match.group(1))

        return 2000

    async def mock_generate(system_prompt, user_prompt, max_tokens=4000, temperature=0.7, task=None):
        target_length = extract_target_length(user_prompt)
        body = build_long_text(target_length)
        if "章节标题" in user_prompt or "续写" in user_prompt or "章节" in user_prompt:
            content = f"# 第一章 测试标题\n\n{body}"
        else:
            content = body
        return content, AIUsage(prompt_tokens=100, completion_tokens=200, total_tokens=300)

    # 用于存储请求的 role_type
    request_context = {}

    async def mock_generate_json(system_prompt, user_prompt, max_tokens=4000, temperature=0.7, task=None):
        # 根据提示词判断返回类型
        # 🆕 冒险节点生成（识别关键词："互动小说的叙事者"）
        if "互动小说的叙事者" in system_prompt or "判定结果处理" in system_prompt:
            return {
                "content": "测试故事内容。主角继续前进，探索未知的领域。\n\n经过一番探索，主角发现了新的线索。",
                "state_changes": {"生命值": 10},
                "choices": [
                    {
                        "index": 0,
                        "text": "继续探索",
                        "inner_monologue": "前方还有更多未知...",
                        "success_rate": 0.7,
                        "difficulty": "普通",
                        "potential_reward": "发现新线索",
                        "potential_risk": "可能遇到危险",
                        "state_requirements": None
                    },
                    {
                        "index": 1,
                        "text": "谨慎行事",
                        "inner_monologue": "还是小心为上...",
                        "success_rate": 0.85,
                        "difficulty": "简单",
                        "potential_reward": "安全前进",
                        "potential_risk": "可能错过机会",
                        "state_requirements": None
                    }
                ]
            }, AIUsage(prompt_tokens=100, completion_tokens=200, total_tokens=300)
        elif "角色" in system_prompt or "character" in system_prompt.lower():
            # 从 user_prompt 中提取 role_type（如果有的话）
            role_type = "主角"  # 默认值
            if "反派" in user_prompt:
                role_type = "反派"
            elif "配角" in user_prompt:
                role_type = "配角"
            elif "女主" in user_prompt:
                role_type = "女主"
            elif "导师" in user_prompt:
                role_type = "导师"

            return {
                "name": "测试角色",
                "gender": "男",
                "age": 25,
                "identity": "剑客",
                "appearance": "英俊",
                "personality": ["勇敢", "正直"],
                "background": "江湖侠客",
                "abilities": "剑术高超",
                "role_type": role_type
            }, AIUsage(prompt_tokens=100, completion_tokens=200, total_tokens=300)
        elif "大纲" in system_prompt or "outline" in system_prompt.lower():
            # 大纲生成
            return {
                "title": "测试小说标题",
                "description": "这是一个测试小说的简介",
                "outline": "第一章：开篇\n第二章：发展\n第三章：高潮\n第四章：结局"
            }, AIUsage(prompt_tokens=100, completion_tokens=200, total_tokens=300)
        else:
            # 分支选项
            return {
                "choices": [
                    {
                        "choice_text": "选项A",
                        "inner_monologue": "内心想法A",
                        "possible_outcome": "可能结果A",
                        "short_term_effects": ["效果1"],
                        "long_term_effects": ["效果2"],
                        "risk_level": "低",
                        "emotion_tags": ["勇敢"],
                        "next_chapters_direction": ["方向1"]
                    },
                    {
                        "choice_text": "选项B",
                        "inner_monologue": "内心想法B",
                        "possible_outcome": "可能结果B",
                        "short_term_effects": ["效果3"],
                        "long_term_effects": ["效果4"],
                        "risk_level": "高",
                        "emotion_tags": ["谨慎"],
                        "next_chapters_direction": ["方向2"]
                    }
                ]
            }, AIUsage(prompt_tokens=100, completion_tokens=200, total_tokens=300)

    monkeypatch.setattr(ai_service, "generate", mock_generate)
    monkeypatch.setattr(ai_service, "generate_json", mock_generate_json)
    return ai_service


# ========== 冒险游戏相关 Fixtures ==========

@pytest.fixture
def test_adventure(db, test_user):
    """创建测试冒险"""
    adventure = Adventure(
        player_id=test_user.id,
        title="测试冒险",
        category="玄幻",
        keywords=["修仙", "复仇"],
        protagonist_name="李青云",
        protagonist_gender="male",
        protagonist_personality="冷静、果断",
        player_state={
            "生命值": 100,
            "最大生命值": 100,
            "灵力": 150,
            "最大灵力": 150,
            "物品": [],
            "关键属性": {"根骨": 50, "悟性": 45, "气运": 60},
            "故事事件": [],
            "关系网": {}
        },
        total_nodes=0,
        total_choices=0,
        total_words=0
    )
    db.add(adventure)
    db.commit()
    db.refresh(adventure)
    return adventure


@pytest.fixture
def test_story_node(db, test_adventure):
    """创建测试故事节点"""
    node = StoryNode(
        adventure_id=test_adventure.id,
        parent_node_id=None,
        chapter_num=1,
        title="第一章",
        content="这是第一章的内容，主角李青云开始了他的修仙之旅...",
        state_before=test_adventure.player_state.copy(),
        state_after=test_adventure.player_state.copy(),
        choices=[
            {
                "index": 0,
                "text": "探索左侧通道",
                "inner_monologue": "左侧通道传来微弱的药香...",
                "success_rate": 0.7,
                "difficulty": "简单",
                "potential_reward": "普通灵药",
                "potential_risk": "可能遇到机关"
            },
            {
                "index": 1,
                "text": "强闯中间通道",
                "inner_monologue": "中间通道灵力波动剧烈...",
                "success_rate": 0.45,
                "difficulty": "困难",
                "potential_reward": "上古功法",
                "potential_risk": "可能遇到妖兽"
            }
        ]
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    
    # 更新冒险的当前节点
    test_adventure.current_node_id = node.id
    test_adventure.total_nodes = 1
    test_adventure.total_words = len(node.content)
    db.commit()
    
    return node


@pytest.fixture
def test_adventure_with_nodes(db, test_user):
    """创建包含多个节点的测试冒险"""
    adventure = Adventure(
        player_id=test_user.id,
        title="完整冒险",
        category="玄幻",
        keywords=["修仙"],
        protagonist_name="张三",
        protagonist_gender="male",
        player_state={
            "生命值": 80,
            "最大生命值": 100,
            "灵力": 120,
            "最大灵力": 150,
            "物品": [{"name": "疗伤丹", "count": 2}],
            "关键属性": {"根骨": 50, "悟性": 45, "气运": 60},
            "故事事件": ["拜入剑宗"],
            "关系网": {}
        },
        total_nodes=3,
        total_choices=2,
        total_words=1500
    )
    db.add(adventure)
    db.flush()
    
    # 创建3个节点
    nodes = []
    for i in range(1, 4):
        node = StoryNode(
            adventure_id=adventure.id,
            parent_node_id=nodes[-1].id if nodes else None,
            chapter_num=i,
            title=f"第{i}章",
            content=f"这是第{i}章的内容，约500字..." * 10,
            state_before=adventure.player_state.copy(),
            state_after=adventure.player_state.copy(),
            choices=[
                {
                    "index": 0,
                    "text": f"选项A-{i}",
                    "inner_monologue": "内心想法...",
                    "success_rate": 0.7,
                    "difficulty": "普通",
                    "potential_reward": "奖励",
                    "potential_risk": "风险"
                }
            ]
        )
        db.add(node)
        db.flush()
        nodes.append(node)
    
    adventure.current_node_id = nodes[-1].id
    db.commit()
    db.refresh(adventure)
    
    return adventure


@pytest.fixture
def test_conversation(db, test_adventure):
    """创建测试对话"""
    conversation = AIConversation(
        adventure_id=test_adventure.id,
        user_id=test_adventure.player_id,
        messages=[
            {"role": "user", "content": "开始冒险"},
            {"role": "assistant", "content": "欢迎来到修仙世界..."}
        ]
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


# ========== 管理员相关 Fixtures ==========
@pytest.fixture
def admin_user(db):
    """创建管理员用户"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"admin_{unique_id}",
        email=f"admin_{unique_id}@example.com",
        password_hash=hash_password("Admin123"),
        is_admin=True,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """生成管理员认证令牌"""
    return create_token(admin_user.id)


@pytest.fixture
def admin_headers(admin_token):
    """生成管理员认证请求头"""
    return {"Authorization": f"Bearer {admin_token}"}
