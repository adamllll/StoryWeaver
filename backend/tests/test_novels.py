"""小说API测试"""
import pytest
from fastapi import status
from app.models.novel import Novel


@pytest.fixture(autouse=True)
def clean_novels(db):
    """每个测试前清理小说数据"""
    db.query(Novel).delete()
    db.commit()
    yield


@pytest.mark.unit
class TestListNovels:
    """小说列表测试"""

    def test_list_novels_empty(self, client):
        """测试空列表"""
        response = client.get("/api/novels")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert data["novels"] == []

    def test_list_published_novels(self, client, published_novel):
        """测试列出已发布小说"""
        response = client.get("/api/novels")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["novels"][0]["id"] == published_novel.id
        assert data["novels"][0]["status"] == "published"

    def test_list_novels_hide_draft(self, client, test_novel, published_novel):
        """测试默认不显示草稿"""
        response = client.get("/api/novels")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert all(n["status"] == "published" for n in data["novels"])

    def test_list_novels_by_category(self, client, published_novel):
        """测试按分类筛选"""
        response = client.get(f"/api/novels?category={published_novel.category}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["novels"][0]["category"] == published_novel.category

    def test_list_novels_by_user(self, client, test_user, test_novel, auth_headers):
        """测试按作者筛选（显示自己的草稿）"""
        response = client.get(f"/api/novels?user_id={test_user.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["novels"][0]["id"] == test_novel.id

    def test_list_novels_pagination(self, client, auth_headers):
        """测试分页"""
        # 通过 API 创建多个已发布小说
        created_ids = []
        for i in range(15):
            response = client.post(
                "/api/novels",
                headers=auth_headers,
                json={"title": f"分页测试小说{i}", "category": "玄幻"}
            )
            novel_id = response.json()["id"]
            created_ids.append(novel_id)
            # 发布小说
            client.post(f"/api/novels/{novel_id}/publish", headers=auth_headers, json={"publish": True})

        # 第一页
        response = client.get("/api/novels?page=1&page_size=10")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 15
        assert len(data["novels"]) == 10
        assert data["page"] == 1

        # 第二页
        response = client.get("/api/novels?page=2&page_size=10")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["novels"]) >= 5


@pytest.mark.unit
class TestCreateNovel:
    """创建小说测试"""

    def test_create_novel_success(self, client, auth_headers):
        """测试成功创建小说"""
        response = client.post(
            "/api/novels",
            headers=auth_headers,
            json={
                "title": "新小说",
                "description": "这是一个新小说",
                "category": "科幻"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "新小说"
        assert data["category"] == "科幻"
        assert data["status"] == "draft"

    def test_create_novel_without_auth(self, client):
        """测试未认证创建小说"""
        response = client.post(
            "/api/novels",
            json={"title": "新小说", "category": "科幻"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
class TestGetNovel:
    """获取小说详情测试"""

    def test_get_published_novel(self, client, published_novel):
        """测试获取已发布小说"""
        response = client.get(f"/api/novels/{published_novel.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == published_novel.id
        assert data["title"] == published_novel.title

    def test_get_draft_novel_as_owner(self, client, test_novel, auth_headers):
        """测试作者获取自己的草稿"""
        response = client.get(f"/api/novels/{test_novel.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "draft"

    def test_get_draft_novel_as_guest(self, client, test_novel):
        """测试访客无法获取草稿"""
        response = client.get(f"/api/novels/{test_novel.id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_nonexistent_novel(self, client):
        """测试获取不存在的小说"""
        response = client.get("/api/novels/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
class TestUpdateNovel:
    """更新小说测试"""

    def test_update_novel_success(self, client, test_novel, auth_headers):
        """测试成功更新小说"""
        response = client.put(
            f"/api/novels/{test_novel.id}",
            headers=auth_headers,
            json={"title": "更新后的标题", "description": "更新后的描述"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "更新后的标题"
        assert data["description"] == "更新后的描述"

    def test_update_novel_without_auth(self, client, test_novel):
        """测试未认证更新小说"""
        response = client.put(
            f"/api/novels/{test_novel.id}",
            json={"title": "更新后的标题"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_novel_not_owner(self, client, test_novel, test_user2):
        """测试非作者更新小说"""
        from app.utils.auth import create_token
        other_token = create_token(test_user2.id)
        response = client.put(
            f"/api/novels/{test_novel.id}",
            headers={"Authorization": f"Bearer {other_token}"},
            json={"title": "更新后的标题"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_nonexistent_novel(self, client, auth_headers):
        """测试更新不存在的小说"""
        response = client.put(
            "/api/novels/99999",
            headers=auth_headers,
            json={"title": "更新后的标题"}
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
class TestPublishNovel:
    """发布小说测试"""

    def test_publish_novel_success(self, client, test_novel, auth_headers):
        """测试成功发布小说（使用布尔值）"""
        response = client.post(
            f"/api/novels/{test_novel.id}/publish",
            headers=auth_headers,
            json={"publish": True}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "published"

    def test_unpublish_novel(self, client, published_novel, auth_headers):
        """测试取消发布小说（使用布尔值）"""
        response = client.post(
            f"/api/novels/{published_novel.id}/publish",
            headers=auth_headers,
            json={"publish": False}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "draft"

    def test_toggle_publish_status_multiple_times(self, client, test_novel, auth_headers):
        """测试多次切换发布状态"""
        # 发布
        response1 = client.post(
            f"/api/novels/{test_novel.id}/publish",
            headers=auth_headers,
            json={"publish": True}
        )
        assert response1.json()["status"] == "published"

        # 取消发布
        response2 = client.post(
            f"/api/novels/{test_novel.id}/publish",
            headers=auth_headers,
            json={"publish": False}
        )
        assert response2.json()["status"] == "draft"

        # 再次发布
        response3 = client.post(
            f"/api/novels/{test_novel.id}/publish",
            headers=auth_headers,
            json={"publish": True}
        )
        assert response3.json()["status"] == "published"

    def test_publish_novel_not_owner(self, client, test_novel, test_user2):
        """测试非作者发布小说"""
        from app.utils.auth import create_token
        other_token = create_token(test_user2.id)
        response = client.post(
            f"/api/novels/{test_novel.id}/publish",
            headers={"Authorization": f"Bearer {other_token}"},
            json={"publish": True}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.unit
class TestDeleteNovel:
    """删除小说测试"""

    def test_delete_novel_success(self, client, test_novel, auth_headers):
        """测试成功删除小说"""
        response = client.delete(f"/api/novels/{test_novel.id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # 验证已删除
        get_response = client.get(f"/api/novels/{test_novel.id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_novel_not_owner(self, client, test_novel, test_user2):
        """测试非作者删除小说"""
        from app.utils.auth import create_token
        other_token = create_token(test_user2.id)
        response = client.delete(
            f"/api/novels/{test_novel.id}",
            headers={"Authorization": f"Bearer {other_token}"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_nonexistent_novel(self, client, auth_headers):
        """测试删除不存在的小说"""
        response = client.delete("/api/novels/99999", headers=auth_headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestNovelFlow:
    """小说完整流程测试"""

    def test_create_update_publish_delete_flow(self, client, auth_headers):
        """测试创建-更新-发布-删除流程"""
        # 1. 创建小说
        create_response = client.post(
            "/api/novels",
            headers=auth_headers,
            json={
                "title": "流程测试小说",
                "description": "测试描述",
                "category": "玄幻"
            }
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        novel_id = create_response.json()["id"]

        # 2. 更新小说
        update_response = client.put(
            f"/api/novels/{novel_id}",
            headers=auth_headers,
            json={"title": "更新后的标题"}
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["title"] == "更新后的标题"

        # 3. 发布小说
        publish_response = client.post(
            f"/api/novels/{novel_id}/publish",
            headers=auth_headers,
            json={"publish": True}
        )
        assert publish_response.status_code == status.HTTP_200_OK
        assert publish_response.json()["status"] == "published"

        # 4. 验证在列表中可见
        list_response = client.get("/api/novels")
        assert list_response.status_code == status.HTTP_200_OK
        assert any(n["id"] == novel_id for n in list_response.json()["novels"])

        # 5. 删除小说
        delete_response = client.delete(f"/api/novels/{novel_id}", headers=auth_headers)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
