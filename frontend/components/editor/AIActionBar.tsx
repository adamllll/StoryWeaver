/**
 * AI 操作栏组件
 */

"use client";

import {
  Wand2,
  FileText,
  RefreshCw,
  Sparkles,
  AlignJustify,
  Send,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CONTINUE_STYLES, REWRITE_STYLES } from "./hooks/useAIAssistant";
import { Chapter } from "@/lib/types";

interface AIActionBarProps {
  // 状态
  selectedText: string;
  customPrompt: string;
  isAILoading: boolean;
  isOptimizing: boolean;
  currentChapter: Chapter | null;

  // 方法
  onClearSelectedText: () => void;
  onCustomPromptChange: (value: string) => void;
  onCustomSubmit: () => void;
  onContinue: (style: string) => void;
  onGenerateChapter: () => void;
  onExpand: () => void;
  onRewrite: (style: string) => void;
  onOptimizeFormat: () => void;
}

export function AIActionBar({
  selectedText,
  customPrompt,
  isAILoading,
  isOptimizing,
  currentChapter,
  onClearSelectedText,
  onCustomPromptChange,
  onCustomSubmit,
  onContinue,
  onGenerateChapter,
  onExpand,
  onRewrite,
  onOptimizeFormat,
}: AIActionBarProps) {
  return (
    <div className="flex-shrink-0 p-4 pt-2 bg-gradient-to-t from-white/80 via-white/50 to-transparent backdrop-blur-sm z-20">
      {/* 上下文快捷操作栏 (Context Actions) */}
      <AnimatePresence mode="wait">
        {selectedText.length >= 5 ? (
          <motion.div
            key="selection-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3 p-3 bg-purple-50/80 backdrop-blur-md rounded-ios-xl border border-purple-100 shadow-ios-elevated"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                已选中 {selectedText.length} 字
              </span>
              <button onClick={onClearSelectedText} className="text-purple-400 hover:text-purple-600">
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* 重写 */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white rounded-ios-lg text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors shadow-sm border border-purple-100">
                    <RefreshCw className="w-3.5 h-3.5" />
                    重写...
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1 glass" side="top">
                  <p className="text-[10px] text-gray-500 px-3 py-1.5 font-medium border-b border-gray-100 mb-1">
                    选择重写风格
                  </p>
                  {REWRITE_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => onRewrite(style)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors"
                    >
                      {style}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* 扩写 */}
              <button
                onClick={onExpand}
                disabled={isAILoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white rounded-ios-lg text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors shadow-sm border border-purple-100"
              >
                <FileText className="w-3.5 h-3.5" />
                扩写
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="default-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3 grid grid-cols-2 gap-2"
          >
            {/* 续写 */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  disabled={isAILoading || !currentChapter}
                  className="flex items-center justify-center gap-2 col-span-2 py-2 rounded-ios-lg bg-white/60 hover:bg-white/80 border border-white/60 text-gray-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-semibold">智能续写</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1 glass" side="top">
                {CONTINUE_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => onContinue(style)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors"
                  >
                    {style}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* 生成整章 */}
            <button
              onClick={onGenerateChapter}
              disabled={isAILoading || !currentChapter}
              className="flex items-center justify-center gap-2 col-span-2 py-2 rounded-ios-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/50 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              生成整章内容
            </button>

            {/* 格式优化 */}
            <button
              onClick={onOptimizeFormat}
              disabled={isAILoading || isOptimizing || !currentChapter}
              className="flex items-center justify-center gap-2 col-span-2 py-2 rounded-ios-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/50 text-xs font-medium transition-colors"
            >
              <AlignJustify className="w-3 h-3" />
              优化章节格式
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部输入框 */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCustomSubmit()}
          placeholder="告诉 AI 你的想法..."
          className="w-full pl-4 pr-10 py-3 rounded-ios-xl bg-white/70 border-white/50 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all text-sm shadow-ios-inner"
          disabled={isAILoading}
        />
        <button
          onClick={onCustomSubmit}
          disabled={!customPrompt.trim() || isAILoading}
          className="absolute right-2 p-1.5 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
