/**
 * 批量格式优化弹窗 - Zen-iOS Hybrid 重构版
 */

"use client";

import { useState } from "react";
import { Check, Loader2, Eye, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ChapterSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OptimizationResult {
  chapterId: number;
  status: "pending" | "processing" | "success" | "error";
  originalContent?: string;
  optimizedContent?: string;
  changesSummary?: string;
  error?: string;
}

interface BatchOptimizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterSummary[];
  onOptimize: (chapterIds: number[]) => Promise<void>;
  onPreview: (chapterId: number) => void;
}

export function BatchOptimizeDialog({
  isOpen,
  onClose,
  chapters,
  onOptimize,
  onPreview,
}: BatchOptimizeDialogProps) {
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [currentStep, setCurrentStep] = useState<"select" | "processing" | "complete">("select");

  // 切换章节选择
  const toggleChapter = (chapterId: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedChapters.length === chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(chapters.map((c) => c.id));
    }
  };

  // 开始批量优化
  const handleStartOptimize = async () => {
    if (selectedChapters.length === 0) return;

    setCurrentStep("processing");

    // 初始化结果
    const initialResults: OptimizationResult[] = selectedChapters.map((id) => ({
      chapterId: id,
      status: "pending",
    }));
    setResults(initialResults);

    try {
      await onOptimize(selectedChapters);
      setCurrentStep("complete");
    } catch (error) {
      console.error("批量优化失败:", error);
    }
  };

  // 计算进度
  const progress = results.length > 0
    ? (results.filter((r) => r.status === "success" || r.status === "error").length / results.length) * 100
    : 0;

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 bg-white/80 backdrop-blur-3xl border-white/40 shadow-ios-float overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-gray-100/50 bg-white/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">批量格式优化</DialogTitle>
              <DialogDescription className="mt-0.5 text-gray-500">
                {currentStep === "select" && "选择需要优化的章节"}
                {currentStep === "processing" && "AI 正在逐章优化排版..."}
                {currentStep === "complete" && "优化任务已完成"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50/30 relative">
          <AnimatePresence mode="wait">
            {/* 选择章节阶段 */}
            {currentStep === "select" && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white/50">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedChapters.length === chapters.length}
                      onCheckedChange={toggleAll}
                      id="select-all"
                      className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer text-gray-700">
                      全选 ({selectedChapters.length}/{chapters.length})
                    </label>
                  </div>
                  <span className="text-xs text-gray-400">
                    已选 {selectedChapters.length} 章
                  </span>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2">
                    {chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border",
                          selectedChapters.includes(chapter.id)
                            ? "bg-blue-50/50 border-blue-100"
                            : "bg-white border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
                        )}
                      >
                        <Checkbox
                          checked={selectedChapters.includes(chapter.id)}
                          onCheckedChange={() => toggleChapter(chapter.id)}
                          id={`chapter-${chapter.id}`}
                          className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <label
                          htmlFor={`chapter-${chapter.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-800">{chapter.title}</span>
                            {chapter.is_branch && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100">分支</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {chapter.word_count.toLocaleString()} 字
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {/* 处理中阶段 */}
            {currentStep === "processing" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="p-8 text-center bg-white/50 border-b border-gray-100">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="relative bg-white rounded-full p-3 shadow-sm border border-blue-100">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">正在优化章节格式</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    AI 正在逐个处理，请稍候... ({successCount + errorCount} / {results.length})
                  </p>
                  <Progress value={progress} className="h-2 w-64 mx-auto bg-gray-100" />
                </div>

                <ScrollArea className="flex-1 bg-gray-50/50">
                  <div className="p-4 space-y-2">
                    {results.map((result) => {
                      const chapter = chapters.find((c) => c.id === result.chapterId);
                      return (
                        <div
                          key={result.chapterId}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 shadow-sm"
                        >
                          {result.status === "pending" && (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                          )}
                          {result.status === "processing" && (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          )}
                          {result.status === "success" && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                          {result.status === "error" && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium text-sm truncate",
                              result.status === "pending" ? "text-gray-400" : "text-gray-700"
                            )}>
                              {chapter?.title}
                            </div>
                            {result.error && (
                              <div className="text-xs text-red-500 mt-0.5 truncate">{result.error}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {/* 完成阶段 */}
            {currentStep === "complete" && (
              <motion.div 
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col"
              >
                <div className="p-8 text-center bg-green-50/50 border-b border-green-100">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-1">优化完成</h3>
                  <p className="text-green-700/80 text-sm">
                    成功 {successCount} 个 · 失败 {errorCount} 个
                  </p>
                </div>

                <ScrollArea className="flex-1 bg-white/50">
                  <div className="p-4 space-y-2">
                    {results.map((result) => {
                      const chapter = chapters.find((c) => c.id === result.chapterId);
                      return (
                        <div
                          key={result.chapterId}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                        >
                          {result.status === "success" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-800">{chapter?.title}</div>
                            {result.changesSummary ? (
                              <div className="text-xs text-gray-500 mt-0.5 truncate">{result.changesSummary}</div>
                            ) : result.error ? (
                              <div className="text-xs text-red-500 mt-0.5 truncate">{result.error}</div>
                            ) : null}
                          </div>

                          {result.status === "success" && (
                            <button
                              onClick={() => onPreview(result.chapterId)}
                              className="px-3 py-1.5 rounded-md bg-gray-50 text-gray-600 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              预览
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-white/50 backdrop-blur-md border-t border-gray-100 flex-shrink-0 gap-3">
          {currentStep === "select" && (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-ios-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStartOptimize}
                disabled={selectedChapters.length === 0}
                className="px-6 py-2.5 rounded-ios-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                开始优化 ({selectedChapters.length})
              </button>
            </>
          )}
          
          {currentStep === "processing" && (
            <button disabled className="px-6 py-2.5 rounded-ios-lg bg-gray-100 text-gray-400 text-sm font-medium flex items-center gap-2 cursor-not-allowed">
              <Loader2 className="w-4 h-4 animate-spin" />
              后台处理中...
            </button>
          )}

          {currentStep === "complete" && (
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-ios-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              完成
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}