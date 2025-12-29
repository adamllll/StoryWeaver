# 贡献指南

感谢你对 **织梦者 (StoryWeaver)** 项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/adamllll/StoryWeaver/issues) 中搜索是否已有相同问题
2. 如果没有，创建新 Issue，包含：
   - 清晰的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（OS、浏览器、Node/Python 版本）

### 提交功能建议

1. 在 Issues 中创建 Feature Request
2. 描述功能的使用场景和预期效果

### 提交代码

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 开发规范

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

### 代码风格

**后端 (Python)**
- 遵循 PEP 8
- 使用类型注解
- 编写 docstring

**前端 (TypeScript)**
- 使用 ESLint 配置
- 避免使用 `any` 类型
- 组件使用函数式写法

### 测试要求

- 新功能需要添加对应测试
- 确保所有测试通过：
  ```bash
  # 后端
  cd backend && pytest

  # 前端
  cd frontend && npm test
  ```

## 本地开发

```bash
# 克隆你的 fork
git clone git@github.com:YOUR_USERNAME/StoryWeaver.git
cd StoryWeaver

# 启动开发环境
./start.sh
```

详细开发指南请参考 [README.md](README.md)。

## 行为准则

请保持友善和尊重，共同维护良好的社区氛围。

## 问题？

如有疑问，欢迎在 Issues 中提问或发起 Discussion。
