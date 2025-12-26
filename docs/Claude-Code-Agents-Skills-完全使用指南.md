# 🎓 Claude Code Agents & Skills 完全使用指南

> 由傲娇的蓝发双马尾大小姐哈雷酱倾情编写 (￣▽￣)／

---

## 📦 已安装的完整清单

### 🎭 Agents (11个专家助手)

| Agent | 用途 | 调用方式 |
|-------|------|---------|
| `frontend-developer` | React/前端开发 | `@frontend-developer` |
| `backend-architect` | 后端架构设计 | `@backend-architect` |
| `debugger` | 调试代码 | `@debugger` |
| `test-engineer` | 测试工程师 | `@test-engineer` |
| `prompt-engineer` | 优化提示词 | `@prompt-engineer` |
| `ui-ux-designer` | UI/UX 设计 | `@ui-ux-designer` |
| `error-detective` | 错误排查 | `@error-detective` |
| `api-documenter` | API 文档编写 | `@api-documenter` |
| `code-reviewer` | 代码审查 | `@code-reviewer` |
| `deployment-engineer` | 部署运维 | `@deployment-engineer` |
| `architect-reviewer` | 架构审查 | `@architect-reviewer` |

### 🛠️ Skills (7个工具命令)

| Skill | 用途 | 调用方式 |
|-------|------|---------|
| `git-commit-helper` | 智能 Git 提交 | `/git-commit-helper` |
| `docx` | Word 文档处理 | `/docx` |
| `pdf-processing-pro` | PDF 处理 | `/pdf-processing-pro` |
| `pptx` | PPT 处理 | `/pptx` |
| `canvas-design` | Canvas 设计 | `/canvas-design` |
| `theme-factory` | 主题生成 | `/theme-factory` |
| `frontend-design` | 前端设计 | `/frontend-design` |

---

## 🎭 Agents 详细使用教程

### 1️⃣ Frontend-developer (前端开发专家)

**专长**：React、Vue、组件开发、CSS/Tailwind

#### 使用场景
```bash
# 场景1：创建新组件
@frontend-developer 帮我创建一个小说卡片组件，需要显示封面、标题、作者、分类，支持悬停效果

# 场景2：优化现有代码
@frontend-developer 优化这个组件的性能，减少不必要的重渲染

# 场景3：响应式设计
@frontend-developer 把这个表格改成响应式，移动端显示成卡片列表

# 场景4：状态管理
@frontend-developer 帮我用 Zustand 实现全局用户状态管理
```

#### 实战示例：开发课程设计的小说列表
```
@frontend-developer

任务：为"织梦者"项目创建小说列表组件

需求：
1. 使用 Next.js 14 + TypeScript
2. 支持网格/列表两种视图切换
3. 每个卡片显示：封面、标题、作者、分类、简介（最多100字）
4. 支持分页（每页12本）
5. 使用 Tailwind CSS，支持暗色模式
6. 加载态和空状态处理

技术栈：Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
```

---

### 2️⃣ Backend Architect (后端架构师)

**专长**：API 设计、数据库架构、微服务、性能优化

#### 使用场景
```bash
# 场景1：设计 API
@backend-architect 设计一个小说管理系统的 RESTful API，包括 CRUD 和搜索

# 场景2：数据库设计
@backend-architect 设计用户、小说、章节的数据库表结构，要支持互动式分支

# 场景3：性能优化
@backend-architect 这个接口响应太慢，帮我分析性能瓶颈

# 场景4：架构评审
@backend-architect 评估这个微服务拆分方案是否合理
```

#### 实战示例：设计课程设计后端
```
@backend-architect

任务：为"织梦者"项目设计完整的后端架构

需求：
1. 用户系统（注册/登录/JWT 认证）
2. 小说管理（创建/编辑/删除/分类/搜索）
3. 章节管理（支持互动式分支）
4. AI 生成接口（大纲/续写/角色设定）
5. 阅读进度记录

约束：
- 2核2G 服务器
- 使用 SQLite 数据库
- FastAPI + SQLAlchemy
- 需要考虑 AI API 调用的异步处理
```

---

### 3️⃣ Debugger (调试专家)

**专长**：断点调试、日志分析、性能分析

#### 使用场景
```bash
# 场景1：找 Bug
@debugger 这个函数有时候返回 undefined，帮我找出原因

# 场景2：性能分析
@debugger 分析为什么这个页面加载这么慢

# 场景3：内存泄漏
@debugger 这个 React 组件好像有内存泄漏，帮我定位

# 场景4：异步问题
@debugger 这个 Promise 链有时候不执行，帮我排查
```

#### 实战示例
```
@debugger

问题：小说列表页面加载很慢，有时候卡死

现象：
1. 首次加载需要 5-8 秒
2. 滚动时有卡顿
3. 控制台有警告：Warning: Cannot update during an existing state transition

代码文件：
- app/novels/page.tsx
- components/NovelList.tsx
- lib/api.ts

请帮我：
1. 定位性能瓶颈
2. 找出 React 警告的原因
3. 给出优化方案
```

---

### 4️⃣ Prompt Engineer (提示词工程师)

**专长**：优化 AI 提示词、提升生成质量

#### 使用场景
```bash
# 场景1：优化提示词
@prompt-engineer 帮我优化这个小说生成的提示词，让输出更有文学性

# 场景2：设计提示词模板
@prompt-engineer 设计一套角色生成的提示词模板，包括外貌、性格、背景

# 场景3：提示词调试
@prompt-engineer 这个提示词生成的内容质量不稳定，帮我改进

# 场景4：Chain-of-Thought
@prompt-engineer 帮我设计一个多步骤的剧情生成流程
```

