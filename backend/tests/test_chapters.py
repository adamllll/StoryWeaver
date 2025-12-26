"""章节 API 测试"""
import pytest


class TestListChapters:
    """章节列表测试"""

    @pytest.mark.unit
    def test_list_chapters(self, client, test_novel, test_chapter, auth_headers):
        """测试获取章节列表"""
        response = client.get(
            f"/api/novels/{test_novel.id}/chapters",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["novel_id"] == test_novel.id
        assert data["total"] >= 1
        assert len(data["chapters"]) >= 1

    @pytest.mark.unit
    def test_list_chapters_empty(self, client, db, test_user, auth_headers):
        """测试空章节列表"""
        from app.models import Novel

        novel = Novel(
            user_id=test_user.id,
            title="无章节小说",
            category="玄幻",
            status="draft",
        )
        db.add(novel)
        db.commit()
        db.refresh(novel)

        response = client.get(
            f"/api/novels/{novel.id}/chapters",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["chapters"] == []


class TestCreateChapter:
    """创建章节测试"""

    @pytest.mark.unit
    def test_create_chapter(self, client, test_novel, auth_headers):
        """测试创建章节成功"""
        response = client.post(
            f"/api/novels/{test_novel.id}/chapters",
            headers=auth_headers,
            json={
                "title": "新章节",
                "content": "这是新章节的内容",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "新章节"
        assert data["content"] == "这是新章节的内容"

    @pytest.mark.unit
    def test_create_chapter_without_auth(self, client, test_novel):
        """测试未认证创建章节"""
        response = client.post(
            f"/api/novels/{test_novel.id}/chapters",
            json={"title": "新章节"},
        )
        assert response.status_code == 401

    @pytest.mark.unit
    def test_create_chapter_not_owner(self, client, test_novel, test_user2, db):
        """测试非作者创建章节"""
        from app.utils.auth import create_token

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post(
            f"/api/novels/{test_novel.id}/chapters",
            headers=headers,
            json={"title": "新章节"},
        )
        assert response.status_code == 403


class TestGetChapter:
    """获取章节详情测试"""

    @pytest.mark.unit
    def test_get_chapter(self, client, test_novel, test_chapter, auth_headers):
        """测试获取章节详情"""
        response = client.get(
            f"/api/novels/{test_novel.id}/chapters/{test_chapter.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_chapter.id
        assert data["title"] == test_chapter.title

    @pytest.mark.unit
    def test_get_chapter_nonexistent(self, client, test_novel, auth_headers):
        """测试获取不存在的章节"""
        response = client.get(
            f"/api/novels/{test_novel.id}/chapters/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestUpdateChapter:
    """更新章节测试"""

    @pytest.mark.unit
    def test_update_chapter(self, client, test_novel, test_chapter, auth_headers):
        """测试更新章节"""
        response = client.put(
            f"/api/novels/{test_novel.id}/chapters/{test_chapter.id}",
            headers=auth_headers,
            json={
                "title": "更新后的标题",
                "content": "更新后的内容",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "更新后的标题"
        assert data["content"] == "更新后的内容"

    @pytest.mark.unit
    def test_update_chapter_not_owner(
        self, client, test_novel, test_chapter, test_user2, db
    ):
        """测试非作者更新章节"""
        from app.utils.auth import create_token

        token = create_token(test_user2.id)
        headers = {"Authorization": f"Bearer {token}"}

        response = client.put(
            f"/api/novels/{test_novel.id}/chapters/{test_chapter.id}",
            headers=headers,
            json={"title": "非法更新"},
        )
        assert response.status_code == 403


class TestDeleteChapter:
    """删除章节测试"""

    @pytest.mark.unit
    def test_delete_chapter(self, client, db, test_novel, auth_headers):
        """测试删除章节"""
        from app.models import Chapter

        chapter = Chapter(
            novel_id=test_novel.id,
            title="待删除章节",
            content="内容",
            order_num=99,
        )
        db.add(chapter)
        db.commit()
        db.refresh(chapter)

        response = client.delete(
            f"/api/novels/{test_novel.id}/chapters/{chapter.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204


class TestReorderChapters:
    """章节重排序测试"""

    @pytest.mark.unit
    def test_reorder_chapters(self, client, db, test_novel, auth_headers):
        """测试重排序章节"""
        from app.models import Chapter

        ch1 = Chapter(novel_id=test_novel.id, title="章节1", order_num=1)
        ch2 = Chapter(novel_id=test_novel.id, title="章节2", order_num=2)
        db.add_all([ch1, ch2])
        db.commit()
        db.refresh(ch1)
        db.refresh(ch2)

        # 反转顺序
        response = client.put(
            f"/api/novels/{test_novel.id}/chapters/reorder",
            headers=auth_headers,
            json={"chapter_ids": [ch2.id, ch1.id]},
        )
        assert response.status_code == 200


class TestChapterFlow:
    """章节完整流程集成测试"""

    @pytest.mark.integration
    def test_chapter_crud_flow(self, client, test_novel, auth_headers):
        """测试章节 CRUD 完整流程"""
        # 创建
        create_resp = client.post(
            f"/api/novels/{test_novel.id}/chapters",
            headers=auth_headers,
            json={"title": "流程测试章节", "content": "初始内容"},
        )
        assert create_resp.status_code == 201
        chapter_id = create_resp.json()["id"]

        # 读取
        get_resp = client.get(
            f"/api/novels/{test_novel.id}/chapters/{chapter_id}",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200

        # 更新
        update_resp = client.put(
            f"/api/novels/{test_novel.id}/chapters/{chapter_id}",
            headers=auth_headers,
            json={"title": "更新后标题"},
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["title"] == "更新后标题"

        # 删除
        delete_resp = client.delete(
            f"/api/novels/{test_novel.id}/chapters/{chapter_id}",
            headers=auth_headers,
        )
        assert delete_resp.status_code == 204
