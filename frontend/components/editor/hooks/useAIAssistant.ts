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

interface UseAIAssistantProps {
  novelId: number;
  currentChapter: Chapter | null;
  editorContent: string;
  onContentInsert: (content: string, replace?: boolean, title?: string) => void;
}

export function useAIAssistant({
  novelId,
  currentChapter,
  editorContent,
  onContentInsert,
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

  // 监听文本选择
  useEffect(() => {
    const handleSelectionChange = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || "";
        if (text !== selectedText) {
          setSelectedText(text);
        }
      }, 200);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [selectedText]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAILoading]);

  // 通用错误处理
  const handleError = useCallback((error: unknown, title: string) => {
    let message = "发生未知错误";
    if (error instanceof ApiError) {
      message = error.detail;
    } else if (error instanceof Error) {
      message = error.message;
    }

    setAiMessages((prev) => [
      ...prev,
      { role: "assistant", content: `❌ **${title}**\n\n${message}` },
    ]);

    toast({
      title,
      description: message,
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
      const plainText = editorContent.replace(/<[^>]*>/g, '').trim();
      const chapterOutline = plainText.substring(0, 500) || currentChapter.title;

      const result = await aiApi.continueChapter({
        novel_id: novelId,
        chapter_id: currentChapter.id,
        chapter_outline: chapterOutline,
        word_count: 800,  // 默认800字续写
        style: useStyle === "自动推断" ? undefined : useStyle,
      });

      addAiMessage(`**续写内容（${useStyle}）：**\n\n${result.content}\n\n---\n字数：${result.word_count}`);
      onContentInsert(result.content);
      toast({ title: "续写成功", description: `已生成 ${result.word_count} 字` });
    } catch (error) {
      handleError(error, "续写失败");
    } finally {
      setIsAILoading(false);
    }
  }, [currentChapter, editorContent, novelId, continueStyle, addUserMessage, addAiMessage, onContentInsert, handleError, toast]);

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
      const plainText = editorContent?.replace(/<[^>]*>/g, '').trim() || '';
      const result = await aiApi.continueChapter({
        novel_id: novelId,
        chapter_id: currentChapter.id,
        chapter_outline: plainText || currentChapter.title,
        word_count: 2000,  // 生成整章默认2000字
      });

      addAiMessage(`**生成整章：**\n\n${result.content}\n\n---\n字数：${result.word_count}`);
      onContentInsert(result.content, true, result.title);
      toast({ title: "生成成功", description: `已生成 ${result.word_count} 字` });
    } catch (error) {
      handleError(error, "生成失败");
    } finally {
      setIsAILoading(false);
    }
  }, [currentChapter, editorContent, novelId, addUserMessage, addAiMessage, onContentInsert, handleError, toast]);

  // 3. 扩写
  const handleAIExpand = useCallback(async () => {
    if (!selectedText || selectedText.length < 5) return;

    setIsAILoading(true);
    addUserMessage(`请扩写：${selectedText.substring(0, 30)}...`);

    try {
      const result = await aiApi.expandText({ text: selectedText, style: "详细描写" });
      addAiMessage(`**扩写结果：**\n\n${result.expanded_text}\n\n（请手动复制到编辑器中替换原文）`);
    } catch (error) {
      handleError(error, "扩写失败");
    } finally {
      setIsAILoading(false);
    }
  }, [selectedText, addUserMessage, addAiMessage, handleError]);

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
      addAiMessage(`**重写结果（${useStyle}）：**\n\n${result.rewritten_text}\n\n---\n原文 ${result.original_word_count} 字 → 重写后 ${result.rewritten_word_count} 字`);
    } catch (error) {
      handleError(error, "重写失败");
    } finally {
      setIsAILoading(false);
    }
  }, [selectedText, novelId, currentChapter, rewriteStyle, addUserMessage, addAiMessage, handleError]);

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

    // 方法
    clearMessages,
    clearSelectedText,
    handleAIContinue,
    handleAIGenerateChapter,
    handleAIExpand,
    handleAIRewrite,
    handleOptimizeFormat,
    handleCustomSubmit,
  };
}