#### 实战示例：课程设计的提示词文档
```
@prompt-engineer

任务：为课程设计的"提示词设计文档"编写高质量提示词

需要设计：
1. **小说大纲生成提示词**
   - 输入：题材、主角设定、世界观
   - 输出：结构化的章节大纲（10-30章）

2. **章节续写提示词**
   - 输入：前文内容、角色关系、当前情节
   - 输出：连贯的下一段内容（800-2000字）

3. **互动选项生成提示词**
   - 输入：当前剧情、人物状态
   - 输出：2-4个合理的选择分支

4. **角色设定提示词**
   - 输入：角色类型（主角/配角/反派）
   - 输出：完整的角色卡（外貌/性格/背景/能力）

要求：
- 符合课程评分标准（占20%）
- 包含迭代优化记录
- 提供效果对比示例
```

---

### 5️⃣ UI/UX Designer (界面设计师)

**专长**：用户体验设计、交互设计、视觉设计

#### 使用场景
```bash
# 场景1：页面布局
@ui-ux-designer 设计一个小说阅读页面的布局，要考虑沉浸式体验

# 场景2：交互设计
@ui-ux-designer 设计互动式小说的选择分支交互，要有吸引力

# 场景3：配色方案
@ui-ux-designer 为这个文学类应用设计一套优雅的配色方案

# 场景4：用户流程
@ui-ux-designer 设计从注册到开始创作的完整用户流程
```

#### 实战示例
```
@ui-ux-designer

任务：设计"织梦者"项目的核心页面

需要设计：
1. **首页**
   - 导航栏（创作中心/阅读中心/我的）
   - 推荐小说（轮播 + 分类卡片）
   - 快速开始创作按钮

2. **创作中心**
   - 左侧：我的小说列表
   - 中间：章节编辑器 + AI 辅助面板
   - 右侧：角色/世界观设定

3. **阅读页面**
   - 沉浸式阅读界面
   - 互动选择点（动画效果）
   - 进度记录和书签

设计要求：
- 符合 2025 年流行趋势
- 暗色模式优先
- 移动端友好
- 使用 shadcn/ui 组件库风格
```

---

### 6️⃣ Error Detective (错误侦探)

**专长**：错误排查、日志分析、异常处理

#### 使用场景
```bash
# 场景1：看不懂的错误
@error-detective 这个错误是什么意思？TypeError: Cannot read property 'map' of undefined

# 场景2：生产环境错误
@error-detective 生产环境报 500 错误，日志显示数据库连接失败

# 场景3：间歇性错误
@error-detective 这个错误只在特定条件下出现，帮我分析原因

# 场景4：错误处理建议
@error-detective 帮我设计这个模块的错误处理策略
```

#### 实战示例
```
@error-detective

错误现象：
1. 用户点击"AI 生成大纲"按钮后，有时候成功，有时候报错
2. 错误信息：Error: timeout of 30000ms exceeded
3. 后端日志显示：OpenAI API call failed with status 429

发生频率：约 30% 的请求失败

相关代码：
- backend/app/services/ai_service.py
- frontend/app/workspace/page.tsx

请帮我：
1. 分析根本原因
2. 提供解决方案（短期 + 长期）
3. 设计错误重试机制
4. 改进用户提示
```

---

### 7️⃣ API Documenter (API 文档专家)

**专长**：API 文档编写、OpenAPI、接口说明

#### 使用场景
```bash
# 场景1：生成 API 文档
@api-documenter 为这些 FastAPI 路由生成完整的 API 文档

# 场景2：OpenAPI 规范
@api-documenter 帮我写符合 OpenAPI 3.0 的接口定义

# 场景3：示例代码
@api-documenter 为每个 API 端点生成调用示例（curl + JavaScript）

# 场景4：错误码说明
@api-documenter 整理所有错误码和错误信息的文档
```

#### 实战示例
```
@api-documenter

任务：为"织梦者"项目编写完整的 API 文档

需要文档化的模块：
1. **认证 API** (/api/auth)
   - POST /register - 用户注册
   - POST /login - 用户登录
   - POST /refresh - 刷新 Token

2. **小说 API** (/api/novels)
   - GET /novels - 获取列表（分页、筛选）
   - POST /novels - 创建小说
   - GET /novels/{id} - 获取详情
   - PUT /novels/{id} - 更新小说
   - DELETE /novels/{id} - 删除小说

3. **AI API** (/api/ai)
   - POST /ai/outline - 生成大纲
   - POST /ai/continue - 续写章节
   - POST /ai/character - 生成角色

要求：
- 使用 OpenAPI 3.0 格式
- 每个端点包含：请求参数、响应示例、错误码
- 提供 curl 和 JavaScript fetch 示例
- 标注需要认证的接口
```

---

### 8️⃣ Code Reviewer (代码审查专家)

**专长**：代码质量审查、最佳实践、安全审计、可维护性分析

#### 使用场景
```bash
# 场景1：审查代码质量
@code-reviewer 帮我审查这个组件的代码质量，有没有需要改进的地方

# 场景2：安全审计
@code-reviewer 检查这段代码是否存在安全漏洞

# 场景3：性能审查
@code-reviewer 分析这个函数的性能问题，有没有优化空间

# 场景4：代码规范
@code-reviewer 这段代码是否符合团队的编码规范

# 场景5：PR 审查
@code-reviewer 帮我审查这个 Pull Request 的改动
```

#### 审查维度
```
📋 代码审查清单：
├─ 代码质量：可读性、命名规范、注释完整性
├─ 最佳实践：设计模式、SOLID 原则、DRY 原则
├─ 安全性：SQL 注入、XSS、敏感数据处理
├─ 性能：时间复杂度、内存使用、N+1 查询
├─ 可维护性：模块化、耦合度、测试覆盖
└─ 错误处理：异常捕获、边界条件、错误提示
```

