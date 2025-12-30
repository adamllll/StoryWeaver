/**
 * AI 助手自定义 Hook
 * 处理所有 AI 相关的状态和逻辑
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { aiApi, ApiError } from "@/lib/api";
import { AIMessage, Chapter } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

// 预设风格选项
export const CONTINUE_STYLES = ["自动推断", "热血爽文", "细腻感人", "紧张刺激", "轻松幽默", "严肃正剧"];
export const REWRITE_STYLES = ["保持原意", "增强感染力", "简化表达", "改变视角", "增加对话", "增加描写"];

// 重试操作类型
type RetryableAction = "continue" | "generate_chapter" | "expand" | "rewrite" | "optimize" | null;

interface UseAIAssistantProps {
  novelId: number;
  currentChapter: Chapter | null;
  editorContent: string;
  onContentInsert: (content: string, replace?: boolean, title?: string) => void;
  getCursorPosition?: () => number | null;  // 获取当前光标位置的回调（可选）
  novelOutline?: string;  // 小说大纲（用于整章生成时参考）
}

export function useAIAssistant({
  novelId,
  currentChapter,
  editorContent,
  onContentInsert,
  getCursorPosition,
  novelOutline,
}: UseAIAssistantProps) {
  const { toast } = useToast();
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 风格状态
  const [continueStyle, setContinueStyle] = useState<string>("自动推断");
  const [rewriteStyle, setRewriteStyle] = useState<string>("保持原意");

  // 选中文本状态
  const [selectedText, setSelectedText] = useState<string>("");

  // 格式优化相关
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 重试相关状态
  const [lastAction, setLastAction] = useState<RetryableAction>(null);
  const [canRetry, setCanRetry] = useState(false);
  const lastActionParamsRef = useRef<Record<string, unknown>>({});

  // 监听文本选择 - 使用 ref 避免依赖循环
  const selectedTextRef = useRef(selectedText);
  selectedTextRef.current = selectedText;

  useEffect(() => {
    const handleSelectionChange = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || "";
        if (text !== selectedTextRef.current) {
          setSelectedText(text);
        }
      }, 200);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAILoading]);

  // 通用错误处理
  const handleError = useCallback((error: unknown, title: string, action?: RetryableAction) => {
    let message = "发生未知错误";
    let isRetryable = false;

    if (error instanceof ApiError) {
      message = error.detail;
      // 检测可重试的错误
      isRetryable = error.retryable === true ||
        error.code === "json_parse_error" ||
        error.status === 422 ||
        error.status === 503;
    } else if (error instanceof Error) {
      message = error.message;
    }

    // 设置重试状态
    if (isRetryable && action) {
      setCanRetry(true);
      setLastAction(action);
    } else {
      setCanRetry(false);
      setLastAction(null);
    }

    // 构建错误消息
    const retryHint = isRetryable ? "\n\n💡 **可以点击「重新生成」按钮重试**" : "";
    setAiMessages((prev) => [
      ...prev,
      { role: "assistant", content: `❌ **${title}**\n\n${message}${retryHint}` },
    ]);

    toast({
      title,
      description: isRetryable ? `${message}（可重试）` : message,
      variant: "destructive",
    });
  }, [toast]);

  // 添加用户消息
  const addUserMessage = useCallback((content: string) => {
    setAiMessages((prev) => [...prev, { role: "user", content }]);
  }, []);

  // 添加 AI 消息
  const addAiMessage = useCallback((content: string) => {
    setAiMessages((prev) => [...prev, { role: "assistant", content }]);
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setAiMessages([]);
  }, []);

  // 清除选中文本
  const clearSelectedText = useCallback(() => {
    setSelectedText("");
  }, []);

  // === AI 功能实现 ===

  // 1. 智能续写
  const handleAIContinue = useCallback(async (style?: string) => {
    const useStyle = style || continueStyle;

    if (!currentChapter || !editorContent || editorContent.trim().length < 10) {
      toast({ title: "无法续写", description: "请先输入至少 10 个字的内容", variant: "destructive" });
      return;
    }

    setIsAILoading(true);
    addUserMessage(`请${useStyle === "自动推断" ? "" : `以【${useStyle}】风格`}续写`);

    try {
      // 获取光标位置（如果提供了回调）
      const cursorPosition = getCursorPosition?.() ?? undefined;

      // 智能续写模式：不需要显式的大纲，而是依赖上下文
      // 如果有 novelOutline，可以作为参考传入，但不要把正文当大纲传
      const result = await aiApi.continueChapter({
        novel_id: novelId,
        chapter_id: currentChapter.id,
        chapter_outline: novelOutline ? `小说背景大纲：\n${novelOutline.substring(0, 500)}` : "",
        word_count: 800,  // 默认800字续写
        style: useStyle === "自动推断" ? undefined : useStyle,
        cursor_position: cursorPosition,  // 传递光标位置
        mode: "continue",
      });

      addAiMessage(`**续写内容（${useStyle}）：**\n\n${result.content}\n\n---\n字数：${result.word_count}`);
      onContentInsert(result.content);
      setCanRetry(false);  // 成功后清除重试状态
      toast({ title: "续写成功", description: `已生成 ${result.word_count} 字` });
    } catch (error) {
      // 保存请求参数以供重试
      lastActionParamsRef.current = { style: useStyle };
      handleError(error, "续写失败", "continue");
    } finally {
      setIsAILoading(false);
    }
  }, [currentChapter, editorContent, novelId, continueStyle, getCursorPosition, addUserMessage, addAiMessage, onContentInsert, handleError, toast, novelOutline]);

  // 2. 生成整章
  const handleAIGenerateChapter = useCallback(async () => {
    if (!currentChapter) {
      toast({ title: "无法生成", description: "请先选择章节", variant: "destructive" });
      return;
    }

    // 智能判断逻辑：内容充足时建议创建新章节
    const textLength = editorContent?.replace(/<[^>]*>/g, "").trim().length || 0;

    if (textLength > 1000) {
      // 内容充足，建议创建新章节
      const shouldCreateNew = window.confirm(
        `当前章节内容已有 ${textLength} 字，建议创建新章节。\n\n点击"确定"返回章节列表创建新章节\n点击"取消"继续在当前章节使用续写功能`
      );

      if (shouldCreateNew) {
        toast({
          title: "请创建新章节",
          description: "请在左侧章节列表点击【新建章节】，然后使用生成整章功能",
          duration: 5000
        });
        return;
      } else {
        toast({
          title: "建议使用续写",
          description: "当前章节内容较多，建议使用【智能续写】功能继续创作",
          duration: 5000
        });
        return;
      }
    }

    setIsAILoading(true);
    addUserMessage("请生成整章内容");

    try {
      // 优先使用小说大纲，其次使用章节标题，最后使用当前内容
      const chapterOutlineText = novelOutline
        ? `根据小说大纲创作：\n${novelOutline.substring(0, 1000)}`
        : currentChapter.title || "请自由发挥创作";

      const result = await aiApi.continueChapter({
        novel_id: novelId,
        chapter_id: currentChapter.id,
        chapter_outline: chapterOutlineText,  // 关键修复：使用小说大纲
        word_count: 2000,  // 生成整章默认2000字
        mode: "generate_chapter",
      });

      addAiMessage(`**生成整章：**\n\n${result.content}\n\n---\n字数：${result.word_count}`);
      onContentInsert(result.content, true, result.title);
      setCanRetry(false);  // 成功后清除重试状态
      toast({ title: "生成成功", description: `已生成 ${result.word_count} 字` });
    } catch (error) {
      // 保存请求参数以供重试
      lastActionParamsRef.current = {};
      handleError(error, "生成失败", "generate_chapter");
    } finally {
      setIsAILoading(false);
    }
  }, [currentChapter, editorContent, novelId, novelOutline, addUserMessage, addAiMessage, onContentInsert, handleError, toast]);

  // 3. 扩写
  const handleAIExpand = useCallback(async () => {
    if (!selectedText || selectedText.length < 5) return;

    setIsAILoading(true);
    // 计算目标字数：默认500字，或原文的5倍（取较大值）
    const targetWordCount = Math.max(500, selectedText.length * 5);
    addUserMessage(`请扩写：${selectedText.substring(0, 30)}...（目标${targetWordCount}字）`);

    try {
      const toPlainTextWithBreaks = (html: string): string => {
        if (!html) return "";
        return html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?p[^>]*>/gi, "\n\n")
          .replace(/<\/?div[^>]*>/gi, "\n\n")
          .replace(/<\/?h[1-6][^>]*>/gi, "\n\n")
          .replace(/<\/?li[^>]*>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      };

      const plainText = toPlainTextWithBreaks(editorContent || "");
      const paragraphs = plainText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      const contextRadius = 2000;
      const maxContextLength = 3000;

      const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();
      const buildNormalizedMap = (value: string) => {
        let normalized = "";
        const map: number[] = [];
        let lastWasSpace = false;

        for (let i = 0; i < value.length; i += 1) {
          const char = value[i];
          if (/\s/.test(char)) {
            if (!lastWasSpace) {
              normalized += " ";
              map.push(i);
              lastWasSpace = true;
            }
          } else {
            normalized += char;
            map.push(i);
            lastWasSpace = false;
          }
        }

        return { normalized, map };
      };

      let matchIndex = plainText.indexOf(selectedText);
      let matchEndIndex = matchIndex >= 0 ? matchIndex + selectedText.length : -1;

      if (matchIndex < 0) {
        const normalizedText = buildNormalizedMap(plainText);
        const normalizedSelection = normalizeWhitespace(selectedText);
        const normalizedIndex = normalizedSelection
          ? normalizedText.normalized.indexOf(normalizedSelection)
          : -1;

        if (normalizedIndex >= 0) {
          const mappedStart = normalizedText.map[normalizedIndex];
          if (typeof mappedStart === "number") {
            matchIndex = mappedStart;
          }

          const normalizedEndIndex = normalizedIndex + normalizedSelection.length - 1;
          const mappedEnd = normalizedText.map[normalizedEndIndex];
          if (typeof mappedEnd === "number") {
            matchEndIndex = mappedEnd + 1;
          }
        }
      }

      let paragraphIndex = -1;
      if (matchIndex >= 0) {
        let cursor = 0;
        for (let i = 0; i < paragraphs.length; i += 1) {
          const length = paragraphs[i].length;
          const end = cursor + length;
          if (matchIndex >= cursor && matchIndex <= end) {
            paragraphIndex = i;
            break;
          }
          cursor = end + 2;
        }
      }

      const paragraphBefore = paragraphIndex > 0
        ? paragraphs.slice(Math.max(0, paragraphIndex - 2), paragraphIndex).join("\n\n")
        : "";
      const paragraphAfter = paragraphIndex >= 0
        ? paragraphs.slice(paragraphIndex + 1, paragraphIndex + 3).join("\n\n")
        : "";

      const hasMatch = matchIndex >= 0;
      const contextBeforeRaw = hasMatch
        ? plainText.slice(Math.max(0, matchIndex - contextRadius), matchIndex)
        : plainText.slice(0, contextRadius);
      const afterStart = hasMatch && matchEndIndex > 0 ? matchEndIndex : 0;
      const contextAfterRaw = hasMatch
        ? plainText.slice(afterStart, afterStart + contextRadius)
        : plainText.slice(Math.max(0, plainText.length - contextRadius));

      const contextBefore = [paragraphBefore, contextBeforeRaw]
        .filter(Boolean)
        .join("\n\n---\n\n")
        .slice(-maxContextLength);
      const contextAfter = [contextAfterRaw, paragraphAfter]
        .filter(Boolean)
        .join("\n\n---\n\n")
        .slice(0, maxContextLength);

      const positionPercent = matchIndex >= 0 && plainText.length > 0
        ? Math.round((matchIndex / plainText.length) * 100)
        : null;
      const positionHint = positionPercent === null
        ? "未知（未定位到选中文本，已提供章节首尾上下文）"
        : paragraphIndex >= 0
          ? `第 ${paragraphIndex + 1} 段 / 共 ${paragraphs.length} 段（约 ${positionPercent}%）`
          : positionPercent < 25
            ? `开头（约 ${positionPercent}%）`
            : positionPercent < 75
              ? `中段（约 ${positionPercent}%）`
              : `结尾（约 ${positionPercent}%）`;

      const result = await aiApi.expandText({
        text: selectedText,
        style: "详细描写",
        word_count: targetWordCount,  // 关键修复：传递目标字数
        chapter_title: currentChapter?.title,
        context_before: contextBefore,
        context_after: contextAfter,
        position_hint: positionHint,
      });
      const warningNote = result.warning ? `\n\n⚠️ ${result.warning}` : "";
      addAiMessage(`**扩写结果：**\n\n${result.expanded_text}\n\n---\n原文 ${selectedText.length} 字 → 扩写后 ${result.word_count} 字\n\n（请手动复制到编辑器中替换原文）${warningNote}`);
      if (result.warning) {
        toast({
          title: "扩写字数未达标",
          description: result.warning,
        });
      }
    } catch (error) {
      handleError(error, "扩写失败");
    } finally {
      setIsAILoading(false);
    }
  }, [selectedText, editorContent, currentChapter?.title, addUserMessage, addAiMessage, handleError, toast]);

  // 4. 重写
  const handleAIRewrite = useCallback(async (style?: string) => {
    const useStyle = style || rewriteStyle;

    if (!selectedText || selectedText.length < 5) return;

    setIsAILoading(true);
    addUserMessage(`请以【${useStyle}】风格重写：${selectedText.substring(0, 30)}...`);

    try {
      const result = await aiApi.rewrite({
        novel_id: novelId,
        chapter_id: currentChapter?.id,
        original_text: selectedText,
        rewrite_style: useStyle,
      });
      const warningNote = result.warning ? `\n\n⚠️ ${result.warning}` : "";
      addAiMessage(`**重写结果（${useStyle}）：**\n\n${result.rewritten_text}\n\n---\n原文 ${result.original_word_count} 字 → 重写后 ${result.rewritten_word_count} 字${warningNote}`);
      if (result.warning) {
        toast({
          title: "重写字数未达标",
          description: result.warning,
        });
      }
    } catch (error) {
      handleError(error, "重写失败");
    } finally {
      setIsAILoading(false);
    }
  }, [selectedText, novelId, currentChapter, rewriteStyle, addUserMessage, addAiMessage, handleError, toast]);

  // 5. 格式优化
  const handleOptimizeFormat = useCallback(async () => {
    if (!currentChapter) return;
    if (!editorContent || editorContent.trim().length < 50) {
      toast({ title: "无法优化", description: "内容太少，无需优化", variant: "destructive" });
      return;
    }

    setIsOptimizing(true);
    setIsOptimizeDialogOpen(true);

    try {
      const result = await aiApi.optimizeFormat({ chapter_id: currentChapter.id });
      setOptimizedContent(result.optimized_content);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({ title: "优化失败", description: error.detail, variant: "destructive" });
        setIsOptimizeDialogOpen(false);
      }
    } finally {
      setIsOptimizing(false);
    }
  }, [currentChapter, editorContent, toast]);

  // 6. 自定义对话
  const handleCustomSubmit = useCallback(async () => {
    if (!customPrompt.trim()) return;

    const prompt = customPrompt;
    setCustomPrompt("");
    setIsAILoading(true);
    addUserMessage(prompt);

    try {
      const result = await aiApi.continueChapter({
        novel_id: novelId,
        chapter_id: currentChapter?.id || 0,
        chapter_outline: prompt,
        style: "自由对话",
      });
      addAiMessage(result.content);
    } catch {
      addAiMessage("收到你的指令。但在当前版本中，我主要专注于根据上下文进行创作。请尝试使用快捷指令按钮。");
    } finally {
      setIsAILoading(false);
    }
  }, [customPrompt, novelId, currentChapter, addUserMessage, addAiMessage]);

  // 重试功能
  const handleRetry = useCallback(async () => {
    if (!canRetry || !lastAction) return;

    // 清除重试状态
    setCanRetry(false);
    const params = lastActionParamsRef.current;

    switch (lastAction) {
      case "continue":
        await handleAIContinue(params.style as string | undefined);
        break;
      case "generate_chapter":
        await handleAIGenerateChapter();
        break;
      case "expand":
        await handleAIExpand();
        break;
      case "rewrite":
        await handleAIRewrite(params.style as string | undefined);
        break;
      case "optimize":
        await handleOptimizeFormat();
        break;
      default:
        break;
    }
  }, [canRetry, lastAction, handleAIContinue, handleAIGenerateChapter, handleAIExpand, handleAIRewrite, handleOptimizeFormat]);

  return {
    // 状态
    aiMessages,
    isAILoading,
    customPrompt,
    setCustomPrompt,
    messagesEndRef,
    continueStyle,
    setContinueStyle,
    rewriteStyle,
    setRewriteStyle,
    selectedText,
    isOptimizeDialogOpen,
    setIsOptimizeDialogOpen,
    optimizedContent,
    isOptimizing,
    canRetry,  // 新增：是否可以重试

    // 方法
    clearMessages,
    clearSelectedText,
    handleAIContinue,
    handleAIGenerateChapter,
    handleAIExpand,
    handleAIRewrite,
    handleOptimizeFormat,
    handleCustomSubmit,
    handleRetry,  // 新增：重试功能
  };
}
