# Repository Guidelines

## 项目结构与模块
- 根目录：`backend/` 为 FastAPI 服务，`frontend/` 为 Next.js 14 App Router 前端，`docs/` 为文档，`scripts/` 存通用脚本，`data/` 放本地数据库与示例数据。
- 后端：`app/` 内按 `routers/`（接口）、`services/`（业务）、`models/`（SQLAlchemy）、`schemas/`（Pydantic）分层；`tests/` 为 pytest 用例。
- 前端：`app/` 下页面与布局，`components/` 为 UI，`lib/` 为工具与状态，`__tests__/` 存 Jest/RTL 测试，`public/` 为静态资源。

## 构建、运行与开发
- 后端环境：`cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`。
- 后端开发/生产：`uvicorn app.main:app --reload --port 8000` / `uvicorn app.main:app --host 0.0.0.0 --port 8000`。
- 前端安装与开发：`cd frontend && npm install && npm run dev`（默认连 `http://localhost:8000/api`，自定义可写 `.env.local`）。
- 前端生产：`npm run build && npm run start`。
- 一键容器：`docker-compose up -d`（前后端组合，需预设环境变量）。

## 代码风格与命名
- Python：遵循 PEP 8，4 空格缩进，类型标注优先；模块与函数用 `snake_case`，Pydantic/SQLAlchemy 模型用 `PascalCase`。
- TypeScript/React：组件文件与导出用 `PascalCase`，工具与 hooks 用 `camelCase`；保持无 `any`，复用 `lib/api.ts` 与 Zustand store。
- Lint/格式化：前端执行 `npm run lint`（Next + ESLint）；后端保持导入有序与函数纯粹，必要时按业务模块拆分。
- 文本与资源：公共静态资源放 `public/`，脚本放 `scripts/`，避免在代码中硬编码密钥。

## 测试规范
- 后端：`cd backend && pytest`（markers：`unit`/`integration`/`slow`，测试文件模式 `tests/test_*.py`）；新增服务需最少覆盖主要路径（含失败分支）。
- 前端：`cd frontend && npm test`，开发时 `npm run test:watch`，覆盖率 `npm run test:coverage`；测试放 `__tests__` 对应模块旁，命名 `*.test.ts(x)`。

## 提交与 Pull Request
- 提交信息参考现有历史，使用类似 `fix: ...`、`feat: ...` 的简短动词前缀，描述单一变更。
- PR 要求：概述变更与动机，列出关键测试结果（命令+状态），关联 Issue/任务，前端改动附主要页面截图或说明交互差异。

## 安全与配置
- 环境变量：按 `backend/.env.example`、`frontend/.env.local` 模板填写，切勿提交密钥；本地 DB 在 `backend/data/`，必要时备份为 `*.backup.*`。
- 依赖更新：优先最小化变更，后端确认 Python 3.10+ 兼容，前端锁定 `package-lock.json`；变更后重新运行 lint 与核心测试。 