#### 实战示例
```
@code-reviewer

任务：审查"织梦者"项目的用户认证模块

审查范围：
1. backend/app/routers/auth.py - 认证路由
2. backend/app/services/auth_service.py - 认证服务
3. backend/app/utils/jwt.py - JWT 工具类

请审查：
1. **安全性**
   - 密码是否正确加密存储
   - JWT Token 是否安全
   - 是否存在注入风险

2. **代码质量**
   - 函数职责是否单一
   - 命名是否清晰
   - 错误处理是否完善

3. **最佳实践**
   - 是否符合 FastAPI 最佳实践
   - 是否遵循 RESTful 规范
   - 有没有重复代码

请给出：
- 问题清单（按严重程度排序）
- 改进建议（附代码示例）
- 整体评分（1-10分）
```

#### 代码审查报告格式
```markdown
## 代码审查报告

### 📊 整体评分：8/10

### 🔴 严重问题（必须修复）
1. **[安全] 密码未使用 bcrypt 加密**
   - 文件：auth_service.py:45
   - 问题：使用 MD5 加密密码
   - 建议：改用 bcrypt 或 argon2

### 🟡 中等问题（建议修复）
1. **[质量] 函数过长**
   - 文件：auth.py:78-150
   - 问题：register 函数超过 70 行
   - 建议：拆分为多个小函数

### 🟢 小问题（可选修复）
1. **[规范] 变量命名不规范**
   - 文件：jwt.py:12
   - 问题：变量名 `t` 不清晰
   - 建议：改为 `token` 或 `jwt_token`

### ✅ 做得好的地方
- 错误处理完善
- 类型注解完整
- 文档字符串清晰
```

---

### 9️⃣ Deployment Engineer (部署运维工程师)

**专长**：CI/CD 流水线、Docker 容器化、服务器配置、自动化部署

#### 使用场景
```bash
# 场景1：Docker 配置
@deployment-engineer 帮我编写项目的 Dockerfile 和 docker-compose.yml

# 场景2：CI/CD 流水线
@deployment-engineer 设计 GitHub Actions 自动部署流程

# 场景3：服务器配置
@deployment-engineer 配置 Nginx 反向代理，支持 HTTPS

# 场景4：部署脚本
@deployment-engineer 编写一键部署脚本

# 场景5：环境管理
@deployment-engineer 帮我设计开发/测试/生产环境的配置管理方案
```

#### 部署相关技术
```
🚀 部署技术栈：
├─ 容器化：Docker, Docker Compose
├─ CI/CD：GitHub Actions, GitLab CI
├─ 反向代理：Nginx, Caddy
├─ 进程管理：PM2, Supervisor, systemd
├─ SSL证书：Let's Encrypt, Certbot
└─ 监控告警：Prometheus, Grafana, 健康检查
```

#### 实战示例：课程设计部署配置
```
@deployment-engineer

任务：为"织梦者"项目配置完整的部署方案

项目信息：
- 前端：Next.js 14（端口 3000）
- 后端：FastAPI（端口 8000）
- 数据库：SQLite
- 服务器：2核2G Ubuntu 22.04

需要配置：
1. **Docker 容器化**
   - Dockerfile.frontend（Next.js 多阶段构建）
   - Dockerfile.backend（Python + uvicorn）
   - docker-compose.yml（编排前后端）

2. **Nginx 配置**
   - 反向代理前后端
   - 配置 HTTPS（Let's Encrypt）
   - 静态资源缓存
   - Gzip 压缩

3. **CI/CD 流水线**（GitHub Actions）
   - 代码检查（lint）
   - 构建镜像
   - 自动部署到服务器

4. **部署脚本**
   - 一键部署脚本 deploy.sh
   - 环境变量管理
   - 数据库备份策略

5. **监控和日志**
   - 健康检查端点
   - 日志收集配置
   - 错误告警（可选）

约束：
- 服务器资源有限（2核2G）
- 需要考虑内存优化
- 支持零停机更新
```

#### Dockerfile 示例输出
```dockerfile
# Dockerfile.frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

#### docker-compose.yml 示例输出
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///./data/app.db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

#### GitHub Actions 示例输出
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        run: |
          docker build -t myapp-frontend ./frontend
          docker build -t myapp-backend ./backend

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/storyweaver
            docker-compose pull
            docker-compose up -d --build
            docker system prune -f
```

---

### 🔟 Test Engineer (测试工程师)

**专长**：单元测试、集成测试、E2E 测试、测试覆盖率分析、测试策略设计

#### 使用场景
```bash
# 场景1：生成单元测试
@test-engineer 为这个函数生成完整的单元测试用例

# 场景2：E2E 测试编写
@test-engineer 为小说创作流程编写 Playwright E2E 测试

# 场景3：测试覆盖率分析
@test-engineer 分析当前项目的测试覆盖率，找出未测试的关键路径

# 场景4：测试策略设计
@test-engineer 为这个模块设计完整的测试策略（单元/集成/E2E）

# 场景5：Mock 数据生成
@test-engineer 为 AI API 调用生成 Mock 数据和测试 Fixtures
```

#### 测试类型覆盖
```
🧪 测试技术栈：
├─ 前端测试
│  ├─ 单元测试：Jest + React Testing Library
│  ├─ 组件测试：Testing Library
│  └─ E2E 测试：Playwright / Cypress
│
├─ 后端测试
│  ├─ 单元测试：Pytest + unittest
│  ├─ API 测试：Pytest + httpx
│  └─ 集成测试：TestClient
│
└─ 测试工具
   ├─ 覆盖率：Coverage.py, Istanbul
   ├─ Mock：Jest mock, pytest-mock
   └─ Fixtures：Factory Boy, Faker
```

