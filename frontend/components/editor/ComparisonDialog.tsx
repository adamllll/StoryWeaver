/**
 * 格式优化对比预览弹窗 - Zen-iOS Hybrid 重构版
 * 
 * 核心特性：
 * - 沉浸式左右/上下对比视图
 * - iOS 风格的分段控制器 (Segmented Control)
 * - 细腻的排版与毛玻璃背景
 */

"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { Check, Loader2, ArrowLeftRight, Columns, Rows } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  optimizedContent: string;
  changesSummary: string;
  onApply: () => void;
  isLoading?: boolean;
}

export function ComparisonDialog({
  isOpen,
  onClose,
  originalContent,
  optimizedContent,
  changesSummary,
  onApply,
  isLoading = false,
}: ComparisonDialogProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "stacked">("side-by-side");

  // 将 HTML 转换为纯文本用于显示
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const originalText = stripHtml(originalContent);
  const optimizedHtml = markdownToHtml(optimizedContent);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 gap-0 bg-white/80 backdrop-blur-3xl border-white/40 shadow-ios-float overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-gray-100/50 bg-white/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <div className="w-8 h-8 rounded-ios-md bg-purple-100 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                </div>
                格式优化预览
              </DialogTitle>
              <DialogDescription className="mt-1 text-gray-500">
                AI 已优化文本格式，请审阅变更内容
              </DialogDescription>
            </div>

            {/* iOS Style Segmented Control */}
            <div className="bg-gray-100/80 p-1 rounded-lg flex items-center gap-1">
              <button
                onClick={() => setViewMode("side-by-side")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-200",
                  viewMode === "side-by-side" 
                    ? "bg-white text-purple-700 shadow-sm" 
                    : "text-gray-500 hover:bg-gray-200/50"
                )}
              >
                <Columns className="w-3.5 h-3.5" />
                左右对比
              </button>
              <button
                onClick={() => setViewMode("stacked")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-200",
                  viewMode === "stacked" 
                    ? "bg-white text-purple-700 shadow-sm" 
                    : "text-gray-500 hover:bg-gray-200/50"
                )}
              >
                <Rows className="w-3.5 h-3.5" />
                上下对比
              </button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
            <p className="text-gray-500 font-medium">AI 正在精心优化排版...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden relative bg-gray-50/30 flex flex-col">
            
            {/* 优化摘要 Banner */}
            {changesSummary && (
              <div className="px-6 py-3 bg-purple-50/50 border-b border-purple-100/50 flex items-start gap-3 flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-purple-800 leading-relaxed">{changesSummary}</p>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-6">
              <AnimatePresence mode="wait">
                {viewMode === "side-by-side" ? (
                  <motion.div 
                    key="side"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 gap-6 h-full"
                  >
                    {/* 原文 */}
                    <div className="flex flex-col rounded-ios-xl overflow-hidden border border-gray-200/60 bg-white shadow-sm h-full">
                      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Original / 原文
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
                        <div className="prose prose-sm max-w-none text-gray-600 font-serif leading-loose whitespace-pre-wrap">
                          {originalText}
                        </div>
                      </div>
                    </div>

                    {/* 优化后 */}
                    <div className="flex flex-col rounded-ios-xl overflow-hidden border border-purple-200/60 bg-white shadow-md shadow-purple-100/50 h-full relative">
                      <div className="bg-gradient-to-r from-purple-50 to-white px-4 py-3 border-b border-purple-100 text-xs font-bold text-purple-700 uppercase tracking-wider flex justify-between items-center">
                        <span>Optimized / 优化后</span>
                        <span className="bg-purple-200 text-purple-800 text-[10px] px-1.5 py-0.5 rounded">Preview</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white/60">
                        <div
                          className="prose prose-sm max-w-none text-gray-800 font-serif leading-loose"
                          dangerouslySetInnerHTML={{ __html: optimizedHtml }}
                        />
                      </div>
                      {/* 装饰性光晕 */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300/10 blur-3xl pointer-events-none" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="stacked"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2"
                  >
                     {/* 原文 */}
                     <div className="flex flex-col rounded-ios-xl overflow-hidden border border-gray-200/60 bg-white shadow-sm flex-shrink-0">
                      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Original / 原文
                      </div>
                      <div className="p-5 bg-white max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div className="prose prose-sm max-w-none text-gray-600 font-serif leading-loose whitespace-pre-wrap">
                          {originalText}
                        </div>
                      </div>
                    </div>

                    {/* 优化后 */}
                    <div className="flex flex-col rounded-ios-xl overflow-hidden border border-purple-200/60 bg-white shadow-md shadow-purple-100/50 flex-1 min-h-[300px]">
                      <div className="bg-gradient-to-r from-purple-50 to-white px-4 py-3 border-b border-purple-100 text-xs font-bold text-purple-700 uppercase tracking-wider">
                         Optimized / 优化后
                      </div>
                      <div className="flex-1 p-5 bg-white/60 overflow-y-auto custom-scrollbar">
                        <div
                          className="prose prose-sm max-w-none text-gray-800 font-serif leading-loose"
                          dangerouslySetInnerHTML={{ __html: optimizedHtml }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-white/50 backdrop-blur-md border-t border-gray-100 flex-shrink-0 gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-ios-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onApply}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-ios-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            确认并应用
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SparklesIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
