"""阅读进度API测试"""
import pytest
from fastapi import status


@pytest.mark.unit
class TestGetReadingProgress:
    """获取阅读进度测试"""

    def test_get_reading_progress_includes_chapter_info(self, client, auth_headers, test_novel, test_chapter, db):
        """测试阅读进度响应包含章节标题和进度百分比"""
        # 先更新阅读进度
        client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": test_chapter.id}
        )

        # 获取进度
        response = client.get(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # 验证基本字段
        assert data["novel_id"] == test_novel.id
        assert "chapter_id" in data or "current_chapter_id" in data  # 支持别名

        # 验证新增字段
        assert "chapter_title" in data
        assert data["chapter_title"] == test_chapter.title
        assert "progress_percentage" in data
        assert 0 <= data["progress_percentage"] <= 100

    def test_get_reading_progress_field_alias_compatibility(self, client, auth_headers, test_novel, test_chapter):
        """测试字段别名兼容性 - chapter_id 和 current_chapter_id"""
        # 设置阅读进度
        client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": test_chapter.id}
        )

        # 获取进度
        response = client.get(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )

        data = response.json()
        # 无论前端请求哪个字段名，都应该能正确解析
        assert data.get("chapter_id") or data.get("current_chapter_id")

    def test_get_reading_progress_calculates_percentage_correctly(self, client, auth_headers, test_novel, db):
        """测试进度百分比计算正确"""
        from app.models.chapter import Chapter

        # 创建3个章节
        chapters = []
        for i in range(1, 4):
            chapter = Chapter(
                novel_id=test_novel.id,
                title=f"第{i}章",
                content=f"内容{i}",
                order_num=i
            )
            db.add(chapter)
            chapters.append(chapter)
        db.commit()
        for ch in chapters:
            db.refresh(ch)

        # 设置阅读进度到第2章
        client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": chapters[1].id}
        )

        # 获取进度
        response = client.get(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )

        data = response.json()
        # 第2章 / 共3章 = 66.67%
        assert data["progress_percentage"] == pytest.approx(66.67, rel=0.01)

    def test_get_reading_progress_not_found(self, client, auth_headers, test_novel):
        """测试获取不存在小说的阅读进度"""
        response = client.get(
            "/api/novels/99999/reading-progress",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_reading_progress_creates_default(self, client, auth_headers, test_novel, test_chapter):
        """测试如果没有进度记录，自动创建默认进度（从第一章开始）"""
        # 直接获取进度（没有先设置）
        response = client.get(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # 应该自动从第一章开始
        assert data["chapter_title"] == test_chapter.title


@pytest.mark.unit
class TestUpdateReadingProgress:
    """更新阅读进度测试"""

    def test_update_reading_progress_success(self, client, auth_headers, test_novel, test_chapter):
        """测试成功更新阅读进度"""
        response = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": test_chapter.id}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["chapter_title"] == test_chapter.title
        assert "progress_percentage" in data

    def test_update_reading_progress_returns_new_fields(self, client, auth_headers, test_novel, test_chapter):
        """测试更新进度响应包含新字段"""
        response = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": test_chapter.id}
        )

        data = response.json()
        # 验证新增字段存在
        assert "chapter_title" in data
        assert "progress_percentage" in data
        assert isinstance(data["progress_percentage"], (int, float))

    def test_update_reading_progress_invalid_chapter(self, client, auth_headers, test_novel):
        """测试更新进度到不存在的章节"""
        response = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": 99999}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_reading_progress_multiple_times(self, client, auth_headers, test_novel, db):
        """测试多次更新阅读进度"""
        from app.models.chapter import Chapter

        # 创建2个章节
        ch1 = Chapter(novel_id=test_novel.id, title="第一章", content="内容1", order_num=1)
        ch2 = Chapter(novel_id=test_novel.id, title="第二章", content="内容2", order_num=2)
        db.add_all([ch1, ch2])
        db.commit()
        db.refresh(ch1)
        db.refresh(ch2)

        # 第一次更新到第一章
        response1 = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": ch1.id}
        )
        assert response1.json()["chapter_title"] == "第一章"

        # 第二次更新到第二章
        response2 = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": ch2.id}
        )
        assert response2.json()["chapter_title"] == "第二章"
        assert response2.json()["progress_percentage"] == 100.0


@pytest.mark.unit
class TestResetReadingProgress:
    """重置阅读进度测试"""

    def test_reset_reading_progress_success(self, client, auth_headers, test_novel, test_chapter):
        """测试成功重置阅读进度"""
        # 先设置进度
        client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": test_chapter.id}
        )

        # 重置进度
        response = client.delete(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_reset_reading_progress_nonexistent(self, client, auth_headers, test_novel):
        """测试重置不存在的阅读进度"""
        # 重置从未设置过的进度（应该成功，不报错）
        response = client.delete(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.unit
class TestChoiceHistory:
    """选择历史测试"""

    def test_get_choice_history_empty(self, client, auth_headers, test_novel):
        """测试获取空的选择历史"""
        response = client.get(
            f"/api/novels/{test_novel.id}/choice-history",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_get_choice_history_returns_list(self, client, auth_headers, test_novel, test_chapter):
        """测试选择历史返回列表格式"""
        # 先设置进度（即使没有选择，也应该返回空列表）
        client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": test_chapter.id}
        )

        response = client.get(
            f"/api/novels/{test_novel.id}/choice-history",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)


@pytest.mark.unit
class TestEndings:
    """结局列表测试"""

    def test_get_endings_list(self, client, auth_headers, test_novel):
        """测试获取结局列表"""
        response = client.get(
            f"/api/novels/{test_novel.id}/endings",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_endings" in data
        assert "unlocked_count" in data
        assert "endings" in data
        assert isinstance(data["endings"], list)

    def test_get_endings_not_found(self, client, auth_headers):
        """测试获取不存在小说的结局列表"""
        response = client.get(
            "/api/novels/99999/endings",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestReadingProgressFlow:
    """阅读进度完整流程测试"""

    def test_complete_reading_progress_flow(self, client, auth_headers, test_novel, db):
        """测试完整的阅读进度流程"""
        from app.models.chapter import Chapter

        # 1. 创建多个章节
        chapters = []
        for i in range(1, 4):
            chapter = Chapter(
                novel_id=test_novel.id,
                title=f"第{i}章",
                content=f"内容{i}",
                order_num=i
            )
            db.add(chapter)
            chapters.append(chapter)
        db.commit()
        for ch in chapters:
            db.refresh(ch)

        # 2. 更新阅读进度到第一章
        update_response = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": chapters[0].id}
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["chapter_title"] == "第1章"
        assert update_response.json()["progress_percentage"] == pytest.approx(33.33, rel=0.01)

        # 3. 获取阅读进度
        get_response = client.get(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.json()["chapter_title"] == "第1章"

        # 4. 更新到第二章
        update2_response = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": chapters[1].id}
        )
        assert update2_response.json()["progress_percentage"] == pytest.approx(66.67, rel=0.01)

        # 5. 更新到最后一章
        update3_response = client.post(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers,
            json={"chapter_id": chapters[2].id}
        )
        assert update3_response.json()["progress_percentage"] == 100.0

        # 6. 重置进度
        reset_response = client.delete(
            f"/api/novels/{test_novel.id}/reading-progress",
            headers=auth_headers
        )
        assert reset_response.status_code == status.HTTP_204_NO_CONTENT