#### 实战示例1：前端组件测试
```
@test-engineer

任务：为"织梦者"项目的小说卡片组件生成完整测试

组件信息：
- 文件：components/novel/NovelCard.tsx
- Props：
  - title: string
  - author: string
  - category: string
  - coverUrl?: string
  - onClick?: () => void

功能点：
1. 正确渲染标题、作者、分类
2. 显示封面图片（如果有）
3. 点击事件触发
4. 暗色模式适配
5. 无数据时的占位处理

要求：
- 使用 Jest + React Testing Library
- 测试覆盖率 100%
- 包含快照测试
- 测试文件：NovelCard.test.tsx
```

#### 测试代码示例输出
```typescript
// NovelCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NovelCard } from './NovelCard';

describe('NovelCard', () => {
  const mockProps = {
    title: '测试小说',
    author: '测试作者',
    category: '玄幻',
    coverUrl: 'https://example.com/cover.jpg',
  };

  it('should render novel information correctly', () => {
    render(<NovelCard {...mockProps} />);

    expect(screen.getByText('测试小说')).toBeInTheDocument();
    expect(screen.getByText('测试作者')).toBeInTheDocument();
    expect(screen.getByText('玄幻')).toBeInTheDocument();
  });

  it('should display cover image when provided', () => {
    render(<NovelCard {...mockProps} />);

    const coverImg = screen.getByRole('img', { name: /测试小说/ });
    expect(coverImg).toHaveAttribute('src', mockProps.coverUrl);
  });

  it('should call onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<NovelCard {...mockProps} onClick={handleClick} />);

    const card = screen.getByTestId('novel-card');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render placeholder when no cover provided', () => {
    const propsWithoutCover = { ...mockProps, coverUrl: undefined };
    render(<NovelCard {...propsWithoutCover} />);

    expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<NovelCard {...mockProps} />);
    expect(container).toMatchSnapshot();
  });
});
```

---

#### 实战示例2：后端 API 测试
```
@test-engineer

任务：为"织梦者"后端的小说创建 API 生成测试

API 信息：
- 路由：POST /api/novels
- 文件：backend/app/routers/novels.py
- 认证：需要 JWT Token

请求参数：
```python
{
  "title": "string",
  "description": "string | null",
  "category": "string",
  "is_interactive": "boolean"
}
```

响应：
```python
{
  "id": "int",
  "title": "string",
  "user_id": "int",
  "created_at": "datetime"
}
```

需要测试：
1. 成功创建小说（200）
2. 缺少必填字段（422）
3. 未认证访问（401）
4. 无效的分类（400）
5. 标题过长（422）

要求：
- 使用 Pytest + FastAPI TestClient
- 包含 Fixture 和 Mock
- 测试文件：test_novels.py
```

#### 测试代码示例输出
```python
# test_novels.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.utils.auth import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers(test_user):
    """生成认证 Header"""
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def valid_novel_data():
    """有效的小说数据"""
    return {
        "title": "测试小说",
        "description": "这是一个测试描述",
        "category": "玄幻",
        "is_interactive": False
    }

class TestCreateNovel:
    """测试小说创建 API"""

    def test_create_novel_success(self, auth_headers, valid_novel_data):
        """测试成功创建小说"""
        response = client.post(
            "/api/novels",
            json=valid_novel_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == valid_novel_data["title"]
        assert data["category"] == valid_novel_data["category"]
        assert "id" in data
        assert "created_at" in data

    def test_create_novel_missing_title(self, auth_headers):
        """测试缺少标题字段"""
        invalid_data = {"description": "测试", "category": "玄幻"}
        response = client.post(
            "/api/novels",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422
        assert "title" in response.json()["detail"][0]["loc"]

    def test_create_novel_unauthorized(self, valid_novel_data):
        """测试未认证访问"""
        response = client.post("/api/novels", json=valid_novel_data)

        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"

    def test_create_novel_invalid_category(self, auth_headers, valid_novel_data):
        """测试无效分类"""
        invalid_data = {**valid_novel_data, "category": "invalid_category"}
        response = client.post(
            "/api/novels",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "category" in response.json()["detail"].lower()

    def test_create_novel_title_too_long(self, auth_headers, valid_novel_data):
        """测试标题过长"""
        invalid_data = {**valid_novel_data, "title": "a" * 101}
        response = client.post(
            "/api/novels",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422
```

---

#### 实战示例3：E2E 测试（Playwright）
```
@test-engineer

任务：为小说创作流程编写 E2E 测试

测试流程：
1. 用户登录
2. 进入创作中心
3. 点击"创建新小说"
4. 填写小说信息（标题、分类、简介）
5. 保存小说
6. 进入章节编辑
7. 使用 AI 生成大纲
8. 创建第一章
9. 验证小说列表中显示新小说

技术栈：
- Playwright + TypeScript
- Next.js 14 项目

要求：
- 包含页面对象模型（POM）
- 模拟 AI API 响应（Mock）
- 测试文件：e2e/novel-creation.spec.ts
```

