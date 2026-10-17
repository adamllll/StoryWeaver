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

## SQLite 升级说明

`uvicorn app.main:app`（包括 Docker 默认启动命令）会在接受请求前执行
`init_db()`：旧版无 Alembic 版本表的数据库直接使用与 `4189a0c4123b`
相同的幂等迁移，不重放初始建表 revision。缓存计数包含全部章节（含分支），
字数使用原始 `content` 的字符长度；空值/无章节为 0。重复启动保留已回填值，
旧迁移只完成部分列/回填而未设置默认值的状态也可恢复。SQLite DDL 与回填
使用显式事务；需要补默认值时使用 Alembic batch，关闭外键仅限迁移连接并在
结束后恢复，同时检查外键完整性。异常会阻止启动，不继续假成功。

上线前停写并用 SQLite backup API 备份数据库；如需回滚，停止应用并恢复备份
以及原镜像，**不要假设新 schema 可以直接交给旧二进制**。批量重建发现 novels
自定义触发器时会拒绝执行，需先人工审查。PostgreSQL revision 保留原有
`ALTER COLUMN SET DEFAULT` 语义。缓存列暂不用于响应计数，直到所有章节写入
路径都维护缓存，避免升级后计数停滞。

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
