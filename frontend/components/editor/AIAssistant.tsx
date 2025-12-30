/**
 * AI 创作助手组件 - 重构版
 *
 * 核心特性：
 * - 沉浸式对话体验
 * - 上下文感知操作栏 (Context-Aware Action Bar)
 * - 物理质感与光学模糊 (Glassmorphism)
 * - 流畅的 Framer Motion 动画
 *
 * 组件结构：
 * - AIAssistantHeader: 顶部标题栏
 * - AIMessageList: 消息列表
 * - AIActionBar: 底部操作区
 * - useAIAssistant: 状态和逻辑 Hook
 */

"use client";

import { AIAssistantProps } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { markdownToHtml } from "@/lib/markdown";
import { ComparisonDialog } from "./ComparisonDialog";
import { AIAssistantHeader } from "./AIAssistantHeader";
import { AIMessageList } from "./AIMessageList";
import { AIActionBar } from "./AIActionBar";
import { useAIAssistant } from "./hooks/useAIAssistant";

export function AIAssistant({
  novelId,
  currentChapter,
  editorContent,
  onContentInsert,
  novelOutline,
}: AIAssistantProps) {
  const { toast } = useToast();

  const {
    // 状态
    aiMessages,
    isAILoading,
    customPrompt,
    setCustomPrompt,
    messagesEndRef,
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
  } = useAIAssistant({
    novelId,
    currentChapter,
    editorContent,
    onContentInsert,
    novelOutline,  // 关键修复：传递小说大纲
  });

  return (
    <div className="flex flex-col h-full relative">
      {/* 顶部标题栏 */}
      <AIAssistantHeader novelId={novelId} onClearMessages={clearMessages} />

      {/* 消息列表区域 */}
      <AIMessageList
        messages={aiMessages}
        isLoading={isAILoading}
        messagesEndRef={messagesEndRef}
      />

      {/* 底部操作区 */}
      <AIActionBar
        selectedText={selectedText}
        customPrompt={customPrompt}
        isAILoading={isAILoading}
        isOptimizing={isOptimizing}
        currentChapter={currentChapter}
        canRetry={canRetry}
        onClearSelectedText={clearSelectedText}
        onCustomPromptChange={setCustomPrompt}
        onCustomSubmit={handleCustomSubmit}
        onContinue={handleAIContinue}
        onGenerateChapter={handleAIGenerateChapter}
        onExpand={handleAIExpand}
        onRewrite={handleAIRewrite}
        onOptimizeFormat={handleOptimizeFormat}
        onRetry={handleRetry}
      />

      {/* 格式优化对比弹窗 */}
      <ComparisonDialog
        isOpen={isOptimizeDialogOpen}
        onClose={() => setIsOptimizeDialogOpen(false)}
        originalContent={editorContent || ""}
        optimizedContent={optimizedContent}
        changesSummary="AI 已优化文本格式，包括段落分隔、标点规范、对话格式等"
        onApply={() => {
          onContentInsert(markdownToHtml(optimizedContent), true);
          setIsOptimizeDialogOpen(false);
          toast({ title: "已应用优化", description: "内容已更新" });
        }}
        isLoading={isOptimizing}
      />
    </div>
  );
}