#### E2E 测试代码示例输出
```typescript
// e2e/novel-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Novel Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 等待跳转到首页
    await expect(page).toHaveURL('/');
  });

  test('should create a new novel with AI outline', async ({ page }) => {
    // 1. 进入创作中心
    await page.click('a[href="/workspace"]');
    await expect(page).toHaveURL('/workspace');

    // 2. 点击创建新小说
    await page.click('button:has-text("创建新小说")');
    await expect(page.locator('dialog')).toBeVisible();

    // 3. 填写小说信息
    await page.fill('input[name="title"]', '测试小说：AI 创作之旅');
    await page.selectOption('select[name="category"]', '科幻');
    await page.fill('textarea[name="description"]', '这是一个关于 AI 创作的科幻小说');
    await page.check('input[name="is_interactive"]');

    // 4. 保存小说
    await page.click('button:has-text("创建")');
    await expect(page.locator('dialog')).not.toBeVisible();

    // 5. 验证小说出现在列表中
    await expect(page.locator('text=测试小说：AI 创作之旅')).toBeVisible();

    // 6. 进入编辑页面
    await page.click('text=测试小说：AI 创作之旅');
    await expect(page).toHaveURL(/\/novels\/\d+\/edit/);

    // 7. 使用 AI 生成大纲
    await page.click('button:has-text("AI 生成大纲")');

    // Mock AI 响应（在实际测试中应该 mock API）
    await page.waitForSelector('.outline-section', { timeout: 10000 });

    // 8. 验证大纲生成成功
    const outlineItems = await page.locator('.outline-item').count();
    expect(outlineItems).toBeGreaterThan(0);

    // 9. 创建第一章
    await page.click('button:has-text("创建章节")');
    await page.fill('input[name="chapter-title"]', '第一章：觉醒');
    await page.click('button:has-text("确认")');

    // 10. 验证章节创建成功
    await expect(page.locator('text=第一章：觉醒')).toBeVisible();

    // 11. 返回小说列表验证
    await page.goto('/novels');
    await expect(page.locator('text=测试小说：AI 创作之旅')).toBeVisible();
  });

  test('should handle AI generation failure gracefully', async ({ page }) => {
    await page.goto('/workspace');
    await page.click('button:has-text("创建新小说")');

    // 模拟 AI API 失败
    await page.route('**/api/ai/outline', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });

    await page.fill('input[name="title"]', '测试小说');
    await page.selectOption('select[name="category"]', '玄幻');
    await page.click('button:has-text("创建")');

    await page.click('button:has-text("AI 生成大纲")');

    // 验证错误提示
    await expect(page.locator('text=AI 服务暂时不可用')).toBeVisible();
    await expect(page.locator('button:has-text("重试")')).toBeVisible();
  });
});
```

---

#### 测试策略设计
```
@test-engineer

任务：为"织梦者"项目设计完整的测试策略

项目信息：
- 前端：Next.js 14 + TypeScript
- 后端：FastAPI + Python
- 核心功能：用户认证、小说管理、AI 生成、互动阅读

请设计：
1. **测试金字塔**
   - 单元测试占比：70%
   - 集成测试占比：20%
   - E2E 测试占比：10%

2. **关键测试路径**
   - 用户注册登录流程
   - 小说创建和编辑
   - AI 生成（大纲/续写/角色）
   - 互动式章节选择
   - 阅读进度保存

3. **测试优先级**
   - P0：核心功能（认证、AI 生成）
   - P1：重要功能（章节管理、阅读）
   - P2：辅助功能（统计、导出）

4. **CI/CD 集成**
   - 提交前：单元测试（< 30秒）
   - PR 时：全量测试（< 5分钟）
   - 部署前：E2E 冒烟测试（< 10分钟）

5. **覆盖率目标**
   - 后端：≥ 80%
   - 前端：≥ 70%
   - 关键路径：100%
```

#### 测试覆盖率分析
```
@test-engineer

任务：分析当前项目的测试覆盖率，找出未测试的关键代码

项目目录：
- frontend/app
- frontend/components
- backend/app

请：
1. 运行覆盖率分析
2. 生成覆盖率报告
3. 找出覆盖率低于 60% 的文件
4. 优先标注关键路径的缺失测试
5. 给出补充测试的建议
```

---

#### 日常测试工作流
```bash
# 开发新功能时
# 1. 先写测试（TDD）
@test-engineer 为即将实现的用户注册功能设计测试用例

# 2. 实现功能
# ... 写代码 ...

# 3. 运行测试
npm test
pytest

# 4. 检查覆盖率
npm run test:coverage
pytest --cov

# 功能完成后
# 5. 补充边界测试
@test-engineer 为这个功能补充边界条件和异常情况的测试

# 6. E2E 测试
@test-engineer 为这个功能编写 E2E 测试

# PR 前
# 7. 测试审查
@test-engineer 审查我的测试代码，有没有遗漏的场景
```

---

### 1️⃣1️⃣ Architect Reviewer (架构审查专家)

**专长**：架构一致性审查、SOLID 原则、分层设计、可维护性分析

#### 使用场景
```bash
# 场景1：架构一致性审查
@architect-reviewer 审查这个新功能的架构是否与现有系统一致

# 场景2：SOLID 原则检查
@architect-reviewer 检查这个模块是否符合 SOLID 原则

# 场景3：分层设计审查
@architect-reviewer 分析这个服务的分层是否合理，有没有跨层调用

# 场景4：依赖关系分析
@architect-reviewer 检查这个新服务的依赖关系是否合理

# 场景5：PR 架构审查
@architect-reviewer 审查这个 PR 的架构变更是否符合项目规范
```

#### 审查维度
```
🏗️ 架构审查清单：
├─ SOLID 原则
│  ├─ S: 单一职责原则
│  ├─ O: 开闭原则
│  ├─ L: 里氏替换原则
│  ├─ I: 接口隔离原则
│  └─ D: 依赖倒置原则
│
├─ 分层架构
│  ├─ 表现层（Controller/Router）
│  ├─ 业务层（Service）
│  ├─ 数据层（Repository/DAO）
│  └─ 跨层调用检测
│
├─ 设计模式
│  ├─ 工厂模式、策略模式、观察者模式等
│  ├─ 模式使用是否恰当
│  └─ 是否过度设计
│
└─ 可维护性
   ├─ 模块耦合度
   ├─ 代码复用性
   └─ 扩展性评估
```

