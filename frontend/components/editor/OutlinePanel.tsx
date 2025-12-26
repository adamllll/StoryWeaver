/**
 * 大纲面板组件
 * 展示小说大纲（纯展示组件）
 */

"use client";

import { BookOpen } from "lucide-react";
import { OutlinePanelProps } from "@/lib/types";
import { markdownToHtml } from "@/lib/markdown";

export function OutlinePanel({ outline }: OutlinePanelProps) {
  // 如果没有大纲，不渲染
  if (!outline) {
    return null;
  }

  return (
    <div className="glass rounded-ios-xl overflow-hidden flex flex-col min-h-96 max-h-[600px]">
      {/* 标题栏 - 更醒目的设计 */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-white/60">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-ios-lg bg-purple-100 flex items-center justify-center mr-3">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-800">小说大纲</h2>
            <p className="text-xs text-gray-500 mt-0.5">Story Outline</p>
          </div>
        </div>
      </div>

      {/* 大纲内容 - 更宽松的布局和更大的字体 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        <div
          className="prose prose-sm max-w-none text-gray-700 leading-loose font-serif
                     [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-purple-700 [&_h1]:mt-4 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-purple-200
                     [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-purple-600 [&_h2]:mt-3 [&_h2]:mb-2
                     [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mt-2 [&_h3]:mb-1.5
                     [&_p]:text-sm [&_p]:text-gray-600 [&_p]:mb-3 [&_p]:leading-relaxed
                     [&_ul]:text-sm [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:space-y-1.5
                     [&_ol]:text-sm [&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:space-y-1.5
                     [&_li]:text-gray-600 [&_li]:leading-relaxed
                     [&_li::marker]:text-purple-500
                     [&_strong]:font-bold [&_strong]:text-gray-800
                     [&_em]:italic [&_em]:text-gray-600
                     [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(outline) }}
        />
      </div>
    </div>
  );
}
