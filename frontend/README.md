# StoryWeaver Frontend

织梦者 AI 小说创作平台前端

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
# 或者
pnpm install
```

### 2. 配置环境变量（可选）

如果后端不在默认地址，创建 `.env.local`：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm run start
```

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖率

| 模块 | 覆盖率 | 说明 |
|------|--------|------|
| `lib/utils.ts` | 100% | 工具函数 |
| `lib/store.ts` | 100% | Zustand 状态管理 |
| `lib/api.ts` | 94% | API 客户端 |
| `lib/adventure-store.ts` | 100% | 冒险模式状态 |
| `lib/markdown.ts` | 97% | Markdown 处理 |
| `components/adventure/*` | 67%+ | 冒险模式组件 |

### 测试文件结构

```
__tests__/
├── lib/
│   ├── api.test.ts           # API 客户端测试
│   ├── utils.test.ts         # 工具函数测试
│   ├── markdown.test.ts      # Markdown 测试
│   ├── store.test.ts         # 状态管理测试
│   └── adventure-store.test.ts # 冒险模式状态测试
├── hooks/
│   ├── useChapters.test.ts   # 章节 Hook 测试
│   └── useAutoSave.test.ts   # 自动保存 Hook 测试
└── components/
    ├── adventure/
    │   ├── ChoiceCards.test.tsx
    │   ├── PlayerStatePanel.test.tsx
    │   └── StoryDisplay.test.tsx
    └── editor/
        └── AIAssistant.test.tsx
```

## 项目结构

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── (auth)/            # 认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── novels/            # 小说相关页面
│   │   ├── page.tsx       # 小说列表
│   │   └── [id]/          # 小说详情
│   └── workspace/         # 创作中心
│       ├── page.tsx       # 创作工作台
│       └── [id]/          # 编辑器
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── novel/            # 小说业务组件
│   └── ai/               # AI 功能组件
├── lib/                  # 工具函数
│   ├── api.ts           # API 客户端
│   ├── store.ts         # Zustand 状态管理
│   └── utils.ts         # 通用工具函数
├── public/              # 静态资源
└── styles/              # 样式文件
```

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui
- **状态管理**: Zustand
- **HTTP 客户端**: 原生 Fetch API

## 开发规范

### 组件命名

- 使用 PascalCase 命名组件文件
- 页面组件使用 `page.tsx`
- 布局组件使用 `layout.tsx`

### 样式规范

- 优先使用 Tailwind CSS 类名
- 组件变体使用 `class-variance-authority`
- 复杂组件可以使用 CSS Modules

### 状态管理

- 全局状态使用 Zustand
- 服务端状态可以使用 React Server Components
- 表单状态使用 React Hook Form（如需要）