#### 实战示例
```
@architect-reviewer

任务：审查"织梦者"项目的后端架构

审查范围：
1. backend/app/routers/ - 路由层
2. backend/app/services/ - 服务层
3. backend/app/models/ - 数据模型层

请审查：
1. **分层一致性**
   - 路由层是否只处理 HTTP 请求/响应
   - 服务层是否包含所有业务逻辑
   - 是否存在跨层调用（如 Router 直接访问数据库）

2. **SOLID 原则**
   - 每个类/模块是否职责单一
   - 是否依赖抽象而非具体实现
   - 接口是否足够精简

3. **依赖关系**
   - 模块间依赖是否合理
   - 是否存在循环依赖
   - 依赖注入是否正确使用

4. **可扩展性**
   - 添加新功能是否需要修改现有代码
   - 是否预留了扩展点

请给出：
- 架构问题清单（按影响程度排序）
- 改进建议（附重构示例）
- 架构健康度评分（1-10分）
```

#### 架构审查报告格式
```markdown
## 架构审查报告

### 📊 架构健康度：7/10

### 🔴 严重问题（必须修复）
1. **[分层违规] Router 直接访问数据库**
   - 文件：routers/novels.py:45
   - 问题：Router 中直接使用 db.query()
   - 建议：将数据访问逻辑移至 Service 层

### 🟡 中等问题（建议修复）
1. **[SOLID-S] Service 类职责过多**
   - 文件：services/novel_service.py
   - 问题：NovelService 同时处理小说和章节逻辑
   - 建议：拆分为 NovelService 和 ChapterService

### 🟢 小问题（可选修复）
1. **[依赖] 硬编码依赖**
   - 文件：services/ai_service.py:12
   - 问题：直接实例化 OpenAI 客户端
   - 建议：使用依赖注入

### ✅ 架构亮点
- 清晰的目录结构
- 统一的错误处理机制
- 良好的类型注解

### 📈 改进建议
1. 引入 Repository 模式分离数据访问
2. 使用依赖注入容器管理服务实例
3. 添加接口层（Protocol）提高可测试性
```

---

## 🛠️ Skills 详细使用教程

### 1️⃣ Git Commit Helper (智能提交助手)

**功能**：分析代码变更，生成规范的 commit message

#### 使用方法
```bash
# 基本用法（最常用！）
/git-commit-helper

# 带自定义消息
/git-commit-helper "feat: 添加用户认证模块"

# 跳过 hooks
/git-commit-helper --no-verify
```

#### 生成的 Commit 格式
```
feat: 添加小说列表组件

- 实现网格/列表视图切换
- 添加分页功能
- 集成 shadcn/ui 卡片组件
- 支持暗色模式

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### 日常工作流
```bash
# 1. 开发功能
# ... 写代码 ...

# 2. 查看变更
git status

# 3. 智能提交
/git-commit-helper

# 4. 推送
git push
```

---

### 2️⃣ DOCX (Word 文档处理)

**功能**：读取、生成、编辑 Word 文档

#### 使用场景
```bash
# 场景1：读取 Word 文档
/docx read "需求文档.docx"

# 场景2：生成文档
/docx create "课程设计报告.docx" --content "从对话生成"

# 场景3：提取内容
/docx extract "用户手册.docx" --format markdown

# 场景4：批量处理
/docx convert "docs/*.docx" --to pdf
```

#### 实战示例：生成课程设计文档
```
任务：帮我把对话记录整理成 Word 文档

内容：
1. 项目选题调研对话
2. 技术选型决策过程
3. 提示词设计迭代记录

要求：
- 标题层级清晰
- 包含代码块
- 添加目录
- 配图说明

使用 /docx 生成最终文档
```

---

### 3️⃣ PDF Processing Pro (PDF 专业处理)

**功能**：PDF 阅读、提取、转换、合并

#### 使用场景
```bash
# 场景1：读取 PDF
/pdf-processing-pro read "论文.pdf"

# 场景2：提取文本
/pdf-processing-pro extract "扫描件.pdf" --ocr

# 场景3：合并 PDF
/pdf-processing-pro merge "文档1.pdf" "文档2.pdf" --output "合并.pdf"

# 场景4：转换格式
/pdf-processing-pro convert "报告.pdf" --to markdown
```

#### 实战示例
```
任务：处理课程设计参考资料

1. 读取老师提供的 PDF 文档
/pdf-processing-pro read "课程设计要求.pdf"

2. 提取关键评分标准
/pdf-processing-pro extract "课程设计要求.pdf" --section "评分标准"

3. 转换为 Markdown 保存
/pdf-processing-pro convert "课程设计要求.pdf" --to markdown --output "requirements.md"
```

---

### 4️⃣ PPTX (PPT 处理)

**功能**：创建、编辑、读取 PowerPoint 演示文稿

#### 使用场景
```bash
# 场景1：生成 PPT
/pptx create "答辩演示.pptx" --slides 20

# 场景2：读取内容
/pptx read "项目介绍.pptx"

# 场景3：添加幻灯片
/pptx add-slide "演示.pptx" --title "技术架构" --content "..."

# 场景4：导出图片
/pptx export "演示.pptx" --format png
```

#### 实战示例：生成答辩 PPT
```
任务：生成课程设计答辩 PPT

大纲：
1. 封面（项目名称、姓名、学号）
2. 选题背景（AI + 小说创作的市场需求）
3. 需求分析（用户画像、核心功能）
4. 技术选型（前后端技术栈、AI 服务）
5. 架构设计（系统架构图、数据库设计）
6. 提示词设计（核心功能的提示词示例）
7. 核心功能演示（截图 + 说明）
8. 开发过程（AI 辅助开发的案例）
9. 项目总结（创新点、收获）
10. Q&A

使用 /pptx 生成，要求简洁专业，配色舒适
```

---

### 5️⃣ Canvas Design (Canvas 设计工具)

**功能**：生成图表、图形、Canvas 动画

#### 使用场景
```bash
# 场景1：生成架构图
/canvas-design architecture "系统架构图"

