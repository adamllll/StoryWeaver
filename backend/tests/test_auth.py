"""认证API测试"""
import pytest
from fastapi import status


@pytest.mark.unit
class TestRegister:
    """用户注册测试"""

    def test_register_success(self, client):
        """测试成功注册"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert "token" in data
        assert "password" not in data

    def test_register_duplicate_email(self, client, test_user):
        """测试重复邮箱注册"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "anotheruser",
                "email": test_user.email,
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "邮箱已被注册" in response.json()["detail"]

    def test_register_duplicate_username(self, client, test_user):
        """测试重复用户名注册"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": test_user.username,
                "email": "another@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "用户名已被占用" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """测试无效邮箱格式"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "invalid-email",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_short_password(self, client):
        """测试密码过短"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "12345"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_short_username(self, client):
        """测试用户名过短"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "a",
                "email": "new@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.unit
class TestLogin:
    """用户登录测试"""

    def test_login_success(self, client, test_user):
        """测试成功登录"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "password123",
                "remember_me": False
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert "token" in data

    def test_login_with_remember_me(self, client, test_user):
        """测试记住我登录"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "password123",
                "remember_me": True
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert "token" in response.json()

    def test_login_wrong_password(self, client, test_user):
        """测试错误密码"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
                "remember_me": False
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "邮箱或密码错误" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """测试不存在的用户"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
                "remember_me": False
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "邮箱或密码错误" in response.json()["detail"]

    def test_login_invalid_email_format(self, client):
        """测试无效邮箱格式"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "invalid-email",
                "password": "password123",
                "remember_me": False
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.unit
class TestGetMe:
    """获取当前用户信息测试"""

    def test_get_me_success(self, client, test_user, auth_headers):
        """测试成功获取当前用户信息"""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert "password" not in data

    def test_get_me_without_token(self, client):
        """测试未提供令牌"""
        response = client.get("/api/auth/me")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_get_me_invalid_token(self, client):
        """测试无效令牌"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_malformed_header(self, client):
        """测试格式错误的认证头"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "InvalidFormat"}
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.integration
class TestAuthFlow:
    """认证流程集成测试"""

    def test_register_login_get_me_flow(self, client):
        """测试完整的注册-登录-获取信息流程"""
        # 1. 注册
        register_response = client.post(
            "/api/auth/register",
            json={
                "username": "flowuser",
                "email": "flow@example.com",
                "password": "password123"
            }
        )
        assert register_response.status_code == status.HTTP_201_CREATED
        register_token = register_response.json()["token"]

        # 2. 使用注册返回的令牌获取信息
        me_response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {register_token}"}
        )
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.json()["username"] == "flowuser"

        # 3. 登录
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "flow@example.com",
                "password": "password123",
                "remember_me": False
            }
        )
        assert login_response.status_code == status.HTTP_200_OK
        login_token = login_response.json()["token"]

        # 4. 使用登录令牌获取信息
        me_response2 = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {login_token}"}
        )
        assert me_response2.status_code == status.HTTP_200_OK
        assert me_response2.json()["email"] == "flow@example.com"


@pytest.mark.unit
class TestResetPassword:
    """密码重置测试"""

    def test_reset_password_success(self, client, test_user):
        """测试成功重置密码"""
        response = client.post(
            "/api/auth/reset-password",
            json={
                "username": test_user.username,
                "email": test_user.email,
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert "密码重置成功" in response.json()["message"]

        # 验证可以使用新密码登录
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "newpassword123",
                "remember_me": False
            }
        )
        assert login_response.status_code == status.HTTP_200_OK

    def test_reset_password_invalid_user(self, client):
        """测试不存在的用户"""
        response = client.post(
            "/api/auth/reset-password",
            json={
                "username": "nonexistent",
                "email": "nonexistent@example.com",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_reset_password_mismatch(self, client, test_user):
        """测试用户名邮箱不匹配"""
        response = client.post(
            "/api/auth/reset-password",
            json={
                "username": test_user.username,
                "email": "wrong@example.com",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
