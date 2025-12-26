# 测试文档

## 测试概述

本项目使用 pytest 作为测试框架，包含单元测试和集成测试，覆盖认证、小说管理和 AI 生成三大核心模块。

## 测试结构

```
backend/tests/
├── __init__.py           # 测试包初始化
├── conftest.py           # 测试配置和 fixtures
├── test_auth.py          # 认证 API 测试
├── test_novels.py        # 小说 API 测试
└── test_ai.py            # AI 生成 API 测试
```

## 安装测试依赖

```bash
cd backend
pip install pytest pytest-cov pytest-asyncio httpx
```

## 运行测试

### 运行所有测试
```bash
pytest
```

### 运行特定测试文件
```bash
pytest tests/test_auth.py
pytest tests/test_novels.py
pytest tests/test_ai.py
```

### 运行特定测试类
```bash
pytest tests/test_auth.py::TestRegister
pytest tests/test_novels.py::TestCreateNovel
```

### 运行特定测试方法
```bash
pytest tests/test_auth.py::TestRegister::test_register_success
```

### 按标记运行测试
```bash
# 只运行单元测试
pytest -m unit

# 只运行集成测试
pytest -m integration

# 排除慢速测试
pytest -m "not slow"
```

### 查看详细输出
```bash
pytest -v
pytest -vv  # 更详细
```

### 生成覆盖率报告
```bash
# 终端输出
pytest --cov=app --cov-report=term-missing

# HTML 报告
pytest --cov=app --cov-report=html
# 然后打开 htmlcov/index.html
```

## 测试覆盖范围

### 认证模块 (test_auth.py)
- ✅ 用户注册（成功、重复邮箱、重复用户名、无效输入）
- ✅ 用户登录（成功、错误密码、不存在用户、记住我）
- ✅ 获取当前用户信息（成功、无令牌、无效令牌）
- ✅ 完整认证流程（注册-登录-获取信息）

### 小说模块 (test_novels.py)
- ✅ 小说列表（分页、筛选、权限控制）
- ✅ 创建小说（成功、未认证、互动小说）
- ✅ 获取小说详情（已发布、草稿、权限控制）
- ✅ 更新小说（成功、非作者、不存在）
- ✅ 发布/取消发布小说
- ✅ 删除小说（成功、非作者）
- ✅ 完整小说流程（创建-更新-发布-删除）

### AI 生成模块 (test_ai.py)
- ✅ 大纲生成（基本参数、可选参数、未认证）
- ✅ 章节续写（基本续写、基于前文、特殊要求、权限控制）
- ✅ 文本扩写（不同风格、未认证）
- ✅ 角色生成（不同类型、指定名字、权限控制）
- ✅ 分支生成（基本生成、带上下文）
- ✅ 完整 AI 创作流程

## 测试特性

### 1. 独立的测试数据库
- 使用内存 SQLite 数据库（`:memory:`）
- 每个测试函数独立的数据库会话
- 测试结束自动清理

### 2. Mock AI 服务
- 所有 AI API 调用已 Mock
- 不依赖外部 AI 服务
- 测试运行快速稳定

### 3. Fixtures 复用
- `test_user` - 测试用户
- `test_novel` - 测试小说
- `auth_headers` - 认证请求头
- `mock_ai_service` - Mock AI 服务

### 4. 测试标记
- `@pytest.mark.unit` - 单元测试
- `@pytest.mark.integration` - 集成测试
- `@pytest.mark.slow` - 慢速测试

## 持续集成

测试可以集成到 CI/CD 流程中：

```yaml
# .github/workflows/test.yml 示例
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov
      - run: pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v3
```

## 常见问题

### Q: 测试失败提示数据库错误？
A: 确保没有其他进程占用测试数据库，测试使用内存数据库应该不会有此问题。

### Q: AI 测试失败？
A: 检查 `mock_ai_service` fixture 是否正确应用，确保 AI 服务已被 Mock。

### Q: 如何调试单个测试？
A: 使用 `pytest -vv -s tests/test_auth.py::TestRegister::test_register_success`，`-s` 参数显示 print 输出。

### Q: 如何跳过某些测试？
A: 使用 `@pytest.mark.skip` 或 `@pytest.mark.skipif` 装饰器。

## 最佳实践

1. **测试命名**：使用描述性名称，如 `test_register_duplicate_email`
2. **测试独立性**：每个测试应该独立运行，不依赖其他测试
3. **使用 fixtures**：复用测试数据和配置
4. **断言清晰**：每个测试应该有明确的断言
5. **覆盖边界情况**：测试正常情况和异常情况
6. **保持简洁**：每个测试只测试一个功能点

## 测试覆盖率目标

- 整体覆盖率：> 80%
- 核心业务逻辑：> 90%
- API 路由：100%
- 工具函数：> 85%