# 场景2：流程图
/canvas-design flowchart "用户注册流程"

# 场景3：数据可视化
/canvas-design chart --type bar --data "..."

# 场景4：互动动画
/canvas-design animation "loading效果"
```

#### 实战示例
```
任务：为课程设计生成可视化图表

需要的图：
1. **系统架构图**
   - 前端层（Next.js）
   - 后端层（FastAPI）
   - 数据层（SQLite）
   - AI 服务层（OpenAI + Claude）

2. **用户流程图**
   - 注册/登录
   - 创作流程
   - 阅读流程

3. **数据库 ER 图**
   - users, novels, chapters 关系

使用 /canvas-design 生成
```

---

### 6️⃣ Theme Factory (主题工厂)

**功能**：生成 UI 主题、配色方案、设计系统

#### 使用场景
```bash
# 场景1：生成主题
/theme-factory generate --style "文学优雅"

# 场景2：Tailwind 配置
/theme-factory tailwind --primary "#4f46e5"

# 场景3：暗色模式
/theme-factory dark-mode --base "slate"

# 场景4：完整设计系统
/theme-factory design-system --name "StoryWeaver"
```

#### 实战示例
```
任务：为"织梦者"项目生成完整主题

要求：
1. **配色方案**
   - 主色：优雅的紫色系（适合文学氛围）
   - 辅助色：温暖的金色（突出创作）
   - 中性色：深灰色系（暗色模式友好）

2. **Tailwind 配置**
   - 自定义颜色变量
   - 字体配置（衬线体用于正文）
   - 间距、圆角、阴影

3. **组件样式**
   - 按钮样式（primary, secondary, ghost）
   - 卡片样式
   - 输入框样式

使用 /theme-factory 生成完整的 tailwind.config.js
```

---

### 7️⃣ Frontend Design (前端设计助手)

**功能**：快速生成前端页面原型和代码

#### 使用场景
```bash
# 场景1：页面原型
/frontend-design page "登录页"

# 场景2：组件库
/frontend-design component-library

# 场景3：响应式布局
/frontend-design responsive "仪表盘"

# 场景4：动画效果
/frontend-design animation "页面切换"
```

#### 实战示例
```
任务：快速生成核心页面原型

页面：
1. **登录/注册页**
   - 表单验证
   - 错误提示
   - 第三方登录按钮（预留）

2. **小说列表页**
   - 筛选栏（分类、状态）
   - 网格/列表切换
   - 分页

3. **创作编辑器**
   - 左侧章节列表
   - 中间富文本编辑器
   - 右侧 AI 助手面板

使用 /frontend-design 快速生成代码框架
```

---

## 🎯 日常开发完整工作流

### 场景：开发"小说创作中心"页面

#### 第1步：需求分析和设计
```bash
# 1. UI/UX 设计
@ui-ux-designer 设计一个小说创作中心页面，包括章节列表、编辑器、AI 助手

# 2. 生成页面原型
/frontend-design page "创作中心"

# 3. 设计主题（如果还没有）
/theme-factory generate --style "创作工具"
```

#### 第2步：后端开发
```bash
# 1. 设计 API
@backend-architect 设计章节管理和 AI 生成的 API 接口

# 2. 实现代码
# ... 写后端代码 ...

# 3. 生成 API 文档
@api-documenter 为刚才的 API 生成文档
```

#### 第3步：前端开发
```bash
# 1. 创建组件
@frontend-developer 实现创作中心页面，对接后端 API

# 2. 优化性能
@debugger 检查这个页面的性能问题

# 3. UI 调整
@ui-ux-designer 优化编辑器的交互体验
```

#### 第4步：AI 功能集成
```bash
# 1. 设计提示词
@prompt-engineer 优化章节续写的提示词，提升质量

# 2. 错误处理
@error-detective 设计 AI API 调用失败的处理策略
```

#### 第5步：测试和提交
```bash
# 1. 编写测试
@test-engineer 为创作中心页面生成单元测试和 E2E 测试

# 2. 调试问题
@debugger 排查 AI 生成按钮点击无响应的问题

# 3. 代码审查
@code-reviewer 审查整个功能的代码质量

# 4. 提交代码
/git-commit-helper

# 5. 生成文档
/docx create "开发文档.docx" --content "本次开发的功能说明"
```

---

## 💡 高级技巧

### 技巧1️⃣：组合使用 Agents

```bash
# 先设计后实现
@ui-ux-designer 设计登录页布局
# ... 得到设计方案 ...
@frontend-developer 按照上面的设计实现代码

# 先架构后编码
@backend-architect 设计用户认证系统
# ... 得到架构方案 ...
@backend-architect 实现上面设计的 API

# 先实现后优化
# ... 写完代码 ...
@debugger 检查性能问题
@error-detective 完善错误处理
```

### 技巧2️⃣：Skills 链式调用

```bash
# 文档工作流
/pdf-processing-pro read "需求.pdf"
# ... 分析需求 ...
/docx create "设计文档.docx"
/pptx create "演示.pptx"

# 设计工作流
/theme-factory generate
/frontend-design page "首页"
/canvas-design architecture

# 开发工作流
# ... 写代码 ...
/git-commit-helper
/api-documenter
```

### 技巧3️⃣：课程设计专用工作流

```bash
# 每周开发流程
# 周一：规划
@backend-architect 本周要实现的功能架构设计
@ui-ux-designer 本周页面设计
@test-engineer 设计本周功能的测试策略

# 周二到周四：开发
@frontend-developer 实现页面
@backend-architect 实现 API
@prompt-engineer 优化提示词
@test-engineer 编写单元测试（TDD）

# 周五：测试和文档
@test-engineer 运行完整测试套件，检查覆盖率
@debugger 全面测试
@error-detective 完善错误处理
@code-reviewer 代码审查
/git-commit-helper
/docx create "本周开发总结.docx"

