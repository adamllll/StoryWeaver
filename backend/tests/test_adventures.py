"""冒险游戏功能测试

测试范围：
1. 冒险 CRUD 操作
2. 游戏核心逻辑（选择判定）
3. 小说导出功能
4. 故事分叉系统
5. 对话持久化
"""

import pytest
from fastapi.testclient import TestClient


class TestAdventureCRUD:
    """测试冒险的基础 CRUD 操作"""

    def test_create_adventure(self, client, auth_headers):
        """测试创建冒险"""
        response = client.post(
            "/api/adventures",
            json={
                "category": "玄幻",
                "keywords": ["修仙", "复仇"],
                "protagonist_name": "李青云",
                "protagonist_gender": "male",
                "protagonist_personality": "冷静、果断",
                "random": False
            },
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] is not None
        assert data["category"] == "玄幻"
        assert data["protagonist_name"] == "李青云"
        assert data["player_state"]["生命值"] == 100
        assert data["player_state"]["灵力"] == 100

    def test_get_adventure(self, client, auth_headers, test_adventure):
        """测试获取冒险详情"""
        response = client.get(
            f"/api/adventures/{test_adventure.id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_adventure.id
        assert data["title"] == test_adventure.title

    def test_get_adventure_not_found(self, client, auth_headers):
        """测试获取不存在的冒险"""
        response = client.get(
            "/api/adventures/99999",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_list_adventures(self, client, auth_headers, test_adventure):
        """测试获取冒险列表"""
        response = client.get(
            "/api/adventures",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_delete_adventure(self, client, auth_headers, test_adventure):
        """测试删除冒险"""
        response = client.delete(
            f"/api/adventures/{test_adventure.id}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # 验证已删除
        response = client.get(
            f"/api/adventures/{test_adventure.id}",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestExportFunctionality:
    """测试小说导出功能"""

    def test_finish_adventure(self, client, auth_headers, test_adventure_with_nodes, mock_ai_service):
        """测试结束冒险"""
        response = client.post(
            f"/api/adventures/{test_adventure_with_nodes.id}/finish",
            json={"ending_type": "happy"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Adventure finished successfully"
        assert data["ending_type"] == "happy"
        assert "novel" in data
        assert data["novel"]["total_chapters"] == 4

    def test_finish_already_finished_adventure(self, client, auth_headers, db, test_adventure):
        """测试结束已完成的冒险（应该失败）"""
        # 先标记为已完成
        test_adventure.is_finished = True
        db.commit()

        response = client.post(
            f"/api/adventures/{test_adventure.id}/finish",
            json={"ending_type": "happy"},
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "already finished" in response.json()["detail"]

    def test_export_adventure_txt(self, client, auth_headers, test_adventure_with_nodes):
        """测试导出为 TXT 格式"""
        response = client.get(
            f"/api/adventures/{test_adventure_with_nodes.id}/export?format=txt",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"
        assert "attachment" in response.headers["content-disposition"]

        content = response.text
        assert "完整冒险" in content
        assert "第1章" in content
        assert "第2章" in content
        assert "第3章" in content

    def test_export_adventure_markdown(self, client, auth_headers, test_adventure_with_nodes):
        """测试导出为 Markdown 格式"""
        response = client.get(
            f"/api/adventures/{test_adventure_with_nodes.id}/export?format=md",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert "text/markdown" in response.headers["content-type"]

        content = response.text
        assert "# 完整冒险" in content
        assert "## 主角信息" in content

    def test_export_unsupported_format(self, client, auth_headers, test_adventure_with_nodes):
        """测试导出不支持的格式"""
        response = client.get(
            f"/api/adventures/{test_adventure_with_nodes.id}/export?format=pdf",
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "Unsupported format" in response.json()["detail"]

    def test_get_adventure_summary(self, client, auth_headers, test_adventure_with_nodes):
        """测试获取冒险摘要"""
        response = client.get(
            f"/api/adventures/{test_adventure_with_nodes.id}/summary",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "完整冒险" in data["summary"]


class TestForkFunctionality:
    """测试故事分叉功能"""

    def test_explore_adventures(self, client, auth_headers, test_user2, db):
        """测试浏览社区冒险"""
        # 创建另一个用户的冒险
        from app.models.adventure import Adventure
        other_adventure = Adventure(
            player_id=test_user2.id,
            title="其他人的冒险",
            category="言情",
            keywords=["爱情"],
            protagonist_name="女主",
            protagonist_gender="female",
            player_state={"生命值": 100, "最大生命值": 100},
            total_nodes=1
        )
        db.add(other_adventure)
        db.commit()

        response = client.get(
            "/api/adventures/explore",
            headers=auth_headers
        )

        # Debug: print response if failed
        if response.status_code != 200:
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # 应该能看到其他人的冒险
        assert any(adv["title"] == "其他人的冒险" for adv in data)

    def test_get_fork_points(self, client, auth_headers, test_adventure_with_nodes):
        """测试获取分叉点"""
        response = client.get(
            f"/api/adventures/{test_adventure_with_nodes.id}/fork-points",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "fork_points" in data
        assert len(data["fork_points"]) == 3  # 3个节点

    def test_fork_adventure(self, client, auth_headers, test_user2, db, test_adventure_with_nodes):
        """测试分叉冒险"""
        from app.models.adventure import StoryNode
        from app.utils.auth import create_token

        # 获取第二个节点
        node = db.query(StoryNode).filter(
            StoryNode.adventure_id == test_adventure_with_nodes.id,
            StoryNode.chapter_num == 2
        ).first()

        # 使用第二个用户的 token
        user2_token = create_token(test_user2.id)
        user2_headers = {"Authorization": f"Bearer {user2_token}"}

        response = client.post(
            f"/api/adventures/{test_adventure_with_nodes.id}/fork",
            json={"fork_from_node_id": node.id},
            headers=user2_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["parent_adventure_id"] == test_adventure_with_nodes.id
        assert data["fork_from_node_id"] == node.id
        assert data["total_nodes"] == 2  # 复制了前2章

    def test_fork_own_adventure(self, client, auth_headers, test_adventure_with_nodes, db):
        """测试分叉自己的冒险（应该失败）"""
        from app.models.adventure import StoryNode

        node = db.query(StoryNode).filter(
            StoryNode.adventure_id == test_adventure_with_nodes.id
        ).first()

        assert node is not None, "Should have at least one node"

        response = client.post(
            f"/api/adventures/{test_adventure_with_nodes.id}/fork",
            json={"fork_from_node_id": node.id},
            headers=auth_headers
        )

        assert response.status_code == 403
        assert "Cannot fork from your own adventure" in response.json()["detail"]

    def test_get_adventure_tree(self, client, auth_headers, test_adventure_with_nodes):
        """测试获取分支树"""
        response = client.get(
            f"/api/adventures/{test_adventure_with_nodes.id}/tree",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "tree" in data
        assert "total_forks" in data
        assert data["tree"]["id"] == test_adventure_with_nodes.id


class TestConversationPersistence:
    """测试对话持久化功能"""

    def test_create_conversation(self, client, auth_headers, test_adventure):
        """测试创建对话"""
        response = client.put(
            f"/api/conversations/{test_adventure.id}",
            json={
                "messages": [
                    {"role": "user", "content": "开始冒险"},
                    {"role": "assistant", "content": "欢迎来到修仙世界"}
                ]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 2

    def test_update_conversation(self, client, auth_headers, test_conversation):
        """测试更新对话"""
        response = client.put(
            f"/api/conversations/{test_conversation.adventure_id}",
            json={
                "messages": [
                    {"role": "user", "content": "开始冒险"},
                    {"role": "assistant", "content": "欢迎来到修仙世界"},
                    {"role": "user", "content": "我选择探索"}
                ]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 3

    def test_get_conversation(self, client, auth_headers, test_conversation):
        """测试获取对话"""
        response = client.get(
            f"/api/conversations/{test_conversation.adventure_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 2

    def test_delete_conversation(self, client, auth_headers, test_conversation):
        """测试删除对话"""
        response = client.delete(
            f"/api/conversations/{test_conversation.adventure_id}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # 验证已删除
        response = client.get(
            f"/api/conversations/{test_conversation.adventure_id}",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_create_standalone_conversation(self, client, auth_headers):
        """测试创建独立对话"""
        response = client.post(
            "/api/conversations/standalone",
            json={
                "messages": [
                    {"role": "user", "content": "你好"}
                ]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["adventure_id"] is None
        assert len(data["messages"]) == 1

    def test_get_user_conversations(self, client, auth_headers, test_conversation):
        """测试获取用户所有对话"""
        response = client.get(
            "/api/conversations/user/all",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0


class TestGameLogic:
    """测试游戏核心逻辑"""

    def test_make_choice_success(self, client, auth_headers, test_adventure, test_story_node, monkeypatch):
        """测试玩家选择（成功）"""
        # Mock 骰子结果为成功
        from app.routers.adventures import gameplay

        def mock_roll_dice(success_rate, difficulty="普通"):
            return 50, True  # 成功

        monkeypatch.setattr(gameplay, "roll_dice", mock_roll_dice)

        response = client.post(
            f"/api/adventures/{test_adventure.id}/choose",
            json={
                "choice_index": 0,
                "choice_text": "探索左侧通道"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["roll_value"] == 50

    def test_make_choice_failure(self, client, auth_headers, test_adventure, test_story_node, monkeypatch):
        """测试玩家选择（失败）"""
        from app.routers.adventures import gameplay

        def mock_roll_dice(success_rate, difficulty="普通"):
            return 80, False  # 失败

        monkeypatch.setattr(gameplay, "roll_dice", mock_roll_dice)

        response = client.post(
            f"/api/adventures/{test_adventure.id}/choose",
            json={
                "choice_index": 1,
                "choice_text": "强闯中间通道"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["roll_value"] == 80

    def test_make_choice_invalid_index(self, client, auth_headers, test_adventure, test_story_node):
        """测试无效的选择索引"""
        response = client.post(
            f"/api/adventures/{test_adventure.id}/choose",
            json={
                "choice_index": 99,
                "choice_text": "不存在的选项"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "Invalid choice index" in response.json()["detail"]

    def test_make_choice_finished_adventure(self, client, auth_headers, db, test_adventure, test_story_node):
        """测试在已完成的冒险中选择（应该失败）"""
        test_adventure.is_finished = True
        db.commit()

        response = client.post(
            f"/api/adventures/{test_adventure.id}/choose",
            json={
                "choice_index": 0,
                "choice_text": "探索左侧通道"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "already finished" in response.json()["detail"]


class TestEdgeCases:
    """测试边界条件"""

    def test_export_empty_adventure(self, client, auth_headers, test_adventure):
        """测试导出空冒险（无节点）"""
        response = client.get(
            f"/api/adventures/{test_adventure.id}/export?format=txt",
            headers=auth_headers
        )

        # 应该返回错误或空内容
        assert response.status_code in [400, 500]

    def test_fork_nonexistent_node(self, client, auth_headers, test_adventure):
        """测试分叉不存在的节点"""
        response = client.post(
            f"/api/adventures/{test_adventure.id}/fork",
            json={"fork_from_node_id": 99999},
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_conversation_too_many_messages(self, client, auth_headers, test_adventure):
        """测试过多消息（如果有限制）"""
        # 创建 1001 条消息
        messages = [
            {"role": "user" if i % 2 == 0 else "assistant", "content": f"消息{i}"}
            for i in range(1001)
        ]

        response = client.put(
            f"/api/conversations/{test_adventure.id}",
            json={"messages": messages},
            headers=auth_headers
        )

        # 根据实际限制，可能返回 400
        # 如果没有限制，应该成功
        assert response.status_code in [200, 400]


class TestPermissions:
    """测试权限控制"""

    def test_access_other_user_adventure(self, client, test_user2, test_adventure):
        """测试访问其他用户的冒险"""
        from app.utils.auth import create_token

        user2_token = create_token(test_user2.id)
        user2_headers = {"Authorization": f"Bearer {user2_token}"}

        response = client.get(
            f"/api/adventures/{test_adventure.id}",
            headers=user2_headers
        )

        assert response.status_code == 404  # 不应该能访问

    def test_delete_other_user_adventure(self, client, test_user2, test_adventure):
        """测试删除其他用户的冒险"""
        from app.utils.auth import create_token

        user2_token = create_token(test_user2.id)
        user2_headers = {"Authorization": f"Bearer {user2_token}"}

        response = client.delete(
            f"/api/adventures/{test_adventure.id}",
            headers=user2_headers
        )

        assert response.status_code == 404  # 不应该能删除
