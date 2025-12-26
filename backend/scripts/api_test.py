#!/usr/bin/env python3
"""
API功能验证脚本 - 织梦者后端API测试

用法:
    python scripts/api_test.py [--base-url http://localhost:8000] [--cleanup] [--verbose]

功能:
    - 测试所有主要API端点
    - 彩色输出测试结果
    - 显示AI生成内容预览（前200字符）
    - 自动清理测试数据（可选）
    - 显示完整AI生成内容（--verbose）
"""

import argparse
import sys
import time
from typing import Optional

try:
    import httpx
except ImportError:
    print("错误: 需要安装 httpx 库")
    print("运行: pip install httpx")
    sys.exit(1)


class Colors:
    """终端颜色代码"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class APITester:
    def __init__(self, base_url: str, cleanup: bool = False, verbose: bool = False):
        self.base_url = base_url.rstrip('/')
        self.cleanup = cleanup
        self.verbose = verbose
        self.client = httpx.Client(timeout=30.0)
        self.token: Optional[str] = None
        self.test_data = {
            'user_id': None,
            'novel_id': None,
            'chapter_id': None,
            'character_id': None,
            'world_setting_id': None,
        }
        self.results = {'passed': 0, 'failed': 0, 'total': 0}

    def print_header(self, text: str):
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

    def print_test(self, name: str, passed: bool, details: str = ""):
        self.results['total'] += 1
        if passed:
            self.results['passed'] += 1
            status = f"{Colors.GREEN}✓ PASS{Colors.RESET}"
        else:
            self.results['failed'] += 1
            status = f"{Colors.RED}✗ FAIL{Colors.RESET}"

        print(f"{status} {name}")
        if details:
            print(f"      {Colors.YELLOW}{details}{Colors.RESET}")

    def test_health(self):
        """测试健康检查端点"""
        self.print_header("健康检查")

        try:
            resp = self.client.get(f"{self.base_url}/")
            self.print_test("GET /", resp.status_code == 200, f"状态码: {resp.status_code}")

            resp = self.client.get(f"{self.base_url}/api/health")
            self.print_test("GET /api/health", resp.status_code == 200, f"状态码: {resp.status_code}")
        except Exception as e:
            self.print_test("健康检查", False, str(e))

    def test_auth(self):
        """测试认证API"""
        self.print_header("认证API测试")

        # 注册
        timestamp = int(time.time())
        user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "Test123456"
        }

        try:
            resp = self.client.post(f"{self.base_url}/api/auth/register", json=user_data)
            passed = resp.status_code == 201
            self.print_test("POST /api/auth/register", passed, f"状态码: {resp.status_code}")

            if passed:
                data = resp.json()
                self.token = data.get('token')
                self.test_data['user_id'] = data.get('id')
        except Exception as e:
            self.print_test("注册用户", False, str(e))
            return

        # 登录
        try:
            login_data = {"email": user_data['email'], "password": user_data['password'], "remember_me": False}
            resp = self.client.post(f"{self.base_url}/api/auth/login", json=login_data)
            self.print_test("POST /api/auth/login", resp.status_code == 200, f"状态码: {resp.status_code}")
        except Exception as e:
            self.print_test("用户登录", False, str(e))

        # 获取当前用户
        if self.token:
            try:
                headers = {"Authorization": f"Bearer {self.token}"}
                resp = self.client.get(f"{self.base_url}/api/auth/me", headers=headers)
                self.print_test("GET /api/auth/me", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("获取当前用户", False, str(e))

    def test_novels(self):
        """测试小说API"""
        self.print_header("小说API测试")

        if not self.token:
            self.print_test("小说API", False, "未登录，跳过测试")
            return

        headers = {"Authorization": f"Bearer {self.token}"}

        # 创建小说
        novel_data = {
            "title": "测试小说",
            "description": "这是一个测试小说",
            "category": "玄幻",
            "is_interactive": False
        }

        try:
            resp = self.client.post(f"{self.base_url}/api/novels", json=novel_data, headers=headers)
            passed = resp.status_code == 201
            self.print_test("POST /api/novels", passed, f"状态码: {resp.status_code}")

            if passed:
                self.test_data['novel_id'] = resp.json()['id']
        except Exception as e:
            self.print_test("创建小说", False, str(e))
            return

        # 获取小说列表
        try:
            resp = self.client.get(f"{self.base_url}/api/novels?page=1&page_size=10")
            self.print_test("GET /api/novels", resp.status_code == 200, f"状态码: {resp.status_code}")
        except Exception as e:
            self.print_test("获取小说列表", False, str(e))

        # 获取小说详情
        if self.test_data['novel_id']:
            try:
                resp = self.client.get(f"{self.base_url}/api/novels/{self.test_data['novel_id']}", headers=headers)
                self.print_test(f"GET /api/novels/{self.test_data['novel_id']}", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("获取小说详情", False, str(e))

        # 更新小说
        if self.test_data['novel_id']:
            try:
                update_data = {"title": "测试小说（已更新）"}
                resp = self.client.put(f"{self.base_url}/api/novels/{self.test_data['novel_id']}", json=update_data, headers=headers)
                self.print_test(f"PUT /api/novels/{self.test_data['novel_id']}", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("更新小说", False, str(e))

        # 发布小说
        if self.test_data['novel_id']:
            try:
                publish_data = {"status": "published"}
                resp = self.client.post(f"{self.base_url}/api/novels/{self.test_data['novel_id']}/publish", json=publish_data, headers=headers)
                self.print_test(f"POST /api/novels/{self.test_data['novel_id']}/publish", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("发布小说", False, str(e))

    def test_chapters(self):
        """测试章节API"""
        self.print_header("章节API测试")

        if not self.token or not self.test_data['novel_id']:
            self.print_test("章节API", False, "未登录或无小说，跳过测试")
            return

        headers = {"Authorization": f"Bearer {self.token}"}
        novel_id = self.test_data['novel_id']

        # 创建章节
        chapter_data = {
            "title": "第一章 测试章节",
            "content": "这是测试章节的内容。"
        }

        try:
            resp = self.client.post(f"{self.base_url}/api/novels/{novel_id}/chapters", json=chapter_data, headers=headers)
            passed = resp.status_code == 201
            self.print_test(f"POST /api/novels/{novel_id}/chapters", passed, f"状态码: {resp.status_code}")

            if passed:
                self.test_data['chapter_id'] = resp.json()['id']
        except Exception as e:
            self.print_test("创建章节", False, str(e))
            return

        # 获取章节列表
        try:
            resp = self.client.get(f"{self.base_url}/api/novels/{novel_id}/chapters", headers=headers)
            self.print_test(f"GET /api/novels/{novel_id}/chapters", resp.status_code == 200, f"状态码: {resp.status_code}")
        except Exception as e:
            self.print_test("获取章节列表", False, str(e))

        # 获取章节详情
        if self.test_data['chapter_id']:
            try:
                resp = self.client.get(f"{self.base_url}/api/novels/{novel_id}/chapters/{self.test_data['chapter_id']}", headers=headers)
                self.print_test(f"GET /api/novels/{novel_id}/chapters/{self.test_data['chapter_id']}", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("获取章节详情", False, str(e))

        # 更新章节
        if self.test_data['chapter_id']:
            try:
                update_data = {"content": "这是更新后的章节内容。"}
                resp = self.client.put(f"{self.base_url}/api/novels/{novel_id}/chapters/{self.test_data['chapter_id']}", json=update_data, headers=headers)
                self.print_test(f"PUT /api/novels/{novel_id}/chapters/{self.test_data['chapter_id']}", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("更新章节", False, str(e))

    def test_characters(self):
        """测试角色API"""
        self.print_header("角色API测试")

        if not self.token or not self.test_data['novel_id']:
            self.print_test("角色API", False, "未登录或无小说，跳过测试")
            return

        headers = {"Authorization": f"Bearer {self.token}"}
        novel_id = self.test_data['novel_id']

        # 创建角色
        character_data = {
            "name": "测试角色",
            "role_type": "主角",
            "description": "这是一个测试角色"
        }

        try:
            resp = self.client.post(f"{self.base_url}/api/novels/{novel_id}/characters", json=character_data, headers=headers)
            passed = resp.status_code == 201
            self.print_test(f"POST /api/novels/{novel_id}/characters", passed, f"状态码: {resp.status_code}")

            if passed:
                self.test_data['character_id'] = resp.json()['id']
        except Exception as e:
            self.print_test("创建角色", False, str(e))
            return

        # 获取角色列表
        try:
            resp = self.client.get(f"{self.base_url}/api/novels/{novel_id}/characters", headers=headers)
            self.print_test(f"GET /api/novels/{novel_id}/characters", resp.status_code == 200, f"状态码: {resp.status_code}")
        except Exception as e:
            self.print_test("获取角色列表", False, str(e))

        # 获取角色详情
        if self.test_data['character_id']:
            try:
                resp = self.client.get(f"{self.base_url}/api/novels/{novel_id}/characters/{self.test_data['character_id']}", headers=headers)
                self.print_test(f"GET /api/novels/{novel_id}/characters/{self.test_data['character_id']}", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("获取角色详情", False, str(e))

        # 更新角色
        if self.test_data['character_id']:
            try:
                update_data = {"description": "这是更新后的角色描述"}
                resp = self.client.put(f"{self.base_url}/api/novels/{novel_id}/characters/{self.test_data['character_id']}", json=update_data, headers=headers)
                self.print_test(f"PUT /api/novels/{novel_id}/characters/{self.test_data['character_id']}", resp.status_code == 200, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("更新角色", False, str(e))

    def _print_ai_result(self, name: str, resp, request_data: dict):
        """打印AI生成结果"""
        passed = resp.status_code == 200

        if passed:
            data = resp.json()
            content = data.get('content', data.get('outline', data.get('character', '')))
            preview = content[:200] if len(content) > 200 else content

            details = f"状态码: {resp.status_code}\n"
            details += f"      请求: {request_data}\n"
            details += f"      生成内容: {preview}{'...' if len(content) > 200 else ''}"

            if 'usage' in data:
                details += f"\n      Token使用: {data['usage']}"

            if self.verbose and len(content) > 200:
                details += f"\n      完整内容:\n      {content}"
        else:
            error_msg = resp.json().get('detail', '未知错误') if resp.status_code != 500 else 'AI服务未配置或调用失败'
            details = f"状态码: {resp.status_code}\n      错误: {error_msg}"

        self.print_test(name, passed, details)

    def test_ai(self):
        """测试AI生成API"""
        self.print_header("AI生成API测试")

        if not self.token:
            self.print_test("AI API", False, "未登录，跳过测试")
            return

        headers = {"Authorization": f"Bearer {self.token}"}

        # 1. 大纲生成
        try:
            outline_data = {
                "category": "玄幻",
                "keywords": "修仙,热血,逆袭",
                "chapter_count": 10,
                "target_words": 500
            }
            resp = self.client.post(f"{self.base_url}/api/ai/outline", json=outline_data, headers=headers)
            self._print_ai_result("POST /api/ai/outline", resp, outline_data)
        except Exception as e:
            self.print_test("AI大纲生成", False, str(e))

        # 2. 章节续写
        if self.test_data['novel_id'] and self.test_data['chapter_id']:
            try:
                continue_data = {
                    "novel_id": self.test_data['novel_id'],
                    "chapter_id": self.test_data['chapter_id'],
                    "chapter_outline": "主角进入神秘山洞，发现古老的修炼秘籍",
                    "context": "主角来到了神秘的山洞前。",
                    "target_words": 500
                }
                resp = self.client.post(f"{self.base_url}/api/ai/continue", json=continue_data, headers=headers)
                self._print_ai_result("POST /api/ai/continue", resp, continue_data)
            except Exception as e:
                self.print_test("AI章节续写", False, str(e))

        # 3. 文本扩写
        try:
            expand_data = {
                "text": "他走进了房间。",
                "style": "详细描写",
                "target_words": 200
            }
            resp = self.client.post(f"{self.base_url}/api/ai/expand", json=expand_data, headers=headers)
            self._print_ai_result("POST /api/ai/expand", resp, expand_data)
        except Exception as e:
            self.print_test("AI文本扩写", False, str(e))

        # 4. 角色生成
        if self.test_data['novel_id']:
            try:
                character_data = {
                    "novel_id": self.test_data['novel_id'],
                    "role_type": "主角",
                    "keywords": ["冷静", "智慧", "剑客"]
                }
                resp = self.client.post(f"{self.base_url}/api/ai/character", json=character_data, headers=headers)
                self._print_ai_result("POST /api/ai/character", resp, character_data)
            except Exception as e:
                self.print_test("AI角色生成", False, str(e))

        # 5. 分支生成
        if self.test_data['novel_id'] and self.test_data['chapter_id']:
            try:
                branch_data = {
                    "novel_id": self.test_data['novel_id'],
                    "chapter_id": self.test_data['chapter_id'],
                    "current_scene": "主角站在神秘山洞前，洞口散发着幽蓝色的光芒。他面临着艰难的选择：是冒险进入山洞探索未知的秘密，还是绕道而行避开潜在的危险？",
                    "branch_count": 2
                }
                resp = self.client.post(f"{self.base_url}/api/ai/branch", json=branch_data, headers=headers)
                self._print_ai_result("POST /api/ai/branch", resp, branch_data)
            except Exception as e:
                self.print_test("AI分支生成", False, str(e))

    def cleanup_test_data(self):
        """清理测试数据"""
        if not self.cleanup:
            return

        self.print_header("清理测试数据")

        if not self.token:
            print("未登录，无法清理数据")
            return

        headers = {"Authorization": f"Bearer {self.token}"}

        # 删除章节
        if self.test_data['chapter_id'] and self.test_data['novel_id']:
            try:
                resp = self.client.delete(
                    f"{self.base_url}/api/novels/{self.test_data['novel_id']}/chapters/{self.test_data['chapter_id']}",
                    headers=headers
                )
                self.print_test("删除测试章节", resp.status_code == 204, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("删除测试章节", False, str(e))

        # 删除角色
        if self.test_data['character_id'] and self.test_data['novel_id']:
            try:
                resp = self.client.delete(
                    f"{self.base_url}/api/novels/{self.test_data['novel_id']}/characters/{self.test_data['character_id']}",
                    headers=headers
                )
                self.print_test("删除测试角色", resp.status_code == 204, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("删除测试角色", False, str(e))

        # 删除小说
        if self.test_data['novel_id']:
            try:
                resp = self.client.delete(f"{self.base_url}/api/novels/{self.test_data['novel_id']}", headers=headers)
                self.print_test("删除测试小说", resp.status_code == 204, f"状态码: {resp.status_code}")
            except Exception as e:
                self.print_test("删除测试小说", False, str(e))

    def print_summary(self):
        """打印测试摘要"""
        self.print_header("测试摘要")

        total = self.results['total']
        passed = self.results['passed']
        failed = self.results['failed']
        pass_rate = (passed / total * 100) if total > 0 else 0

        print(f"总测试数: {total}")
        print(f"{Colors.GREEN}通过: {passed}{Colors.RESET}")
        print(f"{Colors.RED}失败: {failed}{Colors.RESET}")
        print(f"通过率: {pass_rate:.1f}%\n")

        if failed == 0:
            print(f"{Colors.GREEN}{Colors.BOLD}所有测试通过！{Colors.RESET}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}部分测试失败，请检查日志{Colors.RESET}")

    def run(self):
        """运行所有测试"""
        print(f"\n{Colors.BOLD}织梦者 API 功能验证{Colors.RESET}")
        print(f"服务器地址: {self.base_url}")
        print(f"清理模式: {'开启' if self.cleanup else '关闭'}\n")

        try:
            self.test_health()
            self.test_auth()
            self.test_novels()
            self.test_chapters()
            self.test_characters()
            self.test_ai()

            if self.cleanup:
                self.cleanup_test_data()

            self.print_summary()

            return 0 if self.results['failed'] == 0 else 1

        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}测试被用户中断{Colors.RESET}")
            return 130
        except Exception as e:
            print(f"\n\n{Colors.RED}测试过程中发生错误: {e}{Colors.RESET}")
            return 1
        finally:
            self.client.close()


def main():
    parser = argparse.ArgumentParser(description='织梦者后端API功能验证脚本')
    parser.add_argument('--base-url', default='http://localhost:8000', help='API服务器地址 (默认: http://localhost:8000)')
    parser.add_argument('--cleanup', action='store_true', help='测试完成后清理测试数据')
    parser.add_argument('--verbose', action='store_true', help='显示完整的AI生成内容')

    args = parser.parse_args()

    tester = APITester(args.base_url, args.cleanup, args.verbose)
    sys.exit(tester.run())


if __name__ == '__main__':
    main()
