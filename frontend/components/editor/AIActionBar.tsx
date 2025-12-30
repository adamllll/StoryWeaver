/**
 * AI 操作栏组件 - Zen-iOS 重构版
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  FileText,
  RefreshCw,
  Sparkles,
  AlignJustify,
  Send,
  X,
  ChevronDown,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTINUE_STYLES, REWRITE_STYLES } from "./hooks/useAIAssistant";
import { Chapter } from "@/lib/types";

interface AIActionBarProps {
  // 状态
  selectedText: string;
  customPrompt: string;
  isAILoading: boolean;
  isOptimizing: boolean;
  currentChapter: Chapter | null;
  canRetry?: boolean;  // 是否可以重试

  // 方法
  onClearSelectedText: () => void;
  onCustomPromptChange: (value: string) => void;
  onCustomSubmit: () => void;
  onContinue: (style: string) => void;
  onGenerateChapter: () => void;
  onExpand: () => void;
  onRewrite: (style: string) => void;
  onOptimizeFormat: () => void;
  onRetry?: () => void;  // 重试回调
}

export function AIActionBar({
  selectedText,
  customPrompt,
  isAILoading,
  isOptimizing,
  currentChapter,
  canRetry,
  onClearSelectedText,
  onCustomPromptChange,
  onCustomSubmit,
  onContinue,
  onGenerateChapter,
  onExpand,
  onRewrite,
  onOptimizeFormat,
  onRetry,
}: AIActionBarProps) {
  const hasSelection = selectedText.length >= 5;

  // 动画变体
  const panelVariants = {
    hidden: { opacity: 0, height: 0, y: 10 },
    visible: { opacity: 1, height: "auto", y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    exit: { opacity: 0, height: 0, y: -10 }
  };

  return (
    <div className="flex-shrink-0 p-4 pt-2 bg-gradient-to-t from-white/90 via-white/60 to-transparent backdrop-blur-sm z-20">
      <AnimatePresence mode="wait">
        {/* 选中文本时的操作栏 */}
        {hasSelection ? (
          <motion.div
            key="selection-actions"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-3"
          >
            <div className="p-3 bg-purple-50/80 backdrop-blur-xl rounded-ios-xl border border-purple-100 shadow-ios-elevated overflow-hidden">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                    已选中 {selectedText.length} 字
                  </span>
                </div>
                <button 
                  onClick={onClearSelectedText} 
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-purple-100 text-purple-400 hover:text-purple-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 重写下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white rounded-ios-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 hover:shadow-sm border border-purple-100/50 transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      重写
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-white/80 backdrop-blur-2xl border-white/40 shadow-ios-float p-1.5 rounded-xl">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 mb-1">
                      选择重写风格
                    </div>
                    {REWRITE_STYLES.map((style) => (
                      <DropdownMenuItem
                        key={style}
                        onClick={() => onRewrite(style)}
                        className="text-xs font-medium text-gray-700 rounded-lg py-2 px-3 my-0.5 focus:bg-purple-500 focus:text-white cursor-pointer transition-colors"
                      >
                        {style}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 扩写按钮 */}
                <button
                  onClick={onExpand}
                  disabled={isAILoading}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white rounded-ios-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 hover:shadow-sm border border-purple-100/50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  扩写
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 默认操作栏 */
          <motion.div
            key="default-actions"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-3 grid grid-cols-2 gap-2"
          >
            {/* 智能续写下拉 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isAILoading || !currentChapter}
                  className="col-span-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-ios-lg bg-white/80 hover:bg-white border border-white/60 text-gray-700 shadow-sm hover:shadow-md hover:text-purple-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Wand2 className="w-4 h-4 text-purple-500 group-hover:rotate-12 transition-transform" />
                  <span className="text-xs font-bold">智能续写</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-white/80 backdrop-blur-2xl border-white/40 shadow-ios-float p-1.5 rounded-xl">
                <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 mb-1">
                  选择续写风格
                </div>
                {CONTINUE_STYLES.map((style) => (
                  <DropdownMenuItem
                    key={style}
                    onClick={() => onContinue(style)}
                    className="text-xs font-medium text-gray-700 rounded-lg py-2 px-3 my-0.5 focus:bg-purple-500 focus:text-white cursor-pointer transition-colors"
                  >
                    {style}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 生成整章 */}
            <button
              onClick={onGenerateChapter}
              disabled={isAILoading || !currentChapter}
              className="flex items-center justify-center gap-2 col-span-2 py-2.5 rounded-ios-lg bg-white/40 text-gray-600 hover:bg-white/60 hover:text-gray-900 border border-white/40 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              生成整章
            </button>

            {/* 格式优化 */}
            <button
              onClick={onOptimizeFormat}
              disabled={isAILoading || isOptimizing || !currentChapter}
              className="flex items-center justify-center gap-2 col-span-2 py-2.5 rounded-ios-lg bg-white/40 text-gray-600 hover:bg-white/60 hover:text-gray-900 border border-white/40 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <AlignJustify className="w-3.5 h-3.5 text-blue-500" />
              优化排版
            </button>

            {/* 重新生成按钮 - 仅在有可重试错误时显示 */}
            {canRetry && onRetry && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onRetry}
                disabled={isAILoading}
                className="flex items-center justify-center gap-2 col-span-2 py-2.5 rounded-ios-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新生成
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部输入框 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 rounded-ios-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
        <div className="relative flex items-center">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCustomSubmit()}
            placeholder="告诉 AI 你的想法..."
            className="w-full pl-4 pr-10 py-3.5 rounded-ios-xl bg-white/80 border border-white/60 focus:bg-white focus:border-purple-200 focus:ring-2 focus:ring-purple-100 transition-all text-sm shadow-sm placeholder:text-gray-400"
            disabled={isAILoading}
          />
          <button
            onClick={onCustomSubmit}
            disabled={!customPrompt.trim() || isAILoading}
            className="absolute right-2 p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {isAILoading ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
