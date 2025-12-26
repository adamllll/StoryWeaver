# StoryWeaver Backend

AI 小说创作平台后端服务

## 快速开始

### 1. 创建虚拟环境

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

### 4. 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

| 模块 | 路径前缀 | 说明 |
|------|---------|------|
| 认证 | `/api/auth` | 注册、登录、获取当前用户 |
| 小说 | `/api/novels` | 小说 CRUD 操作 |
| 章节 | `/api/novels/{id}/chapters` | 章节 CRUD 操作 |
| AI | `/api/ai` | AI 内容生成 |

## 项目结构

```
backend/
├── app/
│   ├── main.py           # FastAPI 入口
│   ├── config.py         # 配置管理
│   ├── database.py       # 数据库连接
│   ├── models/           # SQLAlchemy 模型
│   ├── schemas/          # Pydantic 模型
│   ├── routers/          # API 路由
│   ├── services/         # 业务逻辑
│   └── utils/            # 工具函数
├── data/                 # SQLite 数据库文件
├── requirements.txt
├── .env.example
└── README.md
```
