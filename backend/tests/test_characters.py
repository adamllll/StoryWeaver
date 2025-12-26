"""角色和世界观 API 测试"""
import pytest


@pytest.mark.unit
class TestListCharacters:
    """角色列表测试"""

    def test_list_characters(self, client, test_novel, test_character, auth_headers):
        """测试获取角色列表"""
        response = client.get(
            f"/api/novels/{test_novel.id}/characters",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["novel_id"] == test_novel.id
        assert data["total"] >= 1
        assert len(data["characters"]) >= 1

    def test_list_characters_empty(self, client, db, test_user, auth_headers):
        """测试空角色列表"""
        from app.models import Novel

        novel = Novel(
            user_id=test_user.id,
            title="无角色小说",
            category="玄幻",
            status="draft",
        )
        db.add(novel)
        db.commit()
        db.refresh(novel)

        response = client.get(
            f"/api/novels/{novel.id}/characters",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["characters"] == []

    def test_list_characters_published_novel(self, client, published_novel):
        """测试访客可查看已发布小说的角色"""
        response = client.get(f"/api/novels/{published_novel.id}/characters")
        assert response.status_code == 200


@pytest.mark.unit
class TestCreateCharacter:
    """创建角色测试"""

    def test_create_character(self, client, test_novel, auth_headers):
        """测试创建角色成功"""
        response = client.post(
            f"/api/novels/{test_novel.id}/characters",
            headers=auth_headers,
            json={
                "name": "新角色",
                "role_type": "主角",
                "description": "这是一个新角色",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "新角色"
        assert data["role_type"] == "主角"
        assert data["description"] == "这是一个新角色"

    def test_create_character_without_auth(self, client, test_novel):
        """测试未认证创建角色"""
        response = client.post(
            f"/api/novels/{test_novel.id}/characters",
            json={"name": "新角色", "role_type": "主角"},
        )
        assert response.status_code == 401

    def test_create_character_not_owner(self, client, test_novel, test_user2):
        """测试非作者创建角色"""
        from app.utils.auth import create_token

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post(
            f"/api/novels/{test_novel.id}/characters",
            headers=headers,
            json={"name": "新角色", "role_type": "主角"},
        )
        assert response.status_code == 403


@pytest.mark.unit
class TestGetCharacter:
    """获取角色详情测试"""

    def test_get_character(self, client, test_novel, test_character, auth_headers):
        """测试获取角色详情"""
        response = client.get(
            f"/api/novels/{test_novel.id}/characters/{test_character.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_character.id
        assert data["name"] == test_character.name

    def test_get_character_nonexistent(self, client, test_novel, auth_headers):
        """测试获取不存在的角色"""
        response = client.get(
            f"/api/novels/{test_novel.id}/characters/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.unit
class TestUpdateCharacter:
    """更新角色测试"""

    def test_update_character(self, client, test_novel, test_character, auth_headers):
        """测试更新角色"""
        response = client.put(
            f"/api/novels/{test_novel.id}/characters/{test_character.id}",
            headers=auth_headers,
            json={
                "name": "更新后的角色",
                "description": "更新后的描述",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "更新后的角色"
        assert data["description"] == "更新后的描述"

    def test_update_character_not_owner(
        self, client, test_novel, test_character, test_user2
    ):
        """测试非作者更新角色"""
        from app.utils.auth import create_token

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.put(
            f"/api/novels/{test_novel.id}/characters/{test_character.id}",
            headers=headers,
            json={"name": "非法更新"},
        )
        assert response.status_code == 403


@pytest.mark.unit
class TestDeleteCharacter:
    """删除角色测试"""

    def test_delete_character(self, client, db, test_novel, auth_headers):
        """测试删除角色"""
        from app.models import Character

        character = Character(
            novel_id=test_novel.id,
            name="待删除角色",
            role_type="配角",
            description="待删除",
        )
        db.add(character)
        db.commit()
        db.refresh(character)

        response = client.delete(
            f"/api/novels/{test_novel.id}/characters/{character.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    def test_delete_character_not_owner(
        self, client, test_novel, test_character, test_user2
    ):
        """测试非作者删除角色"""
        from app.utils.auth import create_token

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.delete(
            f"/api/novels/{test_novel.id}/characters/{test_character.id}",
            headers=headers,
        )
        assert response.status_code == 403


@pytest.mark.unit
class TestListWorldSettings:
    """世界观列表测试"""

    def test_list_world_settings(self, client, test_novel, auth_headers):
        """测试获取世界观列表"""
        response = client.get(
            f"/api/novels/{test_novel.id}/world-settings",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["novel_id"] == test_novel.id
        assert "world_settings" in data
        assert "total" in data

    def test_list_world_settings_empty(self, client, test_novel, auth_headers):
        """测试空世界观列表"""
        response = client.get(
            f"/api/novels/{test_novel.id}/world-settings",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["world_settings"] == []


@pytest.mark.unit
class TestCreateWorldSetting:
    """创建世界观测试"""

    def test_create_world_setting(self, client, test_novel, auth_headers):
        """测试创建世界观成功"""
        response = client.post(
            f"/api/novels/{test_novel.id}/world-settings",
            headers=auth_headers,
            json={
                "setting_type": "力量体系",
                "name": "修炼体系",
                "description": "炼气、筑基、金丹",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "修炼体系"
        assert data["setting_type"] == "力量体系"

    def test_create_world_setting_without_auth(self, client, test_novel):
        """测试未认证创建世界观"""
        response = client.post(
            f"/api/novels/{test_novel.id}/world-settings",
            json={"setting_type": "力量体系", "name": "修炼体系"},
        )
        assert response.status_code == 401

    def test_create_world_setting_not_owner(self, client, test_novel, test_user2):
        """测试非作者创建世界观"""
        from app.utils.auth import create_token

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post(
            f"/api/novels/{test_novel.id}/world-settings",
            headers=headers,
            json={"setting_type": "力量体系", "name": "修炼体系"},
        )
        assert response.status_code == 403


@pytest.mark.unit
class TestGetWorldSetting:
    """获取世界观详情测试"""

    def test_get_world_setting(self, client, db, test_novel, auth_headers):
        """测试获取世界观详情"""
        from app.models import WorldSetting

        setting = WorldSetting(
            novel_id=test_novel.id,
            setting_type="地理",
            name="地理设定",
            description="大陆分为东西南北四域",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

        response = client.get(
            f"/api/novels/{test_novel.id}/world-settings/{setting.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == setting.id
        assert data["name"] == setting.name

    def test_get_world_setting_nonexistent(self, client, test_novel, auth_headers):
        """测试获取不存在的世界观"""
        response = client.get(
            f"/api/novels/{test_novel.id}/world-settings/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.unit
class TestUpdateWorldSetting:
    """更新世界观测试"""

    def test_update_world_setting(self, client, db, test_novel, auth_headers):
        """测试更新世界观"""
        from app.models import WorldSetting

        setting = WorldSetting(
            novel_id=test_novel.id,
            setting_type="力量体系",
            name="原始设定",
            description="原始描述",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

        response = client.put(
            f"/api/novels/{test_novel.id}/world-settings/{setting.id}",
            headers=auth_headers,
            json={
                "name": "更新后的设定",
                "description": "更新后的描述",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "更新后的设定"
        assert data["description"] == "更新后的描述"

    def test_update_world_setting_not_owner(
        self, client, db, test_novel, test_user2, auth_headers
    ):
        """测试非作者更新世界观"""
        from app.models import WorldSetting
        from app.utils.auth import create_token

        setting = WorldSetting(
            novel_id=test_novel.id,
            setting_type="力量体系",
            name="原始设定",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.put(
            f"/api/novels/{test_novel.id}/world-settings/{setting.id}",
            headers=headers,
            json={"name": "非法更新"},
        )
        assert response.status_code == 403


@pytest.mark.unit
class TestDeleteWorldSetting:
    """删除世界观测试"""

    def test_delete_world_setting(self, client, db, test_novel, auth_headers):
        """测试删除世界观"""
        from app.models import WorldSetting

        setting = WorldSetting(
            novel_id=test_novel.id,
            setting_type="力量体系",
            name="待删除设定",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

        response = client.delete(
            f"/api/novels/{test_novel.id}/world-settings/{setting.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    def test_delete_world_setting_not_owner(
        self, client, db, test_novel, test_user2, auth_headers
    ):
        """测试非作者删除世界观"""
        from app.models import WorldSetting
        from app.utils.auth import create_token

        setting = WorldSetting(
            novel_id=test_novel.id,
            setting_type="力量体系",
            name="待删除设定",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.delete(
            f"/api/novels/{test_novel.id}/world-settings/{setting.id}",
            headers=headers,
        )
        assert response.status_code == 403


@pytest.mark.integration
class TestCharacterFlow:
    """角色完整流程集成测试"""

    def test_character_crud_flow(self, client, test_novel, auth_headers):
        """测试角色 CRUD 完整流程"""
        # 创建
        create_resp = client.post(
            f"/api/novels/{test_novel.id}/characters",
            headers=auth_headers,
            json={
                "name": "流程测试角色",
                "role_type": "主角",
                "description": "初始描述",
            },
        )
        assert create_resp.status_code == 201
        character_id = create_resp.json()["id"]

        # 读取
        get_resp = client.get(
            f"/api/novels/{test_novel.id}/characters/{character_id}",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200

        # 更新
        update_resp = client.put(
            f"/api/novels/{test_novel.id}/characters/{character_id}",
            headers=auth_headers,
            json={"name": "更新后角色名"},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["name"] == "更新后角色名"

        # 删除
        delete_resp = client.delete(
            f"/api/novels/{test_novel.id}/characters/{character_id}",
            headers=auth_headers,
        )
        assert delete_resp.status_code == 204


@pytest.mark.integration
class TestWorldSettingFlow:
    """世界观完整流程集成测试"""

    def test_world_setting_crud_flow(self, client, test_novel, auth_headers):
        """测试世界观 CRUD 完整流程"""
        # 创建
        create_resp = client.post(
            f"/api/novels/{test_novel.id}/world-settings",
            headers=auth_headers,
            json={
                "setting_type": "力量体系",
                "name": "流程测试设定",
                "description": "初始描述",
            },
        )
        assert create_resp.status_code == 201
        setting_id = create_resp.json()["id"]

        # 读取
        get_resp = client.get(
            f"/api/novels/{test_novel.id}/world-settings/{setting_id}",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200

        # 更新
        update_resp = client.put(
            f"/api/novels/{test_novel.id}/world-settings/{setting_id}",
            headers=auth_headers,
            json={"name": "更新后设定名"},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["name"] == "更新后设定名"

        # 删除
        delete_resp = client.delete(
            f"/api/novels/{test_novel.id}/world-settings/{setting_id}",
            headers=auth_headers,
        )
        assert delete_resp.status_code == 204
