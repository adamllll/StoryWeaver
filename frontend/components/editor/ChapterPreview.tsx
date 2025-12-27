/**
 * 章节缩略预览组件 - 悬停显示预览
 */

"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ChapterSummary } from "@/lib/types";
import { FileText, TrendingUp } from "lucide-react";

interface ChapterPreviewProps {
  chapter: ChapterSummary;
  children: React.ReactNode;
  fullContent?: string; // 完整内容（可选，需要时通过 API 获取）
}

export function ChapterPreview({
  chapter,
  children,
  fullContent,
}: ChapterPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 提取前 300 字作为预览
  const previewText = fullContent
    ? fullContent.slice(0, 300) + (fullContent.length > 300 ? "..." : "")
    : "暂无内容预览";

  return (
    <HoverCard openDelay={300} closeDelay={100} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        alignOffset={-20}
        className="w-96 p-0 bg-white/95 backdrop-blur-xl border-2 border-purple-200 shadow-2xl rounded-2xl z-[100]"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <div className="p-5">
          {/* 标题 */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-1">
                {chapter.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {chapter.is_branch && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    🌿 分支
                  </span>
                )}
                {chapter.choice_text && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold truncate">
                    ↳ {chapter.choice_text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 内容预览 */}
          <div className="mb-4 p-4 bg-gray-50/80 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-6">
              {previewText}
            </p>
          </div>

          {/* 元数据 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>字数</span>
              </div>
              <span className="font-bold text-gray-900">
                {chapter.word_count.toLocaleString()} 字
              </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>完成度</span>
              <span className="font-bold">
                {Math.min(100, Math.floor((chapter.word_count / 3000) * 100))}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (chapter.word_count / 3000) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              目标 3,000 字 · 已完成 {chapter.word_count.toLocaleString()} 字
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
