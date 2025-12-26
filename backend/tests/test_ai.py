"""AI生成API测试 - 修复版本"""
import pytest
from fastapi import status


@pytest.mark.unit
class TestGenerateOutline:
    """AI大纲生成测试"""

    def test_generate_outline_success(self, client, auth_headers, mock_ai_service):
        """测试成功生成大纲"""
        response = client.post(
            "/api/ai/outline",
            headers=auth_headers,
            json={
                "category": "玄幻",
                "keywords": "修仙,热血",
                "chapter_count": 10,
                "target_words": 100
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "outline" in data
        assert "usage" in data
        assert data["usage"]["total_tokens"] > 0

    def test_generate_outline_with_optional_params(self, client, auth_headers, mock_ai_service):
        """测试带可选参数生成大纲"""
        response = client.post(
            "/api/ai/outline",
            headers=auth_headers,
            json={
                "category": "言情",
                "keywords": "都市,甜宠",
                "chapter_count": 20,
                "target_words": 200,
                "target_audience": "女性读者",
                "protagonist": "职场女性",
                "background": "现代都市",
                "special_requirements": "轻松甜蜜"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert "outline" in response.json()

    def test_generate_outline_without_auth(self, client, mock_ai_service):
        """测试未认证生成大纲"""
        response = client.post(
            "/api/ai/outline",
            json={"category": "玄幻", "keywords": "修仙", "chapter_count": 10, "target_words": 100}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
class TestContinueChapter:
    """AI续写章节测试"""

    def test_continue_chapter_success(self, client, test_novel, auth_headers, mock_ai_service):
        """测试成功续写章节"""
        response = client.post(
            "/api/ai/continue",
            headers=auth_headers,
            json={
                "novel_id": test_novel.id,
                "chapter_outline": "主角遇到强敌，展开激烈战斗",
                "word_count": 2000
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data
        assert "word_count" in data
        assert "usage" in data

    def test_continue_with_previous_chapter(self, client, test_novel, test_chapter, auth_headers, mock_ai_service):
        """测试基于前文续写"""
        response = client.post(
            "/api/ai/continue",
            headers=auth_headers,
            json={
                "novel_id": test_novel.id,
                "chapter_id": test_chapter.id,
                "chapter_outline": "继续冒险，探索未知领域",
                "word_count": 1500
            }
        )
        assert response.status_code == status.HTTP_200_OK

    def test_continue_with_special_requirements(self, client, test_novel, auth_headers, mock_ai_service):
        """测试带特殊要求续写"""
        response = client.post(
            "/api/ai/continue",
            headers=auth_headers,
            json={
                "novel_id": test_novel.id,
                "chapter_outline": "战斗场景，主角与敌人对决",
                "word_count": 2000,
                "special_requirements": "描写要细腻，节奏要紧张"
            }
        )
        assert response.status_code == status.HTTP_200_OK

    def test_continue_nonexistent_novel(self, client, auth_headers, mock_ai_service):
        """测试续写不存在的小说"""
        response = client.post(
            "/api/ai/continue",
            headers=auth_headers,
            json={
                "novel_id": 99999,
                "chapter_outline": "测试章节大纲内容描述",
                "word_count": 1000
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_continue_not_owner(self, client, db, test_novel, auth_headers, mock_ai_service):
        """测试非作者续写"""
        from app.utils.auth import create_token
        from app.models.user import User
        from app.utils.security import hash_password
        import uuid

        # 在同一个事务中创建第二个用户
        unique_id = str(uuid.uuid4())[:8]
        user2 = User(
            username=f"testuser2_{unique_id}",
            email=f"test2_{unique_id}@example.com",
            password_hash=hash_password("password123")
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)

        other_token = create_token(user2.id)
        response = client.post(
            "/api/ai/continue",
            headers={"Authorization": f"Bearer {other_token}"},
            json={
                "novel_id": test_novel.id,
                "chapter_outline": "测试章节大纲内容描述",
                "word_count": 1000
            }
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
class TestExpandText:
    """AI扩写测试"""

    def test_expand_text_success(self, client, auth_headers, mock_ai_service):
        """测试成功扩写"""
        response = client.post(
            "/api/ai/expand",
            headers=auth_headers,
            json={
                "text": "他走进了房间",
                "style": "详细描写",
                "word_count": 500
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "expanded_text" in data
        assert "word_count" in data
        assert "usage" in data

    def test_expand_without_auth(self, client, mock_ai_service):
        """测试未认证扩写"""
        response = client.post(
            "/api/ai/expand",
            json={"text": "测试", "style": "详细描写", "word_count": 500}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
class TestGenerateCharacter:
    """AI角色生成测试"""

    def test_generate_character_success(self, client, test_novel, auth_headers, mock_ai_service):
        """测试成功生成角色"""
        response = client.post(
            "/api/ai/character",
            headers=auth_headers,
            json={
                "novel_id": test_novel.id,
                "role_type": "主角",
                "design_direction": "勇敢正直的少年"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "character" in data
        assert data["character"]["role_type"] == "主角"
        assert "usage" in data

    def test_generate_character_with_name(self, client, test_novel, auth_headers, mock_ai_service):
        """测试指定名字生成角色"""
        response = client.post(
            "/api/ai/character",
            headers=auth_headers,
            json={
                "novel_id": test_novel.id,
                "role_type": "配角",
                "character_name": "李明"
            }
        )
        assert response.status_code == status.HTTP_200_OK

    def test_generate_character_nonexistent_novel(self, client, auth_headers, mock_ai_service):
        """测试为不存在的小说生成角色"""
        response = client.post(
            "/api/ai/character",
            headers=auth_headers,
            json={
                "novel_id": 99999,
                "role_type": "主角"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_generate_character_not_owner(self, client, test_novel, test_user2, mock_ai_service):
        """测试非作者生成角色"""
        from app.utils.auth import create_token
        other_token = create_token(test_user2.id)
        response = client.post(
            "/api/ai/character",
            headers={"Authorization": f"Bearer {other_token}"},
            json={
                "novel_id": test_novel.id,
                "role_type": "主角"
            }
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
class TestGenerateBranch:
    """AI分支生成测试"""

    def test_generate_branch_success(self, client, auth_headers, mock_ai_service):
        """测试成功生成分支"""
        response = client.post(
            "/api/ai/branch",
            headers=auth_headers,
            json={
                "current_scene": "主角面临选择，这是一个关键时刻，需要做出重要决定，影响后续剧情发展。周围环境危险重重，时间紧迫，必须立即做出抉择。"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "choices" in data
        assert "branch_type" in data

    def test_generate_branch_with_context(self, client, auth_headers, mock_ai_service):
        """测试带上下文生成分支"""
        response = client.post(
            "/api/ai/branch",
            headers=auth_headers,
            json={
                "current_scene": "战斗场景，主角与强敌对峙，周围环境危险重重，需要快速做出决策以求生存。敌人步步紧逼，形势万分危急啊！",
                "protagonist_status": "受伤",
                "companion_status": "在场",
                "external_threat": "敌人包围",
                "story_direction": "紧张刺激"
            }
        )
        assert response.status_code == status.HTTP_200_OK

    def test_generate_branch_without_auth(self, client, mock_ai_service):
        """测试未认证生成分支"""
        response = client.post(
            "/api/ai/branch",
            json={"current_scene": "测试场景，这是一个足够长的场景描述，用于满足最小长度要求，确保测试能够正常运行"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
class TestAIFlow:
    """AI功能集成测试"""

    def test_complete_ai_workflow(self, client, mock_ai_service):
        """测试完整的AI辅助创作流程"""
        import uuid

        # 通过 API 注册用户
        unique_id = str(uuid.uuid4())[:8]
        register_response = client.post(
            "/api/auth/register",
            json={
                "username": f"workflow_user_{unique_id}",
                "email": f"workflow_{unique_id}@example.com",
                "password": "password123"
            }
        )
        assert register_response.status_code == 201
        token = register_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. 生成大纲
        outline_response = client.post(
            "/api/ai/outline",
            headers=headers,
            json={
                "category": "玄幻",
                "keywords": "修仙,热血",
                "chapter_count": 10,
                "target_words": 50
            }
        )
        assert outline_response.status_code == status.HTTP_200_OK

        # 2. 创建小说
        novel_response = client.post(
            "/api/novels",
            headers=headers,
            json={
                "title": "AI创作小说",
                "category": "玄幻"
            }
        )
        assert novel_response.status_code == status.HTTP_201_CREATED
        novel_id = novel_response.json()["id"]

        # 3. 生成角色
        character_response = client.post(
            "/api/ai/character",
            headers=headers,
            json={
                "novel_id": novel_id,
                "role_type": "主角"
            }
        )
        assert character_response.status_code == status.HTTP_200_OK

        # 4. 续写章节
        continue_response = client.post(
            "/api/ai/continue",
            headers=headers,
            json={
                "novel_id": novel_id,
                "chapter_outline": "开篇章节，主角登场亮相",
                "word_count": 2000
            }
        )
        assert continue_response.status_code == status.HTTP_200_OK

        # 5. 扩写文本
        expand_response = client.post(
            "/api/ai/expand",
            headers=headers,
            json={
                "text": "他走进了房间",
                "style": "详细描写",
                "word_count": 500
            }
        )
        assert expand_response.status_code == status.HTTP_200_OK
