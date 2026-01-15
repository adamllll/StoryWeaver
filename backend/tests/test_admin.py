"""管理员功能测试"""
import pytest
from datetime import datetime, timezone


class TestAdminPermission:
    """管理员权限测试"""

    def test_non_admin_cannot_access_admin_api(self, client, auth_headers):
        """非管理员无法访问管理员 API"""
        response = client.get("/api/admin/users", headers=auth_headers)
        assert response.status_code == 403
        assert "管理员权限" in response.json()["detail"]

    def test_admin_can_access_admin_api(self, client, admin_headers):
        """管理员可以访问管理员 API"""
        response = client.get("/api/admin/users", headers=admin_headers)
        assert response.status_code == 200


class TestUserManagement:
    """用户管理测试"""

    def test_list_users(self, client, admin_headers, test_user):
        """获取用户列表"""
        response = client.get("/api/admin/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_list_users_with_search(self, client, admin_headers, test_user):
        """搜索用户"""
        response = client.get(
            f"/api/admin/users?search={test_user.username[:4]}",
            headers=admin_headers
        )
        assert response.status_code == 200

    def test_get_user_detail(self, client, admin_headers, test_user):
        """获取用户详情"""
        response = client.get(f"/api/admin/users/{test_user.id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username

    def test_disable_user(self, client, admin_headers, test_user):
        """禁用用户"""
        response = client.patch(
            f"/api/admin/users/{test_user.id}/status",
            json={"is_active": False},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["is_active"] == False

    def test_enable_user(self, client, admin_headers, test_user, db):
        """启用用户"""
        # 先禁用
        test_user.is_active = False
        db.commit()

        response = client.patch(
            f"/api/admin/users/{test_user.id}/status",
            json={"is_active": True},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["is_active"] == True

    def test_cannot_disable_self(self, client, admin_headers, admin_user):
        """不能禁用自己"""
        response = client.patch(
            f"/api/admin/users/{admin_user.id}/status",
            json={"is_active": False},
            headers=admin_headers
        )
        assert response.status_code == 400
        assert "自己" in response.json()["detail"]

    def test_set_admin(self, client, admin_headers, test_user):
        """设置管理员权限"""
        response = client.patch(
            f"/api/admin/users/{test_user.id}/admin",
            json={"is_admin": True},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["is_admin"] == True

    def test_delete_user(self, client, admin_headers, test_user):
        """软删除用户"""
        response = client.delete(
            f"/api/admin/users/{test_user.id}",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["deleted_at"] is not None

    def test_cannot_delete_self(self, client, admin_headers, admin_user):
        """不能删除自己"""
        response = client.delete(
            f"/api/admin/users/{admin_user.id}",
            headers=admin_headers
        )
        assert response.status_code == 400

    def test_restore_user(self, client, admin_headers, test_user, db):
        """恢复已删除用户"""
        # 先删除
        test_user.deleted_at = datetime.now(timezone.utc)
        test_user.is_active = False
        db.commit()

        response = client.post(
            f"/api/admin/users/{test_user.id}/restore",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["deleted_at"] is None
        assert response.json()["is_active"] == True


class TestNovelManagement:
    """小说管理测试"""

    def test_list_novels(self, client, admin_headers, test_novel):
        """获取小说列表"""
        response = client.get("/api/admin/novels", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "novels" in data
        assert "total" in data

    def test_update_novel_status(self, client, admin_headers, test_novel):
        """更新小说状态"""
        response = client.patch(
            f"/api/admin/novels/{test_novel.id}/status",
            json={"status": "published"},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "published"

    def test_delete_novel(self, client, admin_headers, test_novel):
        """软删除小说"""
        response = client.delete(
            f"/api/admin/novels/{test_novel.id}",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["deleted_at"] is not None

    def test_restore_novel(self, client, admin_headers, test_novel, db):
        """恢复已删除小说"""
        test_novel.deleted_at = datetime.now(timezone.utc)
        db.commit()

        response = client.post(
            f"/api/admin/novels/{test_novel.id}/restore",
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["deleted_at"] is None


class TestBatchOperations:
    """批量操作测试"""

    def test_batch_delete_users(self, client, admin_headers, test_user, test_user2):
        """批量删除用户"""
        response = client.post(
            "/api/admin/users/batch/delete",
            json={"user_ids": [test_user.id, test_user2.id]},
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2
        assert data["failed_count"] == 0

    def test_batch_disable_users(self, client, admin_headers, test_user, test_user2):
        """批量禁用用户"""
        response = client.post(
            "/api/admin/users/batch/disable",
            json={"user_ids": [test_user.id, test_user2.id]},
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2

    def test_batch_delete_novels(self, client, admin_headers, test_novel, published_novel):
        """批量删除小说"""
        response = client.post(
            "/api/admin/novels/batch/delete",
            json={"novel_ids": [test_novel.id, published_novel.id]},
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2


class TestStatistics:
    """统计功能测试"""

    def test_platform_overview(self, client, admin_headers):
        """平台总览统计"""
        response = client.get("/api/admin/stats/overview", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_novels" in data
        assert "total_chapters" in data

    def test_user_stats(self, client, admin_headers):
        """用户统计"""
        response = client.get("/api/admin/stats/users?days=7", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "daily_registrations" in data
        assert "daily_active_users" in data
        assert "user_role_distribution" in data

    def test_content_stats(self, client, admin_headers):
        """内容统计"""
        response = client.get("/api/admin/stats/content?days=7", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "daily_novels" in data
        assert "daily_chapters" in data
        assert "category_distribution" in data
        assert "top_authors" in data


class TestEnvConfig:
    """ENV 配置管理测试"""

    def test_get_env_config(self, client, admin_headers):
        """获取 ENV 配置"""
        response = client.get("/api/admin/env", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "env_file_path" in data

    def test_update_env_config(self, client, admin_headers):
        """更新 ENV 配置"""
        response = client.patch(
            "/api/admin/env",
            json={"key": "DEBUG", "value": "true"},
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["key"] == "DEBUG"

    def test_update_invalid_env_key(self, client, admin_headers):
        """更新不允许的配置项"""
        response = client.patch(
            "/api/admin/env",
            json={"key": "INVALID_KEY", "value": "test"},
            headers=admin_headers
        )
        assert response.status_code == 400
        assert "不允许" in response.json()["detail"]


class TestAdventureManagement:
    """冒险管理测试"""

    def test_list_adventures(self, client, admin_headers, test_adventure):
        """获取冒险列表"""
        response = client.get("/api/admin/adventures", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "adventures" in data
        assert "total" in data
