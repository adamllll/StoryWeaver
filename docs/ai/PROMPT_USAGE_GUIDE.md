# Prompt优化使用指南

## 快速开始

### 1. 查看新的Prompt

```bash
cd /path/to/story-weaver
python3 scripts/test_prompts.py
```

这会打印出新的重写和扩写Prompt，方便你检查。

### 2. 测试新功能

启动后端服务：

```bash
cd /home/adam/story-weaver/backend
source venv/bin/activate  # 如果使用虚拟环境
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动前端服务：

```bash
cd /home/adam/story-weaver/frontend
npm run dev
```

### 3. 测试用例

#### 测试用例1：短文本重写（保持原意）

**原文（72字）**：
```
李明走进房间，看到桌上放着一封信。他拿起信封，小心翼翼地拆开，里面是一张泛黄的纸条。纸条上写着："明天午夜，老地方见。"他皱起眉头，陷入了沉思。这笔迹，他似曾相识。
```

**期望输出**：
- 字数：65-80字
- 保留所有情节：进门、看信、拆信、读内容、思考、回忆
- 只改变表达方式

#### 测试用例2：短文本扩写

**原文（22字）**：
```
张三走进咖啡馆，点了一杯咖啡，坐下来等人。
```

**期望输出**：
- 字数：120-180字
- 保留所有情节：进门、点咖啡、坐下、等人
- 增加环境、动作、心理、对话等细节

## 核心改进

### 1. 添加了Few-shot示例

在System Prompt中添加了完整的示例：
- 错误示例：展示什么是"总结"（72字→9字）
- 正确示例：展示什么是"重写"（72字→68字）

### 2. 任务分解

在User Prompt中添加了4个明确的步骤：
1. 分析原文结构
2. 逐句重写/扩写
3. 检查字数
4. 输出最终结果

### 3. 多次重复字数要求

在不同位置用不同方式重复字数要求：
- 任务说明
- 字数控制部分
- 步骤说明
- 最后提醒

## 文件修改

修改的文件：
- `backend/app/utils/prompts.py`

修改的内容：
- `REWRITE_SYSTEM_PROMPT`：添加Few-shot示例
- `REWRITE_USER_TEMPLATE`：添加任务分解步骤
- `EXPAND_SYSTEM_PROMPT`：添加Few-shot示例
- `EXPAND_USER_TEMPLATE`：添加任务分解步骤
- `get_expand_prompt()`：添加字数计算逻辑

## 预期效果

### 重写功能

**优化前**：
- 原文 72 字 → 输出 9 字（❌ 总结）
- 原文 160 字 → 输出 18 字（❌ 总结）

**优化后**：
- 原文 72 字 → 输出 65-80 字（✅ 重写）
- 原文 160 字 → 输出 112-144 字（✅ 重写）

### 扩写功能

**优化前**：
- 原文 30 字，目标 150 字 → 输出 35 字（❌ 只加形容词）

**优化后**：
- 原文 30 字，目标 150 字 → 输出 120-180 字（✅ 真正扩写）

## 故障排查

### 问题1：字数仍然不足

**可能原因**：
- Gemini模型的temperature设置太低
- max_tokens设置太小

**解决方案**：
检查 `/home/adam/story-weaver/backend/app/services/ai_service.py` 中的参数设置：

```python
# 建议设置
temperature = 0.7  # 不要太低
max_tokens = 2000  # 确保足够大
```

### 问题2：输出包含说明性文字

**可能原因**：
- 模型没有遵守"直接输出"的指令

**解决方案**：
在后端添加后处理逻辑，去除开头的说明性文字：

```python
def clean_output(text: str) -> str:
    """去除输出中的说明性文字"""
    # 去除常见的开场白
    prefixes = [
        "以下是重写后的内容：",
        "重写后的文本：",
        "扩写后的内容：",
        "根据要求，",
    ]
    for prefix in prefixes:
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    return text
```

### 问题3：内容质量不佳

**可能原因**：
- 模型选择不当（Gemini-3-flash可能不够强）

**解决方案**：
尝试使用更强的模型：
- Gemini-3-pro
- Claude-3-sonnet
- GPT-4

## 详细文档

完整的优化报告请查看：
- `docs/ai/PROMPT_OPTIMIZATION_REPORT.md`

## 联系方式

如有问题，请查看项目文档或提交Issue。

---

**最后更新**：2025-12-27