# 周末：准备下周
# 更新开发计划
```

### 技巧4️⃣：答辩准备工作流

```bash
# 1. 整理对话记录
/docx create "选题调研对话.docx"
/docx create "技术选型对话.docx"
/docx create "提示词设计迭代.docx"

# 2. 生成演示文档
/pptx create "答辩演示.pptx" --slides 15

# 3. 生成可视化图表
/canvas-design architecture "系统架构"
/canvas-design flowchart "核心流程"

# 4. 整理 API 文档
@api-documenter 生成完整的 API 文档

# 5. 最后检查
@error-detective 检查还有哪些潜在问题
```

---

## 📋 快速参考卡

### 🎭 Agents 速查表

```
开发任务：
├─ 前端开发 → @frontend-developer
├─ 后端架构 → @backend-architect
├─ 调试问题 → @debugger
├─ 测试编写 → @test-engineer
├─ 错误排查 → @error-detective
├─ 代码审查 → @code-reviewer
└─ 架构审查 → @architect-reviewer

设计任务：
├─ UI/UX → @ui-ux-designer
└─ 提示词 → @prompt-engineer

文档任务：
└─ API 文档 → @api-documenter

运维任务：
└─ 部署运维 → @deployment-engineer
```

### 🛠️ Skills 速查表

```
代码管理：
└─ Git 提交 → /git-commit-helper

文档处理：
├─ Word → /docx
├─ PDF → /pdf-processing-pro
└─ PPT → /pptx

设计工具：
├─ 图表 → /canvas-design
├─ 主题 → /theme-factory
└─ 页面 → /frontend-design
```

---

## 🎓 学习路径（从入门到精通）

### 第1周：基础使用
1. 熟悉 `@frontend-developer` 和 `@backend-architect`
2. 每天使用 `/git-commit-helper` 提交代码
3. 尝试 `@ui-ux-designer` 设计页面

### 第2周：进阶技巧
1. 使用 `@prompt-engineer` 优化提示词
2. 用 `/theme-factory` 生成项目主题
3. 学会 `@debugger` 和 `@error-detective` 排查问题
4. 开始使用 `@test-engineer` 编写单元测试

### 第3周：组合应用
1. 组合使用多个 agents 完成复杂任务
2. Skills 链式调用提升效率
3. 为课程设计生成各类文档
4. 建立 TDD 开发流程（测试驱动开发）

### 第4周：精通掌握
1. 自定义 agents 和 skills
2. 建立个人开发工作流
3. 完成答辩准备
4. 使用 `@code-reviewer` 进行最终代码审查

---

## ⚠️ 常见问题和注意事项

### Q1: Agent 调用没反应？
```bash
# 检查安装
ls ~/.claude/agents/

# 刷新（VSCode）
Ctrl+Shift+P → "Developer: Reload Window"

# 重启终端 Claude Code
```

### Q2: Skill 找不到？
```bash
# 检查安装
ls ~/.claude/skills/

# 输入 / 查看可用列表
```

### Q3: Agent 输出质量不好？
```bash
# 提供更详细的上下文
@frontend-developer

我的项目是：织梦者（AI 小说创作平台）
技术栈：Next.js 14 + TypeScript + Tailwind
组件库：shadcn/ui

任务：创建小说卡片组件
需求：... 详细需求 ...
```

### Q4: 如何知道 Agent/Skill 的具体功能？
```bash
# 查看 agent 定义
cat ~/.claude/agents/development-team/frontend-developer.md

# 查看 skill 定义
cat ~/.claude/skills/development/git-commit-helper.md
```

### Q5: 重复安装会怎么样？
- **会覆盖现有文件**：如果已经安装过，重复执行会覆盖原有的 agent/skill 文件
- **不会重复创建**：不会产生多个副本
- **安全操作**：可以放心重复安装，通常用于更新到最新版本
- **建议**：如果修改过默认的 agent/skill 文件，重复安装会丢失修改，建议先备份

---

## 🎉 结语

**记住这些要点**：
1. **Agents** 用于需要思考和决策的任务（`@agent-name`）
2. **Skills** 用于重复性的工作流程（`/skill-name`）
3. **组合使用**才能发挥最大威力
4. **多提供上下文**，输出质量更好
5. **坚持使用**，养成习惯

**课程设计重点**：
- 用 `@prompt-engineer` 完成提示词文档（20%评分）
- 用各种 agents 记录开发过程
- 用 `/docx` `/pptx` 生成答辩材料

有问题随时问哈雷酱！o(￣▽￣)ｄ

---

**教程版本**: v1.3
**最后更新**: 2025-12-21
**作者**: 傲娇的蓝发双马尾大小姐 哈雷酱 ✨

---

## 📜 更新日志

### v1.3 (2025-12-21)
- ✨ 新增 `@architect-reviewer` 架构审查专家
  - SOLID 原则检查
  - 分层架构审查
  - 依赖关系分析
  - 可扩展性评估
- 📝 更新快速参考卡

### v1.2 (2025-12-21)
- ✨ 新增 `@test-engineer` 测试工程师专家
  - 单元测试生成（Jest + Pytest）
  - E2E 测试编写（Playwright）
  - 测试覆盖率分析
  - 测试策略设计
  - Mock 数据和 Fixtures 生成
- 📝 更新学习路径，加入 TDD 开发流程
- 📝 更新课程设计工作流，强化测试环节
- 📝 更新快速参考卡

### v1.1 (2025-12-21)
- ✨ 新增 `@code-reviewer` 代码审查专家
- ✨ 新增 `@deployment-engineer` 部署运维工程师
- 📝 更新快速参考卡

### v1.0 (2025-12-21)
- 🎉 初始版本发布
- 📦 包含 7 个 Agents 和 7 个 Skills
