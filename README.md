# 织梦者 (StoryWeaver)

[![CI/CD Pipeline](https://github.com/adamllll/StoryWeaver/actions/workflows/ci.yml/badge.svg)](https://github.com/adamllll/StoryWeaver/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🎭 AI 驱动的小说创作与互动阅读平台

## ✨ 项目简介

织梦者是一个创新的 AI 小说创作平台，结合了"小说创作工具"和"互动式文字冒险"两种形态：

- **🖊️ AI 辅助创作**：为小说创作者提供 AI 大纲生成、章节续写、角色设定等辅助功能
- **🎮 互动式阅读**：为读者提供可选择剧情走向的互动式冒险体验
- **🌳 分支叙事**：支持多结局、分支剧情的复杂故事架构

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **后端** | Python 3.12 / FastAPI / SQLAlchemy / SQLite / httpOnly Cookie + JWT |
| **前端** | Next.js 14 / TypeScript / Tailwind CSS / shadcn/ui |
| **AI** | OpenAI API / Claude API（可选）|
| **部署** | Docker / GitHub Actions CI/CD |

## 📋 环境要求

- **操作系统**: Linux / macOS / WSL2
- **Python**: 3.10+
- **Node.js**: 18+
- **Docker**: 20+（生产部署）

## 🚀 快速开始

### 方式一：一键启动（开发环境）

```bash
# 克隆项目
git clone git@github.com:adamllll/StoryWeaver.git
cd StoryWeaver

# 赋予执行权限并启动
chmod +x start.sh
./start.sh
```

### 方式二：Docker 部署（生产环境）

```bash
# 1. 创建环境变量文件
cat > backend/.env << EOF
JWT_SECRET_KEY=你的超级安全密钥-至少32位随机字符
OPENAI_API_KEY=sk-your-api-key
OPENAI_API_BASE=https://api.openai.com/v1
DATABASE_URL=sqlite:///./data/story.db
DEBUG=false
FRONTEND_URL=https://your-domain.com
EOF

# 2. 创建数据目录
mkdir -p data

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f
```

**服务端口**：
- 后端 API：`http://localhost:8000`
- 前端应用：`http://localhost:3000`

### 方式三：手动启动

<details>
<summary>点击展开详细步骤</summary>

#### 后端启动

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
nano .env  # 填入必要的配置

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动开发服务器
npm run dev
```

</details>

## 📁 项目结构

```
StoryWeaver/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── config.py          # 配置管理
│   │   ├── database.py        # 数据库连接
│   │   ├── models/            # ORM 模型
│   │   ├── schemas/           # Pydantic 模式
│   │   ├── routers/           # API 路由
│   │   │   └── adventures/    # 冒险模块（模块化）
│   │   ├── services/          # 业务逻辑
│   │   └── utils/             # 工具函数
│   ├── alembic/               # 数据库迁移
│   ├── tests/                 # 单元测试
│   ├── Dockerfile             # 后端容器镜像
│   └── requirements.txt
│
├── frontend/                   # Next.js 前端
│   ├── app/                   # App Router 页面
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   └── editor/           # 富文本编辑器
│   ├── lib/                   # 工具库
│   ├── __tests__/             # Jest 测试
│   ├── Dockerfile             # 前端容器镜像
│   └── package.json
│
├── scripts/                    # 运维脚本
│   └── backup.sh              # 数据库备份
│
├── data/                       # 数据目录（git忽略）
├── docker-compose.yml          # 服务编排
├── .github/workflows/ci.yml    # CI/CD 配置
└── README.md
```

## ✅ 功能状态

### 已完成 ✅

| 模块 | 功能 |
|------|------|
| **认证系统** | 用户注册/登录、httpOnly Cookie + JWT、安全密码哈希 (Argon2) |
| **小说管理** | CRUD、发布、分类、封面 |
| **章节系统** | 创建/编辑/删除、拖拽排序、富文本编辑 |
| **AI 创作** | 大纲生成、章节续写、一键扩写、格式优化 |
| **互动系统** | 分支选项、AI 动态生成、分支树可视化 |
| **冒险模式** | 文字冒险游戏、存档分叉、多结局 |
| **角色管理** | 角色设定、世界观配置 |
| **单元测试** | 168+ 测试用例、Service 层架构优化、高覆盖率 |
| **性能优化** | 数据库复合索引、API 速率限制 (slowapi) |
| **容器化** | Docker 部署、CI/CD 流水线、数据库备份 |

### 进行中 🔄

- [ ] 一致性审校（检测剧情冲突）
- [ ] 导出功能（TXT/PDF）
- [ ] 阅读统计仪表盘

## 📡 API 端点

| 模块 | 前缀 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 注册、登录 |
| 小说 | `/api/novels` | 小说 CRUD、发布 |
| 章节 | `/api/novels/{id}/chapters` | 章节管理 |
| AI | `/api/ai` | 大纲、续写、扩写生成 |
| 角色 | `/api/characters` | 角色管理 |
| 冒险 | `/api/adventures` | 互动冒险游戏 |
| 健康检查 | `/api/health` | 服务状态 |

📖 完整 API 文档：启动后访问 `http://localhost:8000/docs`

## 🧪 测试

```bash
# 后端测试
cd backend
source venv/bin/activate
pytest --cov=app

# 前端测试
cd frontend
npm run test:coverage
```

## 🔐 安全配置

生产环境部署前，请确保：

- [ ] 修改 `JWT_SECRET_KEY`（至少 32 位随机字符）
- [ ] 设置 `DEBUG=false`
- [ ] 配置正确的 `FRONTEND_URL`（CORS 白名单）
- [ ] 使用 HTTPS（保护 httpOnly Cookie）
- [ ] 设置数据库文件权限
- [ ] 配置 API 速率限制参数

## 📦 数据库备份

```bash
# 手动备份
./scripts/backup.sh

# 定时备份（每天凌晨 3 点）
crontab -e
# 添加：0 3 * * * /path/to/StoryWeaver/scripts/backup.sh >> /var/log/backup.log 2>&1
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交代码：`git commit -m "feat: 添加某某功能"`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 📄 License

[MIT License](LICENSE)

---

**最后更新**: 2026-01-10 | **项目状态**: MVP 完成，持续优化中
